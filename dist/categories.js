document.addEventListener("DOMContentLoaded", async () => {
  console.log("Categories.js loaded successfully");
  
  const subcategoriesContainer = document.getElementById("subcategories-container");
  const imagesContainer = document.getElementById("image-container");
  
  console.log("Containers found:", {
    subcategoriesContainer: !!subcategoriesContainer,
    imagesContainer: !!imagesContainer
  });

  function encodePathSegment(segment) {
    return encodeURIComponent(segment).replace(/%2F/g, "/");
  }

  // Load mapping data
  let mappingData;
  try {
    console.log("Loading portfolio-mapping.json...");
    const res = await fetch("portfolio-mapping.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load portfolio-mapping.json: ${res.status}`);
    mappingData = await res.json();
    console.log("Mapping data loaded successfully:", mappingData);
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
  console.log("Setting up category click handlers...");
  const categoryCards = document.querySelectorAll(".category-card");
  console.log("Found category cards:", categoryCards.length);
  
  categoryCards.forEach((card, index) => {
    console.log(`Setting up card ${index}:`, card.id);
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
      subcatsWrapper.className = "flex flex-wrap";

      subcats.forEach((displayName) => {
        const subcategoryLink = document.createElement("a");
        subcategoryLink.className = "category-card p-4 text-center flex-1 mr-4 group transition duration-300";
        subcategoryLink.href = "#";
        
        // Create the same structure as category cards
        subcategoryLink.innerHTML = `
          <h3 class="text-xl font-medium">${displayName}</h3>
          <span class="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-black dark:bg-white"></span>
        `;

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

    // Create a loading message
    const loadingMessage = document.createElement("div");
    loadingMessage.className = "text-center py-8";
    loadingMessage.innerHTML = `
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading images from ${folderName}...</p>
    `;
    imagesContainer.appendChild(loadingMessage);

    // Simulate loading images (in a real implementation, you'd fetch from R2 API)
    setTimeout(() => {
      // Create sample images for demonstration
      const sampleImages = [
        'image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg',
        'image5.jpg', 'image6.jpg', 'image7.jpg', 'image8.jpg'
      ];

      imagesContainer.innerHTML = "";

      sampleImages.forEach((imageName, index) => {
        const encodedFolderName = encodePathSegment(folderName);
        const encodedImageName = encodePathSegment(imageName);
        const imageSrc = `https://theayofolahan.com/${encodedFolderName}/${encodedImageName}`;
        
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "w-full md:w-1/2 p-1";
        
        imageWrapper.innerHTML = `
          <div class="overflow-hidden h-full w-full">
            <a href="${imageSrc}" data-fancybox="gallery">
              <img
                alt="gallery-image-${encodedImageName}"
                class="block h-full w-full object-cover object-center opacity-0 animate-fade-in transition duration-500 transform scale-100 hover:scale-110"
                src="${imageSrc}" 
                loading="lazy" 
                decoding="async" />
            </a>
          </div>
        `;
        
        imagesContainer.appendChild(imageWrapper);
      });

      // Re-initialize Fancybox for the new images
      if (typeof Fancybox !== 'undefined') {
        Fancybox.bind("[data-fancybox]", {
          // Fancybox options
        });
      }
    }, 1000); // 1 second delay to show loading
  }

  // Initialize Fancybox for any existing images
  if (typeof Fancybox !== 'undefined') {
    Fancybox.bind("[data-fancybox]", {
      // Fancybox options
    });
  }
});