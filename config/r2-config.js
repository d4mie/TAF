// Cloudflare R2 Configuration
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// R2 Configuration
const r2Config = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  customDomain: 'theayofolahan.com',
  publicUrl: 'https://theayofolahan.com'
};

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
