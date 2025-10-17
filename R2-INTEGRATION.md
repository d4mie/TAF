# Cloudflare R2 Integration with Custom Domain

This project now includes a complete Cloudflare R2 integration with your custom domain `theayofolahan.com` for faster image loading and better performance.

## 🚀 Features

- **Custom Domain**: All images now use `https://theayofolahan.com/` instead of the default R2 domain
- **Image Optimization**: Automatic WebP conversion and compression
- **Lazy Loading**: Images load only when needed for better performance
- **Responsive Images**: Support for different screen sizes
- **Upload Script**: Easy command-line tool for uploading new images
- **Error Handling**: Fallback to original URLs if custom domain fails

## 📁 Files Added/Modified

### New Files:
- `config/r2-config.js` - R2 configuration and utilities
- `dist/js/image-optimizer.js` - Client-side image optimization
- `scripts/upload-to-r2.js` - Image upload script
- `.env.example` - Environment variables template

### Modified Files:
- `dist/index.html` - Updated image URLs and added optimization
- `dist/portfolio.html` - Updated image URLs and added optimization  
- `dist/contact.html` - Updated image URLs and added optimization
- `package.json` - Added Sharp dependency and new scripts

## ⚙️ Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your R2 credentials:
   ```env
   R2_ACCOUNT_ID=your_account_id_here
   R2_ACCESS_KEY_ID=your_access_key_here
   R2_SECRET_ACCESS_KEY=your_secret_access_key_here
   R2_BUCKET_NAME=your_bucket_name_here
   R2_CUSTOM_DOMAIN=theayofolahan.com
   R2_PUBLIC_URL=https://theayofolahan.com
   ```

3. **Verify Custom Domain Setup**:
   - Ensure your R2 bucket has the custom domain `theayofolahan.com` configured
   - Verify DNS settings point to your R2 bucket

## 🖼️ Uploading New Images

### Basic Upload:
```bash
npm run upload:image path/to/image.jpg
```

### Advanced Options:
```bash
# Upload with specific folder and quality
npm run upload:image path/to/image.jpg --folder "portfolio" --quality 90

# Upload with resize
npm run upload:image path/to/image.jpg --resize 1200x800 --format webp

# Upload to specific category folder
npm run upload:image path/to/image.jpg --folder "ACTIVEYARD" --quality 85
```

### Available Options:
- `--folder <name>`: Specify folder in R2 bucket (default: "uploads")
- `--quality <number>`: Image quality 1-100 (default: 85)
- `--format <format>`: Output format - webp, jpeg, png (default: webp)
- `--resize <width>x<height>`: Resize image (e.g., 1200x800)

## 🎯 Performance Optimizations

### Automatic Optimizations:
1. **Custom Domain**: Faster loading via `theayofolahan.com`
2. **WebP Format**: Better compression than JPEG/PNG
3. **Lazy Loading**: Images load only when visible
4. **Progressive Loading**: Smooth fade-in effects
5. **Error Handling**: Fallback to original URLs

### Manual Optimizations:
- Use the upload script for new images
- Specify appropriate quality settings (85-90 for photos)
- Use WebP format for best compression
- Resize large images before upload

## 🔧 Technical Details

### Image Processing:
- **Sharp**: High-performance image processing
- **WebP**: Modern format with 25-35% better compression
- **Progressive JPEG**: Better perceived loading performance
- **Responsive**: Multiple sizes for different devices

### Client-Side Features:
- **Intersection Observer**: Efficient lazy loading
- **Error Recovery**: Automatic fallback to original URLs
- **Fade-in Effects**: Smooth image appearance
- **Preloading**: Critical images load first

## 📊 Performance Benefits

- **Faster Loading**: Custom domain reduces DNS lookup time
- **Better Compression**: WebP format reduces file sizes by 25-35%
- **Improved UX**: Lazy loading and fade-in effects
- **Mobile Optimized**: Responsive images for all devices
- **SEO Friendly**: Proper alt tags and loading attributes

## 🛠️ Troubleshooting

### Images Not Loading:
1. Check if custom domain is properly configured in R2
2. Verify DNS settings for `theayofolahan.com`
3. Check browser console for errors
4. Ensure R2 bucket allows public access

### Upload Issues:
1. Verify `.env` file has correct credentials
2. Check R2 bucket permissions
3. Ensure Sharp is installed: `npm install sharp`
4. Check file format is supported

### Performance Issues:
1. Use appropriate quality settings (85-90 for photos)
2. Resize large images before upload
3. Use WebP format for best compression
4. Check network tab for loading times

## 📝 Usage Examples

### HTML Integration:
```html
<!-- Standard image -->
<img src="https://theayofolahan.com/portfolio/image.jpg" 
     alt="Description" 
     loading="lazy" 
     decoding="async" />

<!-- Fancybox gallery -->
<a href="https://theayofolahan.com/portfolio/image.jpg" data-fancybox="gallery">
  <img src="https://theayofolahan.com/portfolio/image.jpg" 
       alt="Description" 
       loading="lazy" 
       decoding="async" />
</a>
```

### JavaScript Integration:
```javascript
// The image optimizer automatically converts old URLs
// No additional JavaScript needed for basic functionality

// For advanced usage:
window.imageOptimizer.preloadCriticalImages([
  'https://theayofolahan.com/portfolio/critical1.jpg',
  'https://theayofolahan.com/portfolio/critical2.jpg'
]);
```

## 🎉 Results

Your portfolio now has:
- ✅ Custom domain integration (`theayofolahan.com`)
- ✅ Automatic image optimization
- ✅ Lazy loading for better performance
- ✅ Easy upload workflow
- ✅ Error handling and fallbacks
- ✅ Mobile-optimized responsive images

All existing images have been updated to use the custom domain, and new images can be easily uploaded using the provided script.
