// Image Optimization and Lazy Loading Utilities
class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Initialize Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }

    // Optimize existing images
    this.optimizeExistingImages();
    
    // Setup lazy loading for new images
    this.setupLazyLoading();
  }

  // Convert old R2 URLs to custom domain URLs
  convertToCustomDomain(url) {
    if (url.includes('pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/')) {
      const path = url.split('pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/')[1];
      return `https://theayofolahan.com/${path}`;
    }
    return url;
  }

  // Optimize existing images on page load
  optimizeExistingImages() {
    const images = document.querySelectorAll('img[src*="pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev"]');
    
    images.forEach(img => {
      const originalSrc = img.src;
      const optimizedSrc = this.convertToCustomDomain(originalSrc);
      
      // Add loading optimization attributes
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      
      // Update src to custom domain
      img.src = optimizedSrc;
      
      // Add error handling
      img.addEventListener('error', () => {
        console.warn('Failed to load optimized image, falling back to original:', originalSrc);
        img.src = originalSrc;
      });

      // Add fade-in effect
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
      
      img.addEventListener('load', () => {
        img.style.opacity = '1';
      });
    });

    // Update Fancybox gallery links
    const galleryLinks = document.querySelectorAll('a[href*="pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev"]');
    galleryLinks.forEach(link => {
      const originalHref = link.href;
      const optimizedHref = this.convertToCustomDomain(originalHref);
      link.href = optimizedHref;
    });
  }

  // Setup lazy loading for images
  setupLazyLoading() {
    if (!this.observer) return;

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      this.observer.observe(img);
    });
  }

  // Handle intersection observer callback
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        
        if (src) {
          // Convert to custom domain
          const optimizedSrc = this.convertToCustomDomain(src);
          
          // Create a new image to preload
          const newImg = new Image();
          newImg.onload = () => {
            img.src = optimizedSrc;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          };
          newImg.onerror = () => {
            // Fallback to original URL
            img.src = src;
            img.removeAttribute('data-src');
          };
          newImg.src = optimizedSrc;
        }
        
        this.observer.unobserve(img);
      }
    });
  }

  // Preload critical images
  preloadCriticalImages(imageUrls) {
    imageUrls.forEach(url => {
      const optimizedUrl = this.convertToCustomDomain(url);
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedUrl;
      document.head.appendChild(link);
    });
  }

  // Add responsive image support
  addResponsiveImage(img, imagePath) {
    const basePath = imagePath.replace('pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/', '');
    const customDomain = 'https://theayofolahan.com';
    
    // Create srcset for different screen sizes
    const srcset = [
      `${customDomain}/${basePath}?w=300 300w`,
      `${customDomain}/${basePath}?w=600 600w`,
      `${customDomain}/${basePath}?w=1200 1200w`
    ].join(', ');

    img.setAttribute('srcset', srcset);
    img.setAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw');
  }

  // Optimize image loading with progressive enhancement
  progressiveLoad(img) {
    // Start with a low-quality placeholder
    const placeholder = img.getAttribute('data-placeholder') || img.src;
    img.src = placeholder;
    
    // Load the full-quality image
    const fullImage = new Image();
    fullImage.onload = () => {
      img.src = fullImage.src;
      img.classList.add('progressive-loaded');
    };
    fullImage.src = this.convertToCustomDomain(img.getAttribute('data-src') || img.src);
  }
}

// Initialize image optimizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.imageOptimizer = new ImageOptimizer();
  
  // Preload critical images (first few images on homepage)
  const criticalImages = [
    'https://pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/ACTIVEYARD/ykb10.jpg',
    'https://pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/STREET%20SOUK%2023%E2%80%99/ss44.JPG',
    'https://pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/BUJU/buju3.jpg'
  ];
  
  window.imageOptimizer.preloadCriticalImages(criticalImages);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageOptimizer;
}
