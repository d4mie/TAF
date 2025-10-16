#!/usr/bin/env node

/**
 * Generate a portfolio index from a Cloudflare R2 bucket.
 *
 * Outputs dist/portfolio-index.json with this structure:
 * {
 *   "generatedAt": "2025-01-01T00:00:00.000Z",
 *   "bucketName": "<bucket>",
 *   "bucketBaseURL": "https://<public>.r2.dev/",
 *   "folders": {
 *     "FOLDER_NAME": ["image1.jpg", "image2.png"],
 *     ...
 *   }
 * }
 *
 * Environment variables (required unless you only want to reuse an existing index):
 * - R2_ACCOUNT_ID: Cloudflare account id
 * - R2_ACCESS_KEY_ID: Access key id
 * - R2_SECRET_ACCESS_KEY: Secret
 * - R2_BUCKET: Bucket name
 * Optional:
 * - R2_ENDPOINT: Override endpoint (defaults to https://<account>.r2.cloudflarestorage.com)
 * - R2_PUBLIC_BASE_URL: Base public URL for images (defaults to current r2.dev URL in site)
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const OUTPUT_FILE = path.resolve(__dirname, "../dist/portfolio-index.json");

async function main() {
  const bucket = process.env.R2_BUCKET;
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketBaseURL = process.env.R2_PUBLIC_BASE_URL || "https://pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/";

  if (!bucket) {
    console.error("R2_BUCKET is required");
    process.exit(1);
  }
  if (!accessKeyId || !secretAccessKey) {
    console.error("R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required");
    process.exit(1);
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const allKeys = await listAllKeys(s3, bucket);
  const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".JPG", ".JPEG", ".PNG", ".WEBP", ".GIF"]);

  const folders = {};
  for (const key of allKeys) {
    if (!key.includes("/")) continue; // skip any keys not under a folder
    const [folder, ...rest] = key.split("/");
    const fileName = rest.join("/");
    if (!fileName) continue; // skip folder placeholders
    if (!imageExtensions.has(path.extname(fileName))) continue; // only images

    if (!folders[folder]) folders[folder] = new Set();
    folders[folder].add(fileName.split("/").pop()); // only leaf filename
  }

  // Convert Sets to sorted arrays
  const foldersSorted = {};
  Object.keys(folders)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .forEach((folder) => {
      foldersSorted[folder] = Array.from(folders[folder]).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    });

  const output = {
    generatedAt: new Date().toISOString(),
    bucketName: bucket,
    bucketBaseURL,
    folders: foldersSorted,
  };

  // Ensure dist directory exists
  const distDir = path.dirname(OUTPUT_FILE);
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + "\n");

  console.log(`Wrote ${OUTPUT_FILE}`);
}

async function listAllKeys(s3, bucket) {
  let continuationToken;
  const keys = [];
  do {
    const resp = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken })
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

