document.addEventListener("DOMContentLoaded", async () => {
  const subcategoriesContainer = document.getElementById("subcategories-container");
  const imagesContainer = document.getElementById("image-container");

  function encodePathSegment(segment) {
    return encodeURIComponent(segment).replace(/%2F/g, "/");
  }
  function ensureTrailingSlash(s) {
    return s.endsWith("/") ? s : s + "/";
  }
  async function loadJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  }

  let indexData;
  let mappingData;
  try {
    [indexData, mappingData] = await Promise.all([
      loadJSON("portfolio-index.json"),
      loadJSON("portfolio-mapping.json"),
    ]);
  } catch (err) {
    console.error("Failed to load portfolio data:", err);
    return; // Keep the static grid as fallback
  }

  const bucketBaseURL = ensureTrailingSlash(indexData.bucketBaseURL || "");
  const foldersIndex = indexData.folders || {};
  const mappings = (mappingData && mappingData.mappings) || {};
  const categoriesOrder = (mappingData && mappingData.categoriesOrder) || [
    "brandcampaignshoot",
    "bts",
    "event",
    "lifestyle",
    "portrait",
  ];

  // Build structures
  const subcategoriesByCategory = {};
  const folderByDisplayName = {};
  for (const cat of categoriesOrder) subcategoriesByCategory[cat] = [];

  const knownFolders = new Set();
  // Use explicit mappings first (curated display names and categories)
  for (const [folderName, def] of Object.entries(mappings)) {
    const displayName = def.displayName || folderName;
    const category = def.category || categoriesOrder[0];
    if (!foldersIndex[folderName]) continue; // skip if folder not present in index
    const targetCategory = categoriesOrder.includes(category)
      ? category
      : categoriesOrder[0];

    subcategoriesByCategory[targetCategory].push(displayName);
    folderByDisplayName[displayName] = folderName;
    knownFolders.add(folderName);
  }

  // Auto-include any folders not in mapping (so new folders appear automatically)
  const defaultCategory = categoriesOrder[0];
  for (const folderName of Object.keys(foldersIndex)) {
    if (knownFolders.has(folderName)) continue;
    const displayName = folderName; // basic default; can be curated later via mapping
    subcategoriesByCategory[defaultCategory].push(displayName);
    folderByDisplayName[displayName] = folderName;
  }

  // Sort subcategories alphabetically for each category
  for (const cat of Object.keys(subcategoriesByCategory)) {
    subcategoriesByCategory[cat].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }

  // Wire up category cards
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      const categoryId = event.currentTarget.id.replace("category-", "");

      // Clear previous subcategories
      subcategoriesContainer.innerHTML = "";

      // Display subcategories for the clicked category
      const subcats = subcategoriesByCategory[categoryId] || [];
      subcats.forEach((displayName) => {
          const subcategoryLink = document.createElement("a");
          subcategoryLink.className = "subcategory";
        subcategoryLink.href = "#";
        subcategoryLink.textContent = displayName;

        subcategoryLink.addEventListener("click", (e) => {
            e.preventDefault();
          const folderName = folderByDisplayName[displayName];
          renderGallery(folderName);
        });

        subcategoriesContainer.appendChild(subcategoryLink);
      });
    });
  });

  function renderGallery(folderName) {
            imagesContainer.innerHTML = ""; // Clear previous gallery

    if (!folderName) {
              const noFolderMessage = document.createElement("p");
      noFolderMessage.textContent = "No folder mapped for this subcategory";
              noFolderMessage.className = "text-center text-red-500";
              imagesContainer.appendChild(noFolderMessage);
              return;
            }

    const imageList = foldersIndex[folderName];
    if (!Array.isArray(imageList) || imageList.length === 0) {
      const noImagesMessage = document.createElement("p");
      noImagesMessage.textContent = `No images found for folder "${folderName}"`;
      noImagesMessage.className = "text-center text-gray-500";
      imagesContainer.appendChild(noImagesMessage);
      return;
    }

    const encodedFolderName = encodePathSegment(folderName);
              imageList.forEach((imageName) => {
      const encodedImageName = encodePathSegment(imageName);
      const imageSrc = `${bucketBaseURL}${encodedFolderName}/${encodedImageName}`;
                
                const imageWrapper = document.createElement("div");
      imageWrapper.innerHTML = `
                  <div class="overflow-hidden h-full w-full">
                    <a href="${imageSrc}" data-fancybox="gallery">
                      <img
                        alt="gallery-image-${encodedImageName}"
                        class="block h-full w-full object-cover object-center opacity-0 animate-fade-in transition duration-500 transform scale-100 hover:scale-110"
                        src="${imageSrc}" />
                    </a>
                  </div>
                `;
                imagesContainer.appendChild(imageWrapper);
              });
  }
});
