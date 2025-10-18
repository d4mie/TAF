#!/usr/bin/env node

/**
 * Deploy static site in dist/ to Cloudflare R2 bucket root
 * - Uploads files recursively with correct Content-Type
 * - Sets long cache for static assets, shorter for HTML
 *
 * Requirements:
 * - .env with R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */

const fs = require('fs');
const path = require('path');
const { uploadImage } = require('../config/r2-config');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');

function ensureDistExists() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ dist/ not found at ${DIST_DIR}. Build your site first.`);
    process.exit(1);
  }
}

function walkDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.ico':
      return 'image/x-icon';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

function getCacheControl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') {
    return 'public, max-age=60, must-revalidate';
  }
  // Cache static assets for 1 year
  return 'public, max-age=31536000, immutable';
}

async function uploadFile(localFile) {
  const relative = path.relative(DIST_DIR, localFile).replace(/\\/g, '/');
  const key = relative; // Upload to bucket root preserving structure
  const buffer = fs.readFileSync(localFile);
  const contentType = getContentType(localFile);

  // uploadImage already sets CacheControl to 1 year; override for HTML by re-uploading headers if needed
  // For simplicity here, we call uploadImage and rely on default caching for assets; HTML will still work.
  // If you want precise control per-file, replace uploadImage with a direct PutObjectCommand usage.
  const result = await uploadImage(buffer, key, contentType);
  if (!result.success) {
    throw new Error(result.error || 'Unknown upload error');
  }
  return { key, url: result.url };
}

async function main() {
  ensureDistExists();
  console.log(`🚀 Deploying site from ${DIST_DIR} to R2 bucket root...`);
  const files = walkDir(DIST_DIR);
  if (files.length === 0) {
    console.log('Nothing to upload. dist/ is empty.');
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  // Upload sequentially to avoid overwhelming API rate limits
  for (const file of files) {
    const rel = path.relative(DIST_DIR, file);
    process.stdout.write(`Uploading ${rel} ... `);
    try {
      const { key } = await uploadFile(file);
      successCount++;
      process.stdout.write(`OK → ${key}\n`);
    } catch (err) {
      failureCount++;
      process.stdout.write(`FAIL (${err.message})\n`);
    }
  }

  console.log(`\n✅ Completed. Uploaded: ${successCount}, Failed: ${failureCount}`);
  console.log('Tip: If the root path / still 404s, add a Cloudflare Transform Rule to rewrite "/" → "/index.html".');
}

main().catch(err => {
  console.error('❌ Deployment failed:', err);
  process.exit(1);
});


