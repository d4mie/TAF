#!/usr/bin/env node

/**
 * Upload Images to Cloudflare R2 with Custom Domain
 * 
 * Usage:
 * node scripts/upload-to-r2.js <image-path> [options]
 * 
 * Options:
 * --folder <folder-name>  Specify folder name in R2 bucket
 * --quality <number>      Image quality (1-100, default: 85)
 * --format <format>       Output format (webp, jpeg, png, default: webp)
 * --resize <width>x<height> Resize image (e.g., 1200x800)
 */

const fs = require('fs');
const path = require('path');
const { uploadImage, generatePresignedUploadUrl } = require('../config/r2-config');
const sharp = require('sharp');

// Parse command line arguments
const args = process.argv.slice(2);
const imagePath = args[0];

if (!imagePath) {
  console.error('❌ Error: Please provide an image path');
  console.log('Usage: node scripts/upload-to-r2.js <image-path> [options]');
  process.exit(1);
}

// Parse options
const options = {
  folder: 'uploads',
  quality: 85,
  format: 'webp',
  resize: null
};

for (let i = 1; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];
  
  switch (flag) {
    case '--folder':
      options.folder = value;
      break;
    case '--quality':
      options.quality = parseInt(value);
      break;
    case '--format':
      options.format = value;
      break;
    case '--resize':
      options.resize = value;
      break;
  }
}

// Validate image file
if (!fs.existsSync(imagePath)) {
  console.error(`❌ Error: Image file not found: ${imagePath}`);
  process.exit(1);
}

const fileExtension = path.extname(imagePath).toLowerCase();
const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'];

if (!supportedFormats.includes(fileExtension)) {
  console.error(`❌ Error: Unsupported image format: ${fileExtension}`);
  console.log('Supported formats:', supportedFormats.join(', '));
  process.exit(1);
}

async function optimizeAndUploadImage() {
  try {
    console.log('🚀 Starting image upload process...');
    console.log(`📁 Source: ${imagePath}`);
    console.log(`📂 Folder: ${options.folder}`);
    console.log(`🎨 Format: ${options.format}`);
    console.log(`⚡ Quality: ${options.quality}%`);
    
    if (options.resize) {
      console.log(`📏 Resize: ${options.resize}`);
    }

    // Read the original image
    const originalBuffer = fs.readFileSync(imagePath);
    const originalStats = fs.statSync(imagePath);
    console.log(`📊 Original size: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Process image with Sharp
    let sharpInstance = sharp(originalBuffer);
    
    // Resize if specified
    if (options.resize) {
      const [width, height] = options.resize.split('x').map(Number);
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert format and apply quality
    let processedBuffer;
    const outputFormat = options.format.toLowerCase();
    
    switch (outputFormat) {
      case 'webp':
        processedBuffer = await sharpInstance
          .webp({ quality: options.quality })
          .toBuffer();
        break;
      case 'jpeg':
      case 'jpg':
        processedBuffer = await sharpInstance
          .jpeg({ quality: options.quality, progressive: true })
          .toBuffer();
        break;
      case 'png':
        processedBuffer = await sharpInstance
          .png({ quality: options.quality, progressive: true })
          .toBuffer();
        break;
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    // Generate filename
    const originalName = path.basename(imagePath, fileExtension);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newExtension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const fileName = `${originalName}-${timestamp}.${newExtension}`;
    const key = `${options.folder}/${fileName}`;

    console.log(`📝 Generated key: ${key}`);

    // Upload to R2
    console.log('☁️  Uploading to Cloudflare R2...');
    const uploadResult = await uploadImage(processedBuffer, key, `image/${outputFormat}`);

    if (uploadResult.success) {
      const processedSize = (processedBuffer.length / 1024 / 1024).toFixed(2);
      const compressionRatio = ((1 - processedBuffer.length / originalStats.size) * 100).toFixed(1);
      
      console.log('✅ Upload successful!');
      console.log(`🔗 Public URL: ${uploadResult.url}`);
      console.log(`📊 Processed size: ${processedSize} MB`);
      console.log(`🗜️  Compression: ${compressionRatio}% smaller`);
      console.log(`🌐 Custom domain: ${uploadResult.url}`);
      
      // Generate HTML snippet
      console.log('\n📋 HTML snippet:');
      console.log(`<img src="${uploadResult.url}" alt="Description" loading="lazy" decoding="async" />`);
      
      // Generate Fancybox gallery snippet
      console.log('\n🖼️  Fancybox gallery snippet:');
      console.log(`<a href="${uploadResult.url}" data-fancybox="gallery">`);
      console.log(`  <img src="${uploadResult.url}" alt="Description" loading="lazy" decoding="async" />`);
      console.log(`</a>`);
      
    } else {
      console.error('❌ Upload failed:', uploadResult.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error processing image:', error.message);
    process.exit(1);
  }
}

// Run the upload process
optimizeAndUploadImage();
