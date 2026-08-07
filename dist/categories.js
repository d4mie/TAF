document.addEventListener("DOMContentLoaded", async () => {
  console.log("Categories.js loaded successfully");
  
  const subcategoriesContainer = document.getElementById("subcategories-container");
  const imagesContainer = document.getElementById("image-container");

  // Tiny inline placeholder to prevent eager downloads before lazy-loader kicks in
  const PLACEHOLDER_SRC =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E';
  
  console.log("Containers found:", {
    subcategoriesContainer: !!subcategoriesContainer,
    imagesContainer: !!imagesContainer
  });

  function encodePathSegment(segment) {
    return encodeURIComponent(segment).replace(/%2F/g, "/");
  }

  function findFolderKey(rawFolderName, foldersObject) {
    if (!foldersObject) return null;
    if (rawFolderName in foldersObject) return rawFolderName;
    // Handle common ASCII vs Unicode apostrophe differences
    const unicodeVariant = rawFolderName.replace(/'/g, "’");
    if (unicodeVariant in foldersObject) return unicodeVariant;
    const asciiVariant = rawFolderName.replace(/’/g, "'");
    if (asciiVariant in foldersObject) return asciiVariant;
    return null;
  }

  // Load mapping data
  let mappingData;
  let indexData;
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

  // Load generated index (folders and filenames from R2)
  try {
    console.log("Loading portfolio-index.json...");
    const res = await fetch("portfolio-index.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load portfolio-index.json: ${res.status}`);
    indexData = await res.json();
    console.log("Index data loaded successfully:", indexData);
  } catch (err) {
    console.error("Failed to load portfolio index:", err);
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
        subcategoryLink.className = "subcategory-link p-4 text-center mr-4 transition duration-300";
        subcategoryLink.href = "#";

        // Simplified content: remove extra underline span to avoid double underline
        subcategoryLink.innerHTML = `
          <h3 class="text-xl font-medium">${displayName}</h3>
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

    // Render from real index data
    setTimeout(() => {
      imagesContainer.innerHTML = "";

      const folders = (indexData && indexData.folders) || {};
      const resolvedKey = findFolderKey(folderName, folders);
      if (!resolvedKey) {
        const err = document.createElement("p");
        err.textContent = `Folder not found in index: ${folderName}`;
        err.className = "text-center text-red-500 py-8";
        imagesContainer.appendChild(err);
        return;
      }

      const fileNames = folders[resolvedKey] || [];
      if (fileNames.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = `No images available in ${resolvedKey}`;
        empty.className = "text-center text-gray-500 py-8";
        imagesContainer.appendChild(empty);
        return;
      }

      const base = (indexData.bucketBaseURL || 'https://theayofolahan.com').replace(/\/$/, '');
      const encodedFolderName = encodePathSegment(resolvedKey);

      function buildVariantUrls(imageName) {
        const stem = imageName.replace(/\.[^.]+$/, "");
        const original = `${base}/${encodedFolderName}/${encodePathSegment(imageName)}`;
        const w480 = `${base}/${encodedFolderName}/${encodePathSegment(`${stem}__w480.webp`)}`;
        const w960 = `${base}/${encodedFolderName}/${encodePathSegment(`${stem}__w960.webp`)}`;
        const w1600 = `${base}/${encodedFolderName}/${encodePathSegment(`${stem}__w1600.webp`)}`;
        return { original, w480, w960, w1600 };
      }

      fileNames.forEach((imageName, index) => {
        const urls = buildVariantUrls(imageName);
        const eager = index < 4;

        const imageWrapper = document.createElement("div");
        imageWrapper.className = "w-full md:w-1/2 p-1";

        // Grid shows mid-size WebP; lightbox opens larger WebP (falls back to original)
        imageWrapper.innerHTML = `
          <div class="overflow-hidden h-full w-full">
            <a href="${urls.w1600}" data-fancybox="gallery">
              <img
                alt="${imageName.replace(/"/g, "&quot;")}"
                class="block h-full w-full object-cover object-center opacity-0 animate-fade-in transition duration-500 transform scale-100 hover:scale-110"
                src="${urls.w960}"
                srcset="${urls.w480} 480w, ${urls.w960} 960w, ${urls.w1600} 1600w"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="${eager ? "eager" : "lazy"}"
                decoding="async"
                onerror="this.onerror=null;this.removeAttribute('srcset');this.src='${urls.original}';this.parentElement.href='${urls.original}';" />
            </a>
          </div>
        `;

        imagesContainer.appendChild(imageWrapper);
      });

      if (typeof Fancybox !== 'undefined') {
        Fancybox.bind("[data-fancybox]", {});
      }
    }, 300);
  }

  // Initialize Fancybox for any existing images
  if (typeof Fancybox !== 'undefined') {
    Fancybox.bind("[data-fancybox]", {
      // Fancybox options
    });
  }

  // Captions for the 9 homepage featured projects
  const FEATURED_PROJECTS = {
    "Grace Ladoja Portraits at Nike x HMC Launch": {
      title: "Grace for Nike x Homecoming",
      caption:
        "Portraits of Grace Ladoja at the launch of her Nike collaboration, the Homecoming Air Max Plus TN. As documented by Folahanmi Ayodele Onajoko.",
    },
    "STREET SOUK EDITORIAL 2026": {
      title: "StreetSouk Editorial",
      caption:
        "Editorial for StreetSouk. Photographed StreetSouk’s 2026 Summer editorial campaign including retail brands on their line.",
    },
    "KAI CENAT IN LAGOS": {
      title: "Kai Cenat",
      caption:
        "Kai’s arrival to Lagos for his charity intervention in the Makoko community school upliftment. As covered by Folahanmi Ayodele Onajoko.",
    },
    "GUNNA WORLD TOUR LAGOS": {
      title: "Wunna World Tour by Gunna",
      caption:
        "Had the opportunity to work with the media team to document the Lagos stop of the WUNNA world tour by Gunna.",
    },
    "Omahlay's Sophomore Listening": {
      title: "Omah Lay’s Sophomore Album",
      caption:
        "Omahlay’s Special Listening occasion for Clarity Of Mind, the singer’s sophomore album, 2026. As documented by Folahanmi Ayodele Onajoko.",
    },
    "STREETSOUK AT LAGOS FASHION WEEK": {
      title: "StreetSouk & Lagos Fashion Week",
      caption:
        "Documented the first streetwear brand to walk at the prestigious Lagos Fashion Week, 2025.",
    },
    "StreetSouk Convention 2025": {
      title: "StreetSouk Annual Convention",
      caption:
        "The biggest streetwear convention in Africa, 2025 edition. As documented by Folahanmi Ayodele Onajoko.",
    },
    "AMAZON X NEMSIA PRODUCTION": {
      title: "Amazon Prime & Nemsia Production",
      caption:
        "Private screenings for the Amazon & Nemsia 2025 Film, “Ms. Kanyin”. As documented by Folahanmi Ayodele Onajoko.",
    },
    "Clint's Portraits": {
      title: "Clint at Homecoming",
      caption:
        "Portraits of Corteiz Founder, Clint Ogbenna, at the Homecoming 2026 Summit. As documented by Folahanmi Ayodele Onajoko.",
    },
  };

  function getFeaturedMeta(folderName) {
    if (!folderName) return null;
    if (FEATURED_PROJECTS[folderName]) return FEATURED_PROJECTS[folderName];
    const unicodeVariant = folderName.replace(/'/g, "’");
    if (FEATURED_PROJECTS[unicodeVariant]) return FEATURED_PROJECTS[unicodeVariant];
    const asciiVariant = folderName.replace(/’/g, "'");
    if (FEATURED_PROJECTS[asciiVariant]) return FEATURED_PROJECTS[asciiVariant];
    return null;
  }

  function enterProjectView(folderName) {
    const meta = getFeaturedMeta(folderName);
    const intro = document.getElementById("project-intro");
    const titleEl = document.getElementById("project-title");
    const captionEl = document.getElementById("project-caption");

    document.body.classList.add("project-view");
    if (imagesContainer) imagesContainer.innerHTML = "";
    if (subcategoriesContainer) subcategoriesContainer.innerHTML = "";

    if (meta && intro && titleEl && captionEl) {
      titleEl.textContent = meta.title;
      captionEl.textContent = meta.caption;
      intro.hidden = false;
      document.title = `theayofolahan — ${meta.title}`;
    }

    renderGallery(folderName);
  }

  // Deep-link support: homepage featured projects (?project=) or legacy (?subcategory=)
  try {
    const params = new URLSearchParams(window.location.search);
    const projectParam =
      window.__TAF_PROJECT__ ||
      params.get("project") ||
      params.get("subcategory");

    if (projectParam) {
      const folderName = folderByDisplayName[projectParam]
        ? folderByDisplayName[projectParam]
        : projectParam;

      // Homepage tiles always use ?project= — open clean project view
      if (params.get("project") || window.__TAF_PROJECT__ || getFeaturedMeta(folderName)) {
        enterProjectView(folderName);
      } else {
        renderGallery(folderName);
      }
    }
  } catch (e) {
    console.warn("Failed to parse project/subcategory param:", e);
  }
});