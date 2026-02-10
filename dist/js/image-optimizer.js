// Image Optimization and Lazy Loading Utilities
class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.resizeSupportChecked = false;
    this.resizeSupported = false;
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
    // Observe dynamically added images
    this.observeNewImages();
  }

  // Determine current site origin and custom domain
  getSiteOrigin() {
    const hardcoded = 'https://theayofolahan.com';
    try {
      const { origin } = window.location;
      // Prefer current origin if it matches the hardcoded domain
      return origin.includes('theayofolahan.com') ? origin : hardcoded;
    } catch {
      return hardcoded;
    }
  }

  // Convert old R2 URLs to custom domain URLs with fallback
  convertToCustomDomain(url) {
    if (url.includes('pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/')) {
      const path = url.split('pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/')[1];
      return `https://theayofolahan.com/${path}`;
    }
    return url;
  }

  // Build Cloudflare Image Resizing URL if possible
  buildResizedUrl(rawUrl, width = 800, quality = 85) {
    const siteOrigin = this.getSiteOrigin();
    try {
      const url = new URL(rawUrl, siteOrigin);
      // Only attempt resizing for same-origin images
      if (url.origin !== new URL(siteOrigin).origin) return rawUrl;
      // Remove leading slash for path join
      const path = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
      // Cloudflare Image Resizing syntax
      return `${siteOrigin}/cdn-cgi/image/width=${width},quality=${quality},format=auto${path}`;
    } catch {
      // rawUrl might be relative path
      const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
      return `${siteOrigin}/cdn-cgi/image/width=${width},quality=${quality},format=auto${path}`;
    }
  }

  // Check if Cloudflare Image Resizing is available
  async ensureResizeSupport(sampleImageUrl) {
    if (this.resizeSupportChecked) return this.resizeSupported;
    this.resizeSupportChecked = true;
    try {
      const testUrl = this.buildResizedUrl(sampleImageUrl || '/TAF.jpg', 20, 50);
      const res = await fetch(testUrl, { method: 'HEAD' });
      this.resizeSupported = res.ok;
    } catch {
      this.resizeSupported = false;
    }
    return this.resizeSupported;
  }

  // Apply responsive attributes to an image element
  applyResponsiveAttributes(img) {
    // Always set basic perf attributes
    img.setAttribute('loading', img.getAttribute('loading') || 'lazy');
    img.setAttribute('decoding', img.getAttribute('decoding') || 'async');

    // If we've learned resizing is supported, create srcset
    if (this.resizeSupported) {
      const rawSrc = img.getAttribute('src');
      if (!rawSrc || rawSrc.startsWith('data:')) return;
      const widths = [320, 640, 1024, 1600];
      const srcset = widths
        .map((w) => `${this.buildResizedUrl(rawSrc, w)} ${w}w`)
        .join(', ');
      img.setAttribute('srcset', srcset);
      img.setAttribute(
        'sizes',
        img.getAttribute('sizes') ||
          '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      );
    }
  }

  // Test if custom domain is working
  async testCustomDomain() {
    const testUrl = 'https://theayofolahan.com/ACTIVEYARD/ykb10.jpg';
    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('Custom domain test failed:', error);
      return false;
    }
  }

  // Optimize existing images on page load
  async optimizeExistingImages() {
    // Gather all images: legacy R2 domain, same-origin absolute, and relative paths
    const legacySelector = 'img[src*="pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev"]';
    const sameOriginSelector = 'img[src^="/"], img[src^="./"], img[src^="../"], img[src^="https://theayofolahan.com/"]';
    const images = Array.from(document.querySelectorAll(`${legacySelector}, ${sameOriginSelector}`));

    if (images.length === 0) return;

    // Decide once if resizing is available using the first candidate image
    await this.ensureResizeSupport(images[0].getAttribute('src'));

    images.forEach((img) => {
      const originalSrc = img.getAttribute('src');
      const converted = this.convertToCustomDomain(originalSrc);

      // Always set perf attributes and fade-in
      this.applyResponsiveAttributes(img);

      if (converted !== originalSrc) {
        img.setAttribute('src', converted);
      }

      // Add error handling with fallback
      img.addEventListener('error', () => {
        const currentSrc = img.getAttribute('src');
        if (currentSrc !== originalSrc) {
          console.warn('Failed to load optimized image, falling back:', originalSrc);
          img.setAttribute('src', originalSrc);
          img.removeAttribute('srcset');
          img.removeAttribute('sizes');
        } else {
          // If both fail, show placeholder
          img.src =
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
        }
      });

      // Add fade-in effect
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
      img.addEventListener('load', () => {
        img.style.opacity = '1';
      });
    });

    // Update Fancybox gallery links (legacy R2 domain only)
    const galleryLinks = document.querySelectorAll('a[href*="pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev"]');
    galleryLinks.forEach((link) => {
      const originalHref = link.getAttribute('href');
      const optimizedHref = this.convertToCustomDomain(originalHref);
      link.setAttribute('href', optimizedHref);
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

  // Observe DOM mutations to optimize images added after load
  observeNewImages() {
    if (!('MutationObserver' in window)) return;
    const observer = new MutationObserver((mutations) => {
      const addedImages = [];
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'IMG') {
            addedImages.push(node);
          } else {
            addedImages.push(...node.querySelectorAll?.('img') || []);
          }
        });
      });
      if (addedImages.length) {
        addedImages.forEach((img) => {
          // Convert legacy src if needed
          const originalSrc = img.getAttribute('src');
          if (originalSrc) {
            const converted = this.convertToCustomDomain(originalSrc);
            if (converted !== originalSrc) img.setAttribute('src', converted);
          }
          // Apply responsive attributes (resizing may be unsupported; method guards internally)
          this.applyResponsiveAttributes(img);
        });
      }
    });
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
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
