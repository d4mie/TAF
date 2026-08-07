document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  // Fixed 3x3 homepage order (left → right, top → bottom)
  const FEATURED = [
    {
      folder: 'Grace Ladoja Portraits at Nike x HMC Launch',
      title: 'Grace Ladoja Portraits at Nike x HMC Launch',
    },
    {
      folder: 'STREET SOUK EDITORIAL 2026',
      title: 'STREETSOUK EDITORIAL 2026',
      cover: 'TGM02178.jpg',
    },
    {
      folder: 'KAI CENAT IN LAGOS',
      title: 'KAI CENAT IN LAGOS',
    },
    {
      folder: 'GUNNA WORLD TOUR LAGOS',
      title: 'GUNNA WORLD TOUR LAGOS',
    },
    {
      folder: "Omahlay's Sophomore Listening",
      title: "Omahlay's Sophomore Listening",
    },
    {
      folder: 'STREETSOUK AT LAGOS FASHION WEEK',
      title: 'STREETSOUK AT LAGOS FASHION WEEK',
    },
    {
      folder: 'StreetSouk Convention 2025',
      title: 'StreetSouk Convention 2025',
    },
    {
      folder: 'AMAZON X NEMSIA PRODUCTION',
      title: 'AMAZON X NEMSIA PRODUCTION',
    },
    {
      folder: "Clint's Portraits",
      title: "Clint's Portraits",
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
      // First row loads immediately; rest lazy-load
      const eager = index < 3;

      const item = document.createElement('div');
      item.className = 'flex flex-col';
      item.innerHTML = `
        <a href="${href}" title="${safeTitle}" class="block aspect-square overflow-hidden rounded-lg shadow-lg">
          <img
            src="${urls.w960}"
            srcset="${urls.w480} 480w, ${urls.w960} 960w, ${urls.w1600} 1600w"
            sizes="(max-width: 768px) 33vw, 360px"
            alt="${safeTitle}"
            class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="${eager ? 'eager' : 'lazy'}"
            fetchpriority="${eager ? 'high' : 'auto'}"
            decoding="async"
            onerror="this.onerror=null;this.removeAttribute('srcset');this.src='${urls.original}'" />
        </a>
        <p class="mt-3 text-center text-sm md:text-base font-signika tracking-wide">${safeTitle}</p>
      `;
      grid.appendChild(item);
    });
  } catch (err) {
    console.error('Failed to populate featured grid:', err);
  }
});
