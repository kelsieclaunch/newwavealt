document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("galleryPreview");


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


        data.forEach(item => {

            const { data: urlData } =
                supabaseClient.storage
                    .from("gallery")
                    .getPublicUrl(item.image_path);


            const galleryItem = document.createElement("div");

            galleryItem.className =
                `preview-item ${item.orientation || "either"}`;


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