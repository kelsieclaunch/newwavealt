document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("galleryPreview");

    function assignGalleryLayouts(items) {

        const columns = 6;

        const occupied = [];

        let maxRow = 0;
        let occupiedCells = 0;

        let eitherCounter = 0;


        // Check whether a rectangular slot is available

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


        // Evaluate a possible position

        function findBestPosition(width, height) {

            let best = null;

            for (let row = 0; row <= maxRow + height; row++) {

                for (let col = 0; col < columns; col++) {

                    if (!canPlace(row, col, width, height)) {
                        continue;
                    }

                    const resultingRows =
                        Math.max(maxRow, row + height);

                    const resultingCells =
                        occupiedCells + width * height;

                    const emptyCells =
                        resultingRows * columns - resultingCells;


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


        // Reserve the selected position

        function occupy(position) {

            const {
                row,
                col,
                width,
                height
            } = position;


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


        // Assign a layout to every image

        return items.map(item => {

            let layout = item.orientation;

            let position;


            if (layout === "portrait") {

                position = findBestPosition(2, 5);

            }

            else if (layout === "landscape") {

                position = findBestPosition(3, 3);

            }

            else {

                // Either: evaluate both possible shapes

                const portraitPosition =
                    findBestPosition(2, 5);

                const landscapePosition =
                    findBestPosition(3, 3);


                if (
                    portraitPosition.emptyCells <
                    landscapePosition.emptyCells
                ) {

                    layout = "portrait";
                    position = portraitPosition;

                }

                else if (
                    landscapePosition.emptyCells <
                    portraitPosition.emptyCells
                ) {

                    layout = "landscape";
                    position = landscapePosition;

                }

                else {

                    // If equally good, alternate the layout

                    if (eitherCounter % 2 === 0) {

                        layout = "portrait";
                        position = portraitPosition;

                    }

                    else {

                        layout = "landscape";
                        position = landscapePosition;

                    }

                    eitherCounter++;

                }

            }


            occupy(position);


            return {
                item,
                layout,
                position
            };

        });

    }

    


    async function loadGalleryPreview() {

        const { data, error } = await supabaseClient
            .from("gallery")
            .select("*")
            .eq("is_published", true)
            .order("created_at", { ascending: false });


        if (error) {

            console.error(error);

            container.textContent = "Failed to load gallery.";

            return;

        }


        container.innerHTML = "";


        const layoutItems = assignGalleryLayouts(data);

        layoutItems.forEach(({ item, layout, position }) => {

            const { data: urlData } =
                supabaseClient.storage
                    .from("gallery")
                    .getPublicUrl(item.image_path);


            const galleryItem = document.createElement("div");

            galleryItem.className = `preview-item ${layout}`;

            galleryItem.style.gridColumn =
                `${position.col + 1} / span ${position.width}`;

            galleryItem.style.gridRow =
                `${position.row + 1} / span ${position.height}`;


            galleryItem.innerHTML = `

                <img
                    src="${urlData.publicUrl}"
                    alt="${item.alt_text || ""}"
                    loading="lazy"
                >

                <div class="preview-overlay">

                    <a
                        href="${item.photographer_instagram || "#"}"
                        class="overlay-text"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <h6>
                            <em>
                                ${item.artist || "Unknown Artist"},
                            photographed by
                            ${item.photographer || "Unknown Photographer"}
                            </em>
                        </h6>
                    </a>

                    <button
                        class="expand-btn"
                        aria-label="Expand image"
                    >
                        <img
                            src="/assets/white expand.svg"
                            alt=""
                        >
                    </button>

                </div>

            `;

            container.appendChild(galleryItem);

        });

    }

    


    loadGalleryPreview();

});