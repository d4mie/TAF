// Image Optimization and Lazy Loading Utilities
class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.resizeSupportChecked = false;
    this.resizeSupported = false;
    this.resizeSupportPromise = null;
    this.staticVariantsSupportChecked = false;
    this.staticVariantsSupported = false;
    this.staticVariantsSupportPromise = null;
    this.staticVariantWidths = [480, 960, 1600];
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
    if (this.resizeSupportChecked) {
      if (this.resizeSupportPromise) await this.resizeSupportPromise;
      return this.resizeSupported;
    }

    this.resizeSupportChecked = true;

    // Use an <img> probe (avoids CORS/fetch quirks; matches how real images load)
    const probeSource = sampleImageUrl || '/TAF.jpg';
    const testUrl = this.buildResizedUrl(probeSource, 20, 50);

    // If we couldn't build a resizing URL, treat as unsupported
    if (!testUrl || testUrl === probeSource || !String(testUrl).includes('/cdn-cgi/image/')) {
      this.resizeSupported = false;
      return this.resizeSupported;
    }

    this.resizeSupportPromise = new Promise((resolve) => {
      const img = new Image();
      const timeoutMs = 2500;
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        resolve(true);
      };
      img.onerror = () => {
        cleanup();
        resolve(false);
      };

      img.src = testUrl;
    })
      .then((supported) => {
        this.resizeSupported = Boolean(supported);
      })
      .catch(() => {
        this.resizeSupported = false;
      })
      .finally(() => {
        this.resizeSupportPromise = null;
      });

    await this.resizeSupportPromise;
    return this.resizeSupported;
  }

  // Pick a good width for the current element (reduces cache fragmentation)
  getTargetWidth(img, fallbackWidth = 800) {
    const candidates = [320, 480, 640, 800, 960, 1200, 1600, 2048];
    try {
      const rect = img.getBoundingClientRect?.();
      const cssWidth = (rect && rect.width) || img.clientWidth || fallbackWidth;
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const desired = Math.ceil(cssWidth * dpr);
      return candidates.find((w) => w >= desired) || candidates[candidates.length - 1];
    } catch {
      return fallbackWidth;
    }
  }

  // Pick the closest available pre-generated variant width (>= desired if possible)
  pickStaticVariantWidth(desiredWidth) {
    const widths = Array.isArray(this.staticVariantWidths) && this.staticVariantWidths.length
      ? this.staticVariantWidths.slice().sort((a, b) => a - b)
      : [960];
    return widths.find((w) => w >= desiredWidth) || widths[widths.length - 1];
  }

  // Build a pre-generated variant URL (uploaded to R2) like: image__w960.webp
  buildStaticVariantUrl(rawUrl, width) {
    const siteOrigin = this.getSiteOrigin();
    try {
      const url = new URL(rawUrl, siteOrigin);
      // Only attempt variants for bucket/custom-domain images
      const origin = url.origin || '';
      if (!origin.includes('theayofolahan.com') && !origin.includes('r2.dev')) return null;

      // Normalize to custom domain
      const normalized = new URL(this.convertToCustomDomain(url.toString()));
      const parts = normalized.pathname.split('/');
      const filename = parts.pop();
      if (!filename) return null;

      const dot = filename.lastIndexOf('.');
      const base = dot > 0 ? filename.slice(0, dot) : filename;
      const variantName = `${base}__w${width}.webp`;
      parts.push(variantName);
      normalized.pathname = parts.join('/');
      normalized.search = '';
      normalized.hash = '';
      return normalized.toString();
    } catch {
      return null;
    }
  }

  // Check if pre-generated variants exist (probe once with an <img>)
  async ensureStaticVariantSupport(sampleImageUrl) {
    if (this.staticVariantsSupportChecked) {
      if (this.staticVariantsSupportPromise) await this.staticVariantsSupportPromise;
      return this.staticVariantsSupported;
    }

    this.staticVariantsSupportChecked = true;

    const probeSource = sampleImageUrl;
    const testWidth = this.staticVariantWidths?.[0] || 960;
    const testUrl = probeSource ? this.buildStaticVariantUrl(probeSource, testWidth) : null;

    if (!testUrl) {
      this.staticVariantsSupported = false;
      return this.staticVariantsSupported;
    }

    this.staticVariantsSupportPromise = new Promise((resolve) => {
      const img = new Image();
      const timeoutMs = 2500;
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        resolve(true);
      };
      img.onerror = () => {
        cleanup();
        resolve(false);
      };

      img.src = testUrl;
    })
      .then((supported) => {
        this.staticVariantsSupported = Boolean(supported);
      })
      .catch(() => {
        this.staticVariantsSupported = false;
      })
      .finally(() => {
        this.staticVariantsSupportPromise = null;
      });

    await this.staticVariantsSupportPromise;
    return this.staticVariantsSupported;
  }

  // Apply responsive attributes to an image element
  applyResponsiveAttributes(img) {
    // Always set basic perf attributes
    img.setAttribute('loading', img.getAttribute('loading') || 'lazy');
    img.setAttribute('decoding', img.getAttribute('decoding') || 'async');

    // If we've learned resizing is supported, create srcset
    if (this.resizeSupported) {
      const rawSrc = img.getAttribute('data-src') || img.getAttribute('src');
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

  // Optimize existing images on page load
  async optimizeExistingImages() {
    // Gather all images: legacy R2 domain, same-origin absolute, and relative paths
    const legacySelector = 'img[src*="pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev"]';
    const sameOriginSelector = 'img[src^="/"], img[src^="./"], img[src^="../"], img[src^="https://theayofolahan.com/"]';
    const lazySelector = 'img[data-src]';
    const images = Array.from(document.querySelectorAll(`${legacySelector}, ${sameOriginSelector}, ${lazySelector}`));

    if (images.length === 0) return;

    // Decide once if resizing is available using a good probe image.
    // Prefer an absolute bucket image URL (works even if site is hosted elsewhere).
    const candidates = images
      .map((img) => img.getAttribute('data-src') || img.getAttribute('src'))
      .filter((u) => u && typeof u === 'string' && !u.startsWith('data:'));

    const hostedOnCustomDomain = (() => {
      try {
        return window.location.origin.includes('theayofolahan.com');
      } catch {
        return false;
      }
    })();

    const probeCandidate =
      candidates.find((u) => u.includes('theayofolahan.com') || u.includes('r2.dev')) ||
      (hostedOnCustomDomain ? candidates[0] : null);

    if (probeCandidate) {
      await this.ensureResizeSupport(this.convertToCustomDomain(probeCandidate));
    }

    images.forEach((img) => {
      const originalSrc = img.getAttribute('data-src') || img.getAttribute('src');
      if (!originalSrc) return;

      const converted = this.convertToCustomDomain(originalSrc);

      // Always set perf attributes and fade-in
      this.applyResponsiveAttributes(img);

      // Convert legacy domain for both eager and lazy images
      if (img.hasAttribute('data-src')) {
        if (converted !== originalSrc) img.setAttribute('data-src', converted);
        // Ensure we observe lazy images present at load
        if (this.observer) this.observer.observe(img);
      } else {
        if (converted !== originalSrc) img.setAttribute('src', converted);
      }

      // Add error handling with fallback
      img.addEventListener('error', () => {
        const currentSrc = img.getAttribute('src');
        if (currentSrc && currentSrc !== originalSrc) {
          console.warn('Failed to load optimized image, falling back:', originalSrc);
          img.setAttribute('src', originalSrc);
          img.removeAttribute('data-src');
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
          // Convert legacy src/data-src if needed
          const originalSrc = img.getAttribute('src');
          const originalDataSrc = img.getAttribute('data-src');
          if (originalDataSrc) {
            const converted = this.convertToCustomDomain(originalDataSrc);
            if (converted !== originalDataSrc) img.setAttribute('data-src', converted);
          } else if (originalSrc) {
            const converted = this.convertToCustomDomain(originalSrc);
            if (converted !== originalSrc) img.setAttribute('src', converted);
          }

          // Apply responsive attributes (resizing may be unsupported; method guards internally)
          this.applyResponsiveAttributes(img);

          // Hook up lazy loading for dynamically added lazy images
          if (img.hasAttribute('data-src') && this.observer) {
            this.observer.observe(img);
          }
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
          const maybeOptimize = async () => {
            // 1) Prefer Cloudflare resizing when available
            await this.ensureResizeSupport(optimizedSrc);
            if (this.resizeSupported) {
              const targetWidth = this.getTargetWidth(img, 800);
              return this.buildResizedUrl(optimizedSrc, targetWidth, 85);
            }

            // 2) Otherwise use pre-generated WebP variants when available
            await this.ensureStaticVariantSupport(optimizedSrc);
            if (this.staticVariantsSupported) {
              const desired = this.getTargetWidth(img, 800);
              const w = this.pickStaticVariantWidth(desired);
              const variantUrl = this.buildStaticVariantUrl(optimizedSrc, w);
              if (variantUrl) return variantUrl;
            }

            // 3) Fallback to original
            return optimizedSrc;
          };
          
          // Create a new image to preload
          const newImg = new Image();
          maybeOptimize().then((finalSrc) => {
            newImg.onload = () => {
              img.src = finalSrc;
              img.removeAttribute('data-src');
              img.classList.add('loaded');
            };
            newImg.onerror = () => {
              // Fallback to original URL
              img.src = optimizedSrc;
              img.removeAttribute('data-src');
            };
            newImg.src = finalSrc;
          }).catch(() => {
            // Fallback to original URL
            img.src = optimizedSrc;
            img.removeAttribute('data-src');
          });
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

function initImageOptimizer() {
  window.imageOptimizer = new ImageOptimizer();
}

// Initialize as early as possible (works with deferred scripts too)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initImageOptimizer);
} else {
  initImageOptimizer();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageOptimizer;
}
