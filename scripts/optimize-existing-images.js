#!/usr/bin/env node

/**
 * Generate responsive WebP variants for existing images in Cloudflare R2.
 *
 * Why:
 * - If Cloudflare /cdn-cgi/image resizing is not available, the site can still
 *   load fast thumbnails by using pre-generated variants uploaded to R2.
 *
 * What it does:
 * - Lists objects in your R2 bucket
 * - For each original image key (jpg/jpeg/png/webp) it generates variants:
 *   <name>__w480.webp, <name>__w960.webp, <name>__w1600.webp
 * - Uploads variants back to the same folder in the bucket
 *
 * Notes:
 * - Variant files are ignored by scripts/generate-portfolio-index.js (so they
 *   won't show up as duplicate gallery entries).
 *
 * Usage:
 *   node scripts/optimize-existing-images.js
 *
 * Options:
 *   --widths 480,960,1600     Variant widths (default: 480,960,1600)
 *   --quality 82              WebP quality (default: 82)
 *   --concurrency 2           Parallel downloads/processes (default: 2)
 *   --prefix ACTIVEYARD/      Only process keys starting with this prefix
 *   --dry-run                 Don't upload, just print planned actions
 *   --overwrite               Regenerate even if variant key already exists
 */

const path = require('path');
const sharp = require('sharp');
const { ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { r2Client, r2Config, uploadImage } = require('../config/r2-config');

function parseArgs(argv) {
  const args = argv.slice(2);
  const out = {
    widths: [480, 960, 1600],
    quality: 82,
    concurrency: 2,
    prefix: '',
    dryRun: false,
    overwrite: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const flag = args[i];
    const value = args[i + 1];
    if (flag === '--widths') {
      out.widths = String(value || '')
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0);
      i += 1;
      continue;
    }
    if (flag === '--quality') {
      out.quality = parseInt(value, 10);
      i += 1;
      continue;
    }
    if (flag === '--concurrency') {
      out.concurrency = Math.max(1, parseInt(value, 10) || 1);
      i += 1;
      continue;
    }
    if (flag === '--prefix') {
      out.prefix = String(value || '');
      i += 1;
      continue;
    }
    if (flag === '--dry-run') {
      out.dryRun = true;
      continue;
    }
    if (flag === '--overwrite') {
      out.overwrite = true;
      continue;
    }
  }

  // Clamp quality
  if (!Number.isFinite(out.quality) || out.quality < 1 || out.quality > 100) {
    out.quality = 82;
  }
  // Sort and de-dupe widths
  out.widths = Array.from(new Set(out.widths)).sort((a, b) => a - b);

  return out;
}

function isOriginalImageKey(key) {
  if (!key || typeof key !== 'string') return false;
  // Must be under a "folder/" to match the site structure
  if (!key.includes('/')) return false;
  const ext = path.extname(key).toLowerCase();
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp']);
  if (!allowed.has(ext)) return false;
  // Ignore generated variants: name__w960.webp
  if (/__w\d+\.webp$/i.test(key)) return false;
  return true;
}

function buildVariantKey(originalKey, width) {
  const dir = path.posix.dirname(originalKey);
  const base = path.posix.basename(originalKey, path.posix.extname(originalKey));
  const variantName = `${base}__w${width}.webp`;
  return dir === '.' ? variantName : `${dir}/${variantName}`;
}

async function streamToBuffer(body) {
  if (!body) return Buffer.from([]);
  // AWS SDK v3 in Node returns a readable stream
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function listAllKeys(bucket, prefix) {
  let continuationToken;
  const keys = [];
  do {
    const resp = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: continuationToken,
      })
    );

    if (Array.isArray(resp.Contents)) {
      for (const obj of resp.Contents) {
        if (obj && obj.Key) keys.push(obj.Key);
      }
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

async function downloadObject(bucket, key) {
  const resp = await r2Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const buffer = await streamToBuffer(resp.Body);
  return buffer;
}

async function processOneKey({ bucket, key, widths, quality, existingKeys, dryRun, overwrite }) {
  const planned = widths.map((w) => ({ width: w, variantKey: buildVariantKey(key, w) }));
  const todo = overwrite
    ? planned
    : planned.filter(({ variantKey }) => !existingKeys.has(variantKey));

  if (todo.length === 0) {
    return { key, status: 'skipped', created: 0 };
  }

  if (dryRun) {
    return { key, status: 'dry-run', created: todo.length, variants: todo.map((t) => t.variantKey) };
  }

  const originalBuffer = await downloadObject(bucket, key);
  if (!originalBuffer || originalBuffer.length === 0) {
    return { key, status: 'failed', created: 0, error: 'Empty object body' };
  }

  // Prepare once; sharp instances are cheap but we want to ensure consistent decode.
  const baseImage = sharp(originalBuffer, { failOnError: false });

  let created = 0;
  for (const { width, variantKey } of todo) {
    // Resize "inside" to preserve aspect ratio and avoid upscaling.
    const variantBuffer = await baseImage
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    await uploadImage(variantBuffer, variantKey, 'image/webp', {
      cacheControl: 'public, max-age=31536000, immutable',
    });
    existingKeys.add(variantKey);
    created += 1;
  }

  return { key, status: 'ok', created };
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = [];
  let idx = 0;

  async function runOne() {
    while (idx < items.length) {
      const current = items[idx];
      idx += 1;
      // eslint-disable-next-line no-await-in-loop
      const res = await worker(current);
      results.push(res);
    }
  }

  const runners = Array.from({ length: Math.max(1, concurrency) }, () => runOne());
  await Promise.all(runners);
  return results;
}

async function main() {
  const opts = parseArgs(process.argv);
  const bucket = r2Config.bucketName;

  console.log('🖼️  R2 image variant generator');
  console.log(`- Bucket: ${bucket}`);
  console.log(`- Prefix filter: ${opts.prefix || '(none)'}`);
  console.log(`- Widths: ${opts.widths.join(', ')}`);
  console.log(`- WebP quality: ${opts.quality}`);
  console.log(`- Concurrency: ${opts.concurrency}`);
  console.log(`- Dry run: ${opts.dryRun ? 'yes' : 'no'}`);
  console.log(`- Overwrite: ${opts.overwrite ? 'yes' : 'no'}`);

  const allKeys = await listAllKeys(bucket, opts.prefix);
  const existingKeys = new Set(allKeys);

  const originals = allKeys.filter(isOriginalImageKey);
  if (originals.length === 0) {
    console.log('No original images found to process.');
    return;
  }

  console.log(`Found ${originals.length} original images to process.`);

  const results = await runWithConcurrency(
    originals,
    opts.concurrency,
    (key) =>
      processOneKey({
        bucket,
        key,
        widths: opts.widths,
        quality: opts.quality,
        existingKeys,
        dryRun: opts.dryRun,
        overwrite: opts.overwrite,
      })
  );

  const ok = results.filter((r) => r.status === 'ok').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const dry = results.filter((r) => r.status === 'dry-run').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const createdTotal = results.reduce((sum, r) => sum + (r.created || 0), 0);

  console.log('\n✅ Done');
  console.log(`- OK: ${ok}`);
  console.log(`- Skipped (already had variants): ${skipped}`);
  console.log(`- Dry-run: ${dry}`);
  console.log(`- Failed: ${failed}`);
  console.log(`- Variants created: ${createdTotal}`);

  if (failed > 0) {
    console.log('\nFailures:');
    results
      .filter((r) => r.status === 'failed')
      .slice(0, 20)
      .forEach((r) => console.log(`- ${r.key}: ${r.error || 'unknown error'}`));
    if (failed > 20) console.log(`...and ${failed - 20} more`);
  }

  console.log('\nNext steps:');
  console.log('- Refresh the website and check that thumbnail requests use "__w960.webp" (or similar).');
  console.log('- You do NOT need to redeploy dist/ for variants to work (these files were uploaded directly to R2).');
  console.log('- Only re-run `npm run generate:portfolio` + `npm run deploy:r2` if you added/removed original images.');
}

main().catch((err) => {
  console.error('❌ Failed:', err && err.message ? err.message : err);
  process.exit(1);
});

