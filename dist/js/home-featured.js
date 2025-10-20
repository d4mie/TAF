document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

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

  try {
    const [indexRes, mappingRes] = await Promise.all([
      fetch('portfolio-index.json', { cache: 'no-store' }),
      fetch('portfolio-mapping.json', { cache: 'no-store' })
    ]);
    if (!indexRes.ok) throw new Error('Failed to load portfolio-index.json');
    if (!mappingRes.ok) throw new Error('Failed to load portfolio-mapping.json');

    const indexData = await indexRes.json();
    const mappingData = await mappingRes.json();

    const folders = (indexData && indexData.folders) || {};
    const mappings = (mappingData && mappingData.mappings) || {};
    const base = (indexData.bucketBaseURL || 'https://theayofolahan.com').replace(/\/$/, '');

    const items = [];
    for (const [folderName, def] of Object.entries(mappings)) {
      const resolvedKey = findFolderKey(folderName, folders);
      if (!resolvedKey) continue;
      const fileNames = folders[resolvedKey];
      if (!Array.isArray(fileNames) || fileNames.length === 0) continue;
      const fileName = fileNames[0]; // pick first image as representative
      const imageUrl = `${base}/${encodePathSegment(resolvedKey)}/${encodePathSegment(fileName)}`;
      const alt = def && def.displayName ? def.displayName : resolvedKey;
      items.push({ imageUrl, alt, folder: resolvedKey });
    }

    if (items.length === 0) return;
    grid.innerHTML = '';

    items.forEach(({ imageUrl, alt, folder }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'aspect-square overflow-hidden rounded-lg shadow-lg';
      const href = `portfolio.html?subcategory=${encodeURIComponent(folder)}`;
      wrapper.innerHTML = `
        <a href="${href}" title="${alt}">
          <img src="${imageUrl}" alt="${alt}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />
        </a>
      `;
      grid.appendChild(wrapper);
    });
  } catch (err) {
    console.error('Failed to populate featured grid:', err);
  }
});


