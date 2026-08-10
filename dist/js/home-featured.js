document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  const ROTATE_MS = 2500; // 2.5 seconds between random image swaps

  // Fixed homepage order (left → right, top → bottom)
  const FEATURED = [
    {
      folder: 'NIKE x HOMECOMING',
      title: 'NIKE X HOMECOMING',
    },
    {
      folder: 'KAI CENAT IN LAGOS',
      title: 'KAI CENAT',
    },
    {
      folder: 'GUNNA WORLD TOUR LAGOS',
      title: 'WUNNA WORLD TOUR BY GUNNA',
    },
    {
      folder: 'Grace Ladoja Portraits at Nike x HMC Launch',
      title: 'GRACE FOR NIKE X HOMECOMING',
    },
    {
      folder: 'STREET SOUK EDITORIAL 2026',
      title: 'STREETSOUK EDITORIAL',
      cover: 'TGM02178.jpg',
    },
    {
      folder: "Omahlay's Sophomore Listening",
      title: "OMAH LAY'S SOPHOMORE ALBUM",
    },
    {
      folder: 'Lagos Fashion Week 2025',
      title: 'LAGOS FASHION WEEK 2025',
    },
    {
      folder: "Clint's Portraits",
      title: 'CLINT AT HOMECOMING',
    },
    {
      folder: 'STREETSOUK AT LAGOS FASHION WEEK',
      title: 'STREETSOUK & LAGOS FASHION WEEK',
    },
    {
      folder: 'StreetSouk Convention 2025',
      title: 'STREETSOUK ANNUAL CONVENTION',
    },
    {
      folder: 'AMAZON X NEMSIA PRODUCTION',
      title: 'AMAZON PRIME & NEMSIA PRODUCTION',
    },
  ];

  function encodePathSegment(segment) {
    return encodeURIComponent(segment).replace(/%2F/g, '/');
  }

  function findFolderKey(rawFolderName, foldersObject) {
    if (!foldersObject) return null;
    if (rawFolderName in foldersObject) return rawFolderName;
    const unicodeVariant = rawFolderName.replace(/'/g, '’');
    if (unicodeVariant in foldersObject) return unicodeVariant;
    const asciiVariant = rawFolderName.replace(/’/g, "'");
    if (asciiVariant in foldersObject) return asciiVariant;
    return null;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildVariantUrls(base, folder, fileName) {
    const parsed = fileName.match(/^(.*)(\.[^.]+)$/);
    const stem = parsed ? parsed[1] : fileName;
    const folderPath = `${base}/${encodePathSegment(folder)}`;
    const original = `${folderPath}/${encodePathSegment(fileName)}`;
    const w480 = `${folderPath}/${encodePathSegment(`${stem}__w480.webp`)}`;
    const w960 = `${folderPath}/${encodePathSegment(`${stem}__w960.webp`)}`;
    return { original, w480, w960 };
  }

  function pickRandomIndex(length, avoidIndex) {
    if (length <= 1) return 0;
    let next = Math.floor(Math.random() * length);
    // Avoid showing the same image twice in a row when possible
    if (typeof avoidIndex === 'number' && length > 1) {
      let guard = 0;
      while (next === avoidIndex && guard < 6) {
        next = Math.floor(Math.random() * length);
        guard += 1;
      }
    }
    return next;
  }

  function preloadImage(urls) {
    const img = new Image();
    img.src = urls.w480;
    img.srcset = `${urls.w480} 480w, ${urls.w960} 960w`;
    return img;
  }

  function startSlideshow(imgEl, fileNames, base, folder, startIndex) {
    if (!imgEl || !Array.isArray(fileNames) || fileNames.length < 2) return;

    let currentIndex = startIndex;
    let timerId = null;

    const showIndex = (index) => {
      const urls = buildVariantUrls(base, folder, fileNames[index]);
      imgEl.classList.add('is-fading');

      window.setTimeout(() => {
        imgEl.src = urls.w480;
        imgEl.srcset = `${urls.w480} 480w, ${urls.w960} 960w`;
        imgEl.onerror = function () {
          this.onerror = null;
          this.removeAttribute('srcset');
          this.src = urls.original;
        };
        imgEl.classList.remove('is-fading');
      }, 220);

      // Warm the next random image in the background
      const upcoming = pickRandomIndex(fileNames.length, index);
      preloadImage(buildVariantUrls(base, folder, fileNames[upcoming]));
    };

    const tick = () => {
      if (document.hidden) return;
      currentIndex = pickRandomIndex(fileNames.length, currentIndex);
      showIndex(currentIndex);
    };

    // Stagger each tile so they don't all change at the same moment
    const stagger = Math.floor(Math.random() * 1200);
    window.setTimeout(() => {
      timerId = window.setInterval(tick, ROTATE_MS);
    }, stagger);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (timerId) {
          window.clearInterval(timerId);
          timerId = null;
        }
      } else if (!timerId) {
        timerId = window.setInterval(tick, ROTATE_MS);
      }
    });
  }

  try {
    const indexRes = await fetch('portfolio-index.json', { cache: 'no-store' });
    if (!indexRes.ok) throw new Error('Failed to load portfolio-index.json');

    const indexData = await indexRes.json();
    const folders = (indexData && indexData.folders) || {};
    const base = (indexData.bucketBaseURL || 'https://theayofolahan.com').replace(/\/$/, '');

    grid.innerHTML = '';

    FEATURED.forEach(({ folder, title, cover }, index) => {
      const resolvedKey = findFolderKey(folder, folders);
      if (!resolvedKey) {
        console.warn('Featured folder missing from index:', folder);
        return;
      }

      const fileNames = folders[resolvedKey];
      if (!Array.isArray(fileNames) || fileNames.length === 0) {
        console.warn('Featured folder has no images:', resolvedKey);
        return;
      }

      let startIndex = 0;
      if (cover && fileNames.includes(cover)) {
        startIndex = fileNames.indexOf(cover);
      } else {
        startIndex = pickRandomIndex(fileNames.length);
      }

      const urls = buildVariantUrls(base, resolvedKey, fileNames[startIndex]);
      const href = `portfolio.html?project=${encodeURIComponent(resolvedKey)}`;
      const safeTitle = escapeHtml(title);
      const eager = index < 4;

      const item = document.createElement('div');
      item.className = 'featured-item flex flex-col';
      item.style.setProperty('--reveal-delay', `${(index % 2) * 120}ms`);
      item.innerHTML = `
        <a href="${href}" title="${safeTitle}" class="featured-tile block aspect-square overflow-hidden">
          <img
            src="${urls.w480}"
            srcset="${urls.w480} 480w, ${urls.w960} 960w"
            sizes="(max-width: 768px) 50vw, 420px"
            alt="${safeTitle}"
            class="featured-tile-img w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="${eager ? 'eager' : 'lazy'}"
            fetchpriority="${eager ? 'high' : 'auto'}"
            decoding="async"
            onerror="this.onerror=null;this.removeAttribute('srcset');this.src='${urls.original}'" />
        </a>
        <p class="mt-3 text-center text-sm md:text-base font-signika tracking-wide uppercase">${safeTitle}</p>
      `;
      grid.appendChild(item);

      const imgEl = item.querySelector('.featured-tile-img');
      // Start slideshow only after the tile scrolls into view
      item._startSlideshow = () =>
        startSlideshow(imgEl, fileNames, base, resolvedKey, startIndex);
    });

    // Reveal each row as the user scrolls — tiles feel "built" into place
    const revealItems = grid.querySelectorAll('.featured-item');
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('is-visible');
            if (typeof el._startSlideshow === 'function') {
              el._startSlideshow();
              el._startSlideshow = null;
            }
            revealObserver.unobserve(el);
          });
        },
        {
          root: null,
          threshold: 0.18,
          rootMargin: '0px 0px -8% 0px',
        }
      );
      revealItems.forEach((el) => revealObserver.observe(el));
    } else {
      revealItems.forEach((el) => {
        el.classList.add('is-visible');
        if (typeof el._startSlideshow === 'function') el._startSlideshow();
      });
    }
  } catch (err) {
    console.error('Failed to populate featured grid:', err);
  }
});
