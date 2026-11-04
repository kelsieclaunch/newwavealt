document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("galleryPreview");

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxCaptionLink = document.getElementById("lightboxCaptionLink");

    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxPrev = document.getElementById("lightboxPrev");
    const lightboxNext = document.getElementById("lightboxNext");

    let galleryImages = [];
    let currentIndex = 0;


    // LOAD

    async function loadGallery() {

        const { data, error } = await supabaseClient
            .from("gallery")
            .select("*")
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to load gallery:", error);
            container.textContent = "Failed to load gallery.";
            return;
        }

        galleryImages = data || [];

        container.innerHTML = "";

        if (galleryImages.length === 0) {
            container.textContent = "No gallery images available.";
            return;
        }

        const layoutItems = assignGalleryLayouts(galleryImages);

        layoutItems.forEach(({ item, layout, position }) => {

            const { data: urlData } = supabaseClient.storage
                .from("gallery")
                .getPublicUrl(item.image_path);

            const imageUrl = urlData.publicUrl;

            const galleryItem = document.createElement("div");

            galleryItem.className = `preview-item ${layout}`;

            galleryItem.style.gridColumn =
                `${position.col + 1} / span ${position.width}`;

            galleryItem.style.gridRow =
                `${position.row + 1} / span ${position.height}`;


            // Image

            const image = document.createElement("img");

            image.src = imageUrl;
            image.alt = item.alt_text || "";
            image.loading = "lazy";


            // Overlay

            const overlay = document.createElement("div");

            overlay.className = "preview-overlay";


            // Artist / photographer credit

            const creditLink = document.createElement("a");

            creditLink.className = "overlay-text";

            creditLink.href = item.photographer_instagram || "#";

            creditLink.target = "_blank";
            creditLink.rel = "noopener noreferrer";


            const credit = document.createElement("h6");

            const creditText = document.createElement("em");

            creditText.textContent =
                `${item.artist || "Unknown Artist"}, photographed by ${item.photographer || "Unknown Photographer"}`;

            credit.appendChild(creditText);
            creditLink.appendChild(credit);

            overlay.appendChild(creditLink);


            // Expand button

            const expandButton = document.createElement("button");

            expandButton.className = "expand-btn";
            expandButton.type = "button";
            expandButton.setAttribute("aria-label", "Expand image");

            const expandIcon = document.createElement("img");

            expandIcon.src = "assets/white expand.svg";
            expandIcon.alt = "";

            expandButton.appendChild(expandIcon);

            overlay.appendChild(expandButton);


            // Assemble gallery item

            galleryItem.appendChild(image);
            galleryItem.appendChild(overlay);

            container.appendChild(galleryItem);


            // Expand image into lightbox

            expandButton.addEventListener("click", event => {

                event.stopPropagation();

                currentIndex = galleryImages.indexOf(item);

                openLightbox(currentIndex);

            });


            // Mobile overlay interaction

            galleryItem.addEventListener("click", event => {

                if (window.matchMedia("(max-width: 950px)").matches) {

                    if (event.target.closest(".expand-btn")) {
                        return;
                    }

                    if (event.target.closest(".overlay-text")) {
                        return;
                    }

                    galleryItem.classList.toggle("active");

                }

            });

        });

    }


// GALLERY LAYOUT

    function assignGalleryLayouts(items) {

        const columns = 6;

        const occupied = [];

        let maxRow = 0;
        let occupiedCells = 0;
        let eitherCounter = 0;


        function canPlace(row, col, width, height) {

            if (col + width > columns) {
                return false;
            }

            for (let r = row; r < row + height; r++) {

                for (let c = col; c < col + width; c++) {

                    if (occupied[r]?.[c]) {
                        return false;
                    }

                }

            }

            return true;

        }


        function findBestPosition(width, height) {

            let best = null;

            for (let row = 0; row <= maxRow + height; row++) {

                for (let col = 0; col < columns; col++) {

                    if (!canPlace(row, col, width, height)) {
                        continue;
                    }

                    const resultingRows = Math.max(maxRow, row + height);

                    const resultingCells = occupiedCells + width * height;

                    const emptyCells = resultingRows * columns - resultingCells;

                    const candidate = {
                        row,
                        col,
                        width,
                        height,
                        emptyCells,
                        resultingRows
                    };


                    if (
                        !best ||

                        candidate.emptyCells < best.emptyCells ||

                        (
                            candidate.emptyCells === best.emptyCells &&
                            candidate.resultingRows < best.resultingRows
                        ) ||

                        (
                            candidate.emptyCells === best.emptyCells &&
                            candidate.resultingRows === best.resultingRows &&
                            candidate.row < best.row
                        ) ||

                        (
                            candidate.emptyCells === best.emptyCells &&
                            candidate.resultingRows === best.resultingRows &&
                            candidate.row === best.row &&
                            candidate.col < best.col
                        )

                    ) {

                        best = candidate;

                    }

                }

            }

            return best;

        }


        function occupy(position) {

            const { row, col, width, height } = position;

            for (let r = row; r < row + height; r++) {

                if (!occupied[r]) {
                    occupied[r] = [];
                }

                for (let c = col; c < col + width; c++) {

                    occupied[r][c] = true;

                }

            }

            occupiedCells += width * height;

            maxRow = Math.max(maxRow, row + height);

        }


        return items.map(item => {

            let layout = item.orientation;

            let position;


            if (layout === "portrait") {

                position = findBestPosition(2, 5);

            } else if (layout === "landscape") {

                position = findBestPosition(3, 3);

            } else {

                const portraitPosition = findBestPosition(2, 5);

                const landscapePosition = findBestPosition(3, 3);


                if (portraitPosition.emptyCells < landscapePosition.emptyCells) {

                    layout = "portrait";
                    position = portraitPosition;

                } else if (landscapePosition.emptyCells < portraitPosition.emptyCells) {

                    layout = "landscape";
                    position = landscapePosition;

                } else {

                    if (eitherCounter % 2 === 0) {

                        layout = "portrait";
                        position = portraitPosition;

                    } else {

                        layout = "landscape";
                        position = landscapePosition;

                    }

                    eitherCounter++;

                }

            }


            occupy(position);

            return { item, layout, position };

        });

    }


   
    // LIGHTBOX
   

    function openLightbox(index) {

        currentIndex = index;

        showLightboxImage(currentIndex);

        lightbox.classList.add("active");

        document.body.style.overflow = "hidden";

    }


    function showLightboxImage(index) {

        if (!galleryImages.length) {
            return;
        }

        currentIndex =
            (index + galleryImages.length) % galleryImages.length;

        const item = galleryImages[currentIndex];

        const { data: urlData } = supabaseClient.storage
            .from("gallery")
            .getPublicUrl(item.image_path);

        lightboxImg.src = urlData.publicUrl;

        lightboxImg.alt = item.alt_text || "";


        const caption =
            `${item.artist || "Unknown Artist"}, photographed by ${item.photographer || "Unknown Photographer"}`;

        lightboxCaptionLink.textContent = caption;

        lightboxCaptionLink.href =
            item.photographer_instagram || "#";

    }


    function closeLightbox() {

        lightbox.classList.remove("active");

        document.body.style.overflow = "";

    }


    function showPreviousImage() {

        showLightboxImage(currentIndex - 1);

    }


    function showNextImage() {

        showLightboxImage(currentIndex + 1);

    }


    // Lightbox controls

    lightboxClose.addEventListener("click", closeLightbox);

    lightboxPrev.addEventListener("click", showPreviousImage);

    lightboxNext.addEventListener("click", showNextImage);


    // Close when clicking outside the image

    lightbox.addEventListener("click", event => {

        if (event.target === lightbox) {
            closeLightbox();
        }

    });


    // Keyboard navigation

    document.addEventListener("keydown", event => {

        if (!lightbox.classList.contains("active")) {
            return;
        }

        if (event.key === "Escape") {
            closeLightbox();
        }

        if (event.key === "ArrowLeft") {
            showPreviousImage();
        }

        if (event.key === "ArrowRight") {
            showNextImage();
        }

    });

    // INITIALIZE
  

    await loadGallery();

});