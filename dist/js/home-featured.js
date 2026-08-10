document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

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
    const w1600 = `${folderPath}/${encodePathSegment(`${stem}__w1600.webp`)}`;
    return { original, w480, w960, w1600 };
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

      const fileName =
        cover && fileNames.includes(cover) ? cover : fileNames[0];
      const urls = buildVariantUrls(base, resolvedKey, fileName);
      const href = `portfolio.html?project=${encodeURIComponent(resolvedKey)}`;
      const safeTitle = escapeHtml(title);
      // First few tiles load immediately; rest lazy-load
      const eager = index < 4;

      const item = document.createElement('div');
      item.className = 'flex flex-col';
      item.innerHTML = `
        <a href="${href}" title="${safeTitle}" class="block aspect-square overflow-hidden">
          <img
            src="${urls.w480}"
            srcset="${urls.w480} 480w, ${urls.w960} 960w"
            sizes="(max-width: 768px) 50vw, 420px"
            alt="${safeTitle}"
            class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="${eager ? 'eager' : 'lazy'}"
            fetchpriority="${eager ? 'high' : 'auto'}"
            decoding="async"
            onerror="this.onerror=null;this.removeAttribute('srcset');this.src='${urls.original}'" />
        </a>
        <p class="mt-3 text-center text-sm md:text-base font-signika tracking-wide uppercase">${safeTitle}</p>
      `;
      grid.appendChild(item);
    });
  } catch (err) {
    console.error('Failed to populate featured grid:', err);
  }
});
