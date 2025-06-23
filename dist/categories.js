document.addEventListener("DOMContentLoaded", () => {
  // Subcategories data for each category
  const subcategories = {
    brandcampaignshoot: ["ASABI - PILOT", "ASABI - SEQUEL", "COZY", "MINX", "MOHA", "QUAINT - OUTLANDISH", "STOMFIT - EMINENCE", "STOMFIT - SERENE DAYS", "UNICBROEK", "WBF", "XPLORE"],
    bts: ["INTRO"],
    event: ["ACTIVEYARD", "ALTE51", "STREET SOUK 23’", "STREET SOUK 24’"],
    lifestyle: ["BUJU", "GUNNA", "YHEMOLEE"],
    portrait: ["AVL", "FISOLA", "RUBY", "TIMI", "TINMEYIN"],
  };

  // Mapping subcategories to R2 bucket folders
  const subcategoryToFolderMap = {
    "ASABI - PILOT": "ASABI - PILOT",
    "ASABI - SEQUEL": "ASABI - SEQUEL",
    "COZY": "COZY",
    "MINX": "MINX",
    "MOHA": "MOHA",
    "QUAINT - OUTLANDISH": "QUAINT - OUTLANDISH",
    "STOMFIT - EMINENCE": "STOMFIT - EMINENCE",
    "STOMFIT - SERENE DAYS": "STOMFIT - SERENE DAYS",
    "UNICBROEK": "UNICBROEK",
    "WBF": "WBF",
    "XPLORE": "XPLORE",
    "INTRO": "INTRO",
    "ACTIVEYARD": "ACTIVEYARD",
    "ALTE51": "ALTE51",
    "STREET SOUK 23’": "STREET SOUK 23'",
    "STREET SOUK 24’": "STREET SOUK 24",
    "BUJU": "BUJU",
    "GUNNA": "GUNNA",
    "AVL": "AVL",
    "FISOLA": "FISOLA",
    "RUBY": "RUBY",
    "TIMI": "TIMI",
    "TINMEYIN": "TINMEYIN",
    "YHEMOLEE": "YHEMOLEE",
  };

  // PREDEFINED IMAGE LISTS FOR SUBCATEGORIES
  // This structure will hold the list of image filenames for each subcategory.
  // It needs to be populated based on the actual images in your R2 bucket for each folder.
  // For example:
  // "SUBCATEGORY_NAME_AS_IN_subcategoryToFolderMap_KEY": ["image1.jpg", "image2.png", "image3.webp"],
  const subcategoryImages = {
    "ACTIVEYARD": [
      "lumi3.jpg",
      "ykb10.jpg",
      "ykb15.jpg",
      "ykb16.jpg",
      "ykb17.jpg",
      "ykb4.jpg",
      "ykb6.jpg",
      "ykb8.jpg",
      "ykb9.jpg"
    ],
    "ASABI - PILOT": [
      "abi1.jpg",
      "abi11.jpg",
      "abi17.jpg",
      "abi18.jpg",
      "abi2.jpg",
      "abi20.jpg",
      "abi3.jpg",
      "abi4.jpg",
      "abi7.jpg"
    ],
    "ASABI - SEQUEL": [
      "asabi1.jpg",
      "asabi11a.jpg",
      "asabi12.jpg",
      "asabi13.jpg",
      "asabi14.jpg",
      "asabi18.jpg",
      "asabi2.jpg",
      "asabi23.jpg",
      "asabi24.jpg",
      "asabi25.jpg",
      "asabi26.jpg",
      "asabi27.jpg",
      "asabi28.jpg",
      "asabi29.jpg",
      "asabi4.jpg",
      "asabi5.jpg",
      "asabi7.jpg",
      "asabi8.jpg",
      "asabi9.jpg"
    ],
    "AVL": [
      "avl grid1.jpg",
      "avl1.jpg",
      "avl10.jpg",
      "avl11.jpg",
      "avl12.jpg",
      "avl2.jpg",
      "avl3.jpg",
      "avl4.jpg",
      "avl6.jpg",
      "avl7.jpg",
      "avl8.jpg",
      "avl9.jpg"
    ],
    "GUNNA": [
      "DSC06394.jpg",
      "DSC06402.jpg",
      "DSC06404.jpg",
      "DSC06405.jpg",
      "DSC06409.jpg",
      "DSC06416.jpg",
      "DSC06423.jpg",
      "DSC06424.jpg",
      "DSC06425.jpg",
      "DSC06431.jpg",
      "DSC06436.jpg",
      "DSC06446.jpg",
      "DSC06448.jpg",
      "DSC06454.jpg",
      "DSC06462.jpg",
      "DSC06465.jpg"
    ],
    "MINX": [
      "minx 1a.jpg",
      "minx 2a.jpg",
      "minx b5.jpg",
      "minx b6.jpg",
      "minx1.jpg",
      "minx2.jpg",
      "minx3.jpg",
      "minx6.jpg",
      "minx9.jpg",
      "minxb1.jpg"
    ],
    "QUAINT - OUTLANDISH": [
      "quaint2.jpg",
      "quaint21.jpg",
      "quaint3.jpg",
      "quaint4.jpg",
      "quaint5.jpg",
      "quaint6.jpg",
      "quaint8.jpg"
    ],
    "STOMFIT - EMINENCE": [
      "stomfit bts1.JPG",
      "stomfit2a.JPG",
      "stomfit4 2.JPG",
      "stomfit5.JPG",
      "stomfitmj11.JPG",
      "stomfitmj12.JPG",
      "stomfitmj13.JPG",
      "stomfitmj17.JPG",
      "stomfitmj4.JPG",
      "stomfitmj5.JPG",
      "stomfitmj7.JPG"
    ],
    "STOMFIT - SERENE DAYS": [
      "s1.jpg",
      "s10.jpg",
      "s11.jpg",
      "s12.jpg",
      "s13.jpg",
      "s2.jpg",
      "s3.jpg",
      "s4.jpg",
      "s5.jpg",
      "s6.jpg",
      "s7.jpg",
      "s8.jpg",
      "s9.jpg",
      "stomfit1.jpg",
      "stomfit10.jpg",
      "stomfit11.jpg",
      "stomfit12.jpg",
      "stomfit13.jpg",
      "stomfit14.jpg",
      "stomfit15.jpg",
      "stomfit16.jpg",
      "stomfit17.jpg",
      "stomfit18.jpg",
      "stomfit19.jpg",
      "stomfit2.jpg",
      "stomfit20.jpg",
      "stomfit21.jpg",
      "stomfit22.jpg",
      "stomfit23.jpg",
      "stomfit24.jpg",
      "stomfit25.jpg",
      "stomfit26.jpg",
      "stomfit27.jpg",
      "stomfit28.jpg",
      "stomfit29.jpg",
      "stomfit3.jpg",
      "stomfit30.jpg",
      "stomfit31.jpg",
      "stomfit32.jpg",
      "stomfit33.jpg",
      "stomfit34.jpg",
      "stomfit35.jpg",
      "stomfit36.jpg",
      "stomfit37.jpg",
      "stomfit38.jpg",
      "stomfit39.jpg",
      "stomfit6.jpg",
      "stomfit7.jpg",
      "stomfit8.jpg",
      "stomfit9.jpg"
    ],
    "STOMFIT FASHION CAMPAIGN 2": [
      "stomfit12.jpg",
      "stomfit13.jpg",
      "stomfit15.jpg",
      "stomfit16.jpg",
      "stomfit19.jpg",
      "stomfit23.jpg",
      "stomfit4.jpg",
      "stomfit6.jpg",
      "stomfit7.jpg",
      "stomfit8.jpg",
      "stomfit9.jpg"
    ],
    "STREET SOUK 23'": [
      "ss1.JPG",
      "ss10.JPG",
      "ss12 2.JPG",
      "ss16.JPG",
      "ss17.JPG",
      "ss19.JPG",
      "ss27.JPG",
      "ss3.JPG",
      "ss34.JPG",
      "ss44.JPG",
      "ss46.JPG",
      "ss49.JPG",
      "ss51.JPG",
      "ss57.JPG",
      "ss6.JPG",
      "ss64.JPG",
      "ss7.JPG",
      "ss73.JPG",
      "ss76.JPG",
      "ss78.JPG",
      "ss8.JPG",
      "ss89.JPG"
    ],
    "TINMEYIN": [
      "grid3.jpg",
      "grid4.jpg",
      "mey i.jpg",
      "mey1 2.jpg",
      "mey1.jpg",
      "mey10.jpg",
      "mey11.jpg",
      "mey2 2.jpg",
      "mey2.jpg",
      "mey3.jpg",
      "mey4.jpg",
      "mey5 2.jpg",
      "mey5.jpg",
      "mey6.jpg",
      "mey7.jpg",
      "mey8.jpg",
      "mey8i.jpg",
      "mey9.jpg"
    ],
    "WBF": [
      "outfit10A.jpg",
      "outfit11B.jpg",
      "outfit11E.jpg",
      "outfit11F.jpg",
      "outfit12Bi.jpg",
      "outfit12Ci.jpg",
      "outfit13E.jpg",
      "outfit14A.jpg",
      "outfit2A.jpg",
      "outfit3B.jpg",
      "outfit6A.jpg",
      "outfit7A.jpg",
      "outfit7E.jpg"
    ],
    "YHEMOLEE": [
      "YL.JPG",
      "YLrare.JPG",
      "YLrare1.JPG",
      "YLrare8 2.JPG"
    ],
    "ALTE51": [
      "s11.JPG",
      "s13.JPG",
      "s14.JPG",
      "s15.JPG",
      "s16.JPG",
      "s17.JPG",
      "s19.JPG",
      "s20.JPG",
      "s23.JPG",
      "s24.JPG",
      "s36.JPG",
      "s40.JPG",
      "s45.JPG",
      "s50.JPG",
      "s52.JPG",
      "s6.JPG",
      "s8.JPG",
      "s9.JPG"
    ],
    "BUJU": [
      "buju1.jpg",
      "buju2.jpg",
      "buju3.jpg",
      "buju4.jpg",
      "buju5.jpg"
    ],
    "FISOLA": [
      "DSC07087.jpg",
      "fisola1.jpg",
      "fisola2.jpg",
      "fisola3.jpg",
      "fisola4.jpg",
      "fisola5.jpg",
      "neeee.jpg",
      "new.jpg"
    ],
    "INTRO": [
      "intro1.jpg",
      "intro1bw.jpg",
      "intro2.jpg",
      "intro2bw.jpg",
      "intro3.jpg",
      "intro4.jpg",
      "intro5.jpg",
      "intro6.jpg",
      "intro7.jpg"
    ],
    "stomfit serene days - BTS": [
      "bts.jpg",
      "bts2.jpg",
      "bts3.jpg",
      "bts4.jpg",
      "btss-10.jpg",
      "btss-11.jpg",
      "btss-12.jpg",
      "btss-13.jpg",
      "btss-14.jpg",
      "btss-15.jpg",
      "btss-16.jpg",
      "btss-17.jpg",
      "btss-18.jpg",
      "btss-19.jpg",
      "btss-2.jpg",
      "btss-20.jpg",
      "btss-21.jpg",
      "btss-22.jpg",
      "btss-23.jpg",
      "btss-24.jpg",
      "btss-25.jpg",
      "btss-26.jpg",
      "btss-27.jpg",
      "btss-28.jpg",
      "btss-3.jpg",
      "btss-31.jpg",
      "btss-32.jpg",
      "btss-33.jpg",
      "btss-34.jpg",
      "btss-35.jpg",
      "btss-36.jpg",
      "btss-37.jpg",
      "btss-38.jpg",
      "btss-39.jpg",
      "btss-4.jpg",
      "btss-40.jpg",
      "btss-41.jpg",
      "btss-42.jpg",
      "btss-43.jpg",
      "btss-44.jpg",
      "btss-45.jpg",
      "btss-48.jpg",
      "btss-49.jpg",
      "btss-5.jpg",
      "btss-50.jpg",
      "btss-51.jpg",
      "btss-52.jpg",
      "btss-53.jpg",
      "btss-54.jpg",
      "btss-55.jpg",
      "btss-56.jpg",
      "btss-57.jpg",
      "btss-58.jpg",
      "btss-59.jpg",
      "btss-6.jpg",
      "btss-60.jpg",
      "btss-61.jpg",
      "btss-62.jpg",
      "btss-63.jpg",
      "btss-64.jpg",
      "btss-65.jpg",
      "btss-66.jpg",
      "btss-7.jpg",
      "btss-8.jpg",
      "btss-9.jpg",
      "btss.jpg"
    ],
    // Folders from the initial request that were not in the provided list
    // Will default to empty arrays, so no images will be shown unless filenames are added.
    "COZY": [],
    "MOHA": [],
    "UNICBROEK": [],
    "XPLORE": [],
    "STREET SOUK 24": [],
    "RUBY": [],
    "TIMI": []
  };

  const bucketBaseURL = "https://pub-5a19e82d4f1b46b78332b0f0c5af53a2.r2.dev/"; // Replace with your R2 bucket URL

  // Add event listeners to each category card
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      // Get the category ID
      const categoryId = event.currentTarget.id.replace("category-", "");

      // Clear previous subcategories
      const subcategoriesContainer = document.getElementById("subcategories-container");
      subcategoriesContainer.innerHTML = "";

      // Display subcategories for the clicked category
      if (subcategories[categoryId]) {
        subcategories[categoryId].forEach((subcategory) => {
          const subcategoryLink = document.createElement("a");
          subcategoryLink.className = "subcategory";
          subcategoryLink.href = "#"; // Make subcategories clickable
          subcategoryLink.textContent = subcategory;

          // Add click handler for subcategory to display a grid of pictures
          subcategoryLink.addEventListener("click", async (e) => {
            e.preventDefault();
            const imagesContainer = document.getElementById("image-container");
            imagesContainer.innerHTML = ""; // Clear previous gallery

            // Get the folder for the clicked subcategory
            const r2FolderName = subcategoryToFolderMap[subcategory];
            if (!r2FolderName) {
              const noFolderMessage = document.createElement("p");
              noFolderMessage.textContent = `R2 folder not mapped for subcategory "${subcategory}"`;
              noFolderMessage.className = "text-center text-red-500";
              imagesContainer.appendChild(noFolderMessage);
              return;
            }

            // Get the predefined list of image filenames for this R2 folder
            const imageList = subcategoryImages[r2FolderName];

            if (Array.isArray(imageList) && imageList.length > 0) {
              imageList.forEach((imageName) => {
                // Ensure proper URL encoding for folder and image names if they contain special characters.
                // JavaScript's encodeURIComponent can be too aggressive for path segments.
                // A simple replace for space with %20 is often sufficient for S3/R2 paths if other characters are avoided.
                const encodedR2FolderName = r2FolderName.replace(/ /g, "%20");
                const encodedImageName = imageName.replace(/ /g, "%20");
                const imageSrc = `${bucketBaseURL}${encodedR2FolderName}/${encodedImageName}`;
                
                const imageWrapper = document.createElement("div");
                // Classes like w-full, md:w-1/2, p-1 are removed as CSS Grid on parent handles layout.
                // The existing styles.css for #image-container div will apply.

                const imageContent = `
                  <div class="overflow-hidden h-full w-full">
                    <a href="${imageSrc}" data-fancybox="gallery">
                      <img
                        alt="gallery-image-${encodedImageName}"
                        class="block h-full w-full object-cover object-center opacity-0 animate-fade-in transition duration-500 transform scale-100 hover:scale-110"
                        src="${imageSrc}" />
                    </a>
                  </div>
                `;

                imageWrapper.innerHTML = imageContent;
                imagesContainer.appendChild(imageWrapper);
              });
            } else {
              const noImagesMessage = document.createElement("p");
              noImagesMessage.textContent = `No images defined for subcategory "${subcategory}" (folder: ${r2FolderName})`;
              noImagesMessage.className = "text-center text-gray-500";
              imagesContainer.appendChild(noImagesMessage);
            }
          });

          subcategoriesContainer.appendChild(subcategoryLink);
        });
      }
    });
  });
});