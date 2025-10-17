document.addEventListener("DOMContentLoaded", async () => {
  const subcategoriesContainer = document.getElementById("subcategories-container");
  const imagesContainer = document.getElementById("image-container");

  function encodePathSegment(segment) {
    return encodeURIComponent(segment).replace(/%2F/g, "/");
  }

  // Load mapping data
  let mappingData;
  try {
    const res = await fetch("portfolio-mapping.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load portfolio-mapping.json: ${res.status}`);
    mappingData = await res.json();
  } catch (err) {
    console.error("Failed to load portfolio mapping data:", err);
    return;
  }

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

  // Use explicit mappings
  console.log("Loaded mappings:", mappings);
  for (const [folderName, def] of Object.entries(mappings)) {
    const displayName = def.displayName || folderName;
    const category = def.category || categoriesOrder[0];
    const targetCategory = categoriesOrder.includes(category) ? category : categoriesOrder[0];

    subcategoriesByCategory[targetCategory].push(displayName);
    folderByDisplayName[displayName] = folderName;
  }
  
  console.log("Built subcategories:", subcategoriesByCategory);

  // Sort subcategories alphabetically for each category
  for (const cat of Object.keys(subcategoriesByCategory)) {
    subcategoriesByCategory[cat].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }

  // Wire up category cards
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      event.preventDefault();
      const categoryId = event.currentTarget.id.replace("category-", "");
      
      console.log("Category clicked:", categoryId);
      console.log("Available subcategories:", subcategoriesByCategory[categoryId]);

      // Clear previous subcategories
      subcategoriesContainer.innerHTML = "";

      // Display subcategories for the clicked category
      const subcats = subcategoriesByCategory[categoryId] || [];
      if (subcats.length === 0) {
        const noSubcatsMessage = document.createElement("p");
        noSubcatsMessage.textContent = "No subcategories available for this category";
        noSubcatsMessage.className = "text-center text-gray-500 py-4";
        subcategoriesContainer.appendChild(noSubcatsMessage);
        return;
      }

      // Create a wrapper div for better styling
      const subcatsWrapper = document.createElement("div");
      subcatsWrapper.className = "flex flex-wrap gap-3 justify-center";

      subcats.forEach((displayName) => {
        const subcategoryLink = document.createElement("a");
        subcategoryLink.className = "subcategory inline-block px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 cursor-pointer";
        subcategoryLink.href = "#";
        subcategoryLink.textContent = displayName;

        subcategoryLink.addEventListener("click", (e) => {
          e.preventDefault();
          const folderName = folderByDisplayName[displayName];
          console.log("Subcategory clicked:", displayName, "Folder:", folderName);
          renderGallery(folderName);
        });

        subcatsWrapper.appendChild(subcategoryLink);
      });

      subcategoriesContainer.appendChild(subcatsWrapper);
    });
  });

  function renderGallery(folderName) {
    imagesContainer.innerHTML = ""; // Clear previous gallery

    if (!folderName) {
      const noFolderMessage = document.createElement("p");
      noFolderMessage.textContent = "No folder mapped for this subcategory";
      noFolderMessage.className = "text-center text-red-500 py-8";
      imagesContainer.appendChild(noFolderMessage);
      return;
    }

    // For now, show a message that images will be loaded from the folder
    // In a real implementation, you would fetch the actual image list from R2
    const message = document.createElement("div");
    message.className = "text-center py-8";
    message.innerHTML = `
      <h3 class="text-xl font-medium mb-4">${folderName}</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Images from this folder will be displayed here.
      </p>
      <p class="text-sm text-gray-500">
        Folder: ${folderName}<br>
        URL: https://theayofolahan.com/${encodePathSegment(folderName)}/
      </p>
    `;
    imagesContainer.appendChild(message);
  }

  // Initialize Fancybox for any existing images
  if (typeof Fancybox !== 'undefined') {
    Fancybox.bind("[data-fancybox]", {
      // Fancybox options
    });
  }
});