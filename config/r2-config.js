// Cloudflare R2 Configuration
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from project root reliably, even when this file is required from subfolders
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// R2 Configuration
const r2Config = {
  // Allow a few alternate env names for convenience
  accountId: process.env.R2_ACCOUNT_ID || process.env.CF_R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.CF_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.CF_R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || process.env.CF_R2_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.BUCKET_NAME,
  customDomain: process.env.R2_CUSTOM_DOMAIN || 'theayofolahan.com',
  publicUrl: process.env.R2_PUBLIC_URL || 'https://theayofolahan.com'
};

// Validate required configuration up front for clearer errors
const missingKeys = ['accountId', 'accessKeyId', 'secretAccessKey', 'bucketName']
  .filter((key) => !r2Config[key] || String(r2Config[key]).trim() === '');

if (missingKeys.length > 0) {
  const prettyList = missingKeys
    .map((k) => {
      switch (k) {
        case 'accountId': return 'R2_ACCOUNT_ID';
        case 'accessKeyId': return 'R2_ACCESS_KEY_ID (or AWS_ACCESS_KEY_ID)';
        case 'secretAccessKey': return 'R2_SECRET_ACCESS_KEY (or AWS_SECRET_ACCESS_KEY)';
        case 'bucketName': return 'R2_BUCKET_NAME';
        default: return k;
      }
    })
    .join(', ');

  const hint = `Missing R2 configuration: ${prettyList}.\n` +
    `Create a .env file at project root with:\n` +
    `R2_ACCOUNT_ID=your_account_id\nR2_ACCESS_KEY_ID=your_access_key\nR2_SECRET_ACCESS_KEY=your_secret\nR2_BUCKET_NAME=your_bucket`;
  throw new Error(hint);
}

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

// Image optimization settings
const imageOptimization = {
  // WebP conversion for better compression
  webp: {
    quality: 85,
    enabled: true
  },
  // Responsive image sizes
  sizes: {
    thumbnail: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
    original: { width: null, height: null }
  },
  // Lazy loading settings
  lazyLoading: {
    enabled: true,
    threshold: 0.1,
    rootMargin: '50px'
  }
};

// Generate optimized image URL
function getOptimizedImageUrl(imagePath, options = {}) {
  const {
    size = 'original',
    format = 'webp',
    quality = imageOptimization.webp.quality
  } = options;

  // Use custom domain for faster loading
  const baseUrl = r2Config.publicUrl;
  
  // Handle different image paths
  let cleanPath = imagePath;
  if (imagePath.includes('pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/')) {
    // Extract path from old R2 URL
    cleanPath = imagePath.split('pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/')[1];
  } else if (imagePath.startsWith('/')) {
    // Remove leading slash
    cleanPath = imagePath.substring(1);
  }

  // For now, return the custom domain URL
  // In production, you might want to implement Cloudflare Image Resizing
  return `${baseUrl}/${cleanPath}`;
}

// Generate responsive image URLs
function getResponsiveImageUrls(imagePath) {
  const basePath = imagePath.replace('pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/', '');
  
  return {
    thumbnail: getOptimizedImageUrl(basePath, { size: 'thumbnail' }),
    medium: getOptimizedImageUrl(basePath, { size: 'medium' }),
    large: getOptimizedImageUrl(basePath, { size: 'large' }),
    original: getOptimizedImageUrl(basePath, { size: 'original' })
  };
}

// Upload image to R2
async function uploadImage(file, key, contentType = 'image/jpeg') {
  try {
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      // Enable public access
      ACL: 'public-read',
      // Cache for 1 year
      CacheControl: 'public, max-age=31536000'
    });

    const result = await r2Client.send(command);
    return {
      success: true,
      url: `${r2Config.publicUrl}/${key}`,
      result
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Generate presigned URL for secure uploads
async function generatePresignedUploadUrl(key, contentType = 'image/jpeg', expiresIn = 3600) {
  try {
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return {
      success: true,
      presignedUrl,
      publicUrl: `${r2Config.publicUrl}/${key}`
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  r2Config,
  r2Client,
  imageOptimization,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  uploadImage,
  generatePresignedUploadUrl
};
