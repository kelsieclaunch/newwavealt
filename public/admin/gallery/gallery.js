document.addEventListener('DOMContentLoaded', async () => {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();


    if (error || !session) {

        window.location.href = "../index.html";

        return;

    }

    const form = document.getElementById('galleryUploadForm');
    const message = document.getElementById('uploadStatus');
    function formatOrientation(value) {

        switch (value) {

            case "portrait":
                return "Portrait Only";

            case "landscape":
                return "Landscape Only";

            case "either":
                return "Either";

            default:
                return "No layout selected";

        }

    }


    async function createOptimizedImage(file, maxDimension, quality) {

        const bitmap = await createImageBitmap(file);

        const scale = Math.min(
            1,
            maxDimension / Math.max(bitmap.width, bitmap.height)
        );

        const width = Math.round(bitmap.width * scale);
        const height = Math.round(bitmap.height * scale);

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(bitmap, 0, 0, width, height);

        bitmap.close();

        const blob = await new Promise((resolve, reject) => {

            canvas.toBlob(result => {

                if (!result) {
                    reject(new Error("Image optimization failed."));
                    return;
                }

                resolve(result);

            }, "image/jpeg", quality);

        });

        // TEMP CHECK HERE
        if (blob.type !== "image/jpeg") {
            throw new Error("Your browser could not generate JPEG images.");
        }
        // END TEMP CHECK

        return blob;

    }



    async function loadGallery() {

        const container = document.getElementById('galleryItems');

        if (!container) return;


        const { data, error } = await supabaseClient
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });


        if (error) {
            console.error(error);
            container.textContent = "Failed to load gallery.";
            return;
        }


        container.innerHTML = "";


        data.forEach(item => {

            const { data: urlData } =
                supabaseClient.storage
                    .from('gallery')
                    .getPublicUrl(item.image_path);


            const card = document.createElement('div');

            card.className = "gallery-admin-card";


            card.innerHTML = `

                <img 
                    src="${urlData.publicUrl}"
                    alt="${item.alt_text || ''}"
                >

                <div>

                    <h4>${item.artist || "Unknown Artist"}</h4>

                    <p>
                        ${item.photographer || "No Photographer"}
                    </p>

                    <p>
                        ${formatOrientation(item.orientation)}
                    </p>

                    <p>
                        Status: ${item.is_published ? "Published" : "Draft"}
                    </p>

                    <button
                        type="button"
                        class="publish-button ${item.is_published ? "published" : "draft"}"
                    >
                        ${item.is_published ? "UNPUBLISH" : "PUBLISH"}
                    </button>

                    <button
                        type="button"
                        class="edit-button"
                    >
                        EDIT DETAILS
                    </button>

                    <button
                        type="button"
                        class="delete-button"
                    >
                        DELETE
                    </button>

                </div>

            `;


            container.appendChild(card);

            // PUBLISH LISTENER

            card.querySelector(".publish-button").addEventListener("click", async () => {

                const { error } = await supabaseClient
                    .from("gallery")
                    .update({
                        is_published: !item.is_published
                    })
                    .eq("id", item.id);

                if (error) {
                    console.error(error);
                    return;
                }

                await loadGallery();

            });

            // EDIT LISTENER

            card.querySelector(".edit-button").addEventListener("click", () => {

                card.innerHTML = `

                    <img 
                        src="${urlData.publicUrl}"
                        alt="${item.alt_text || ''}"
                    >

                    <div class="edit-form">

                        <label>
                            ARTIST
                        </label>

                        <input 
                            class="edit-artist"
                            value="${item.artist || ''}"
                        >


                        <label>
                            PHOTOGRAPHER
                        </label>

                        <input 
                            class="edit-photographer"
                            value="${item.photographer || ''}"
                        >


                        <label>
                            PHOTOGRAPHER INSTAGRAM
                        </label>

                        <input 
                            class="edit-instagram"
                            value="${item.photographer_instagram || ''}"
                        >


                        <label>
                            ALT TEXT
                        </label>

                        <input 
                            class="edit-alt"
                            value="${item.alt_text || ''}"
                        >


                        <label>
                            DISPLAY LAYOUT
                        </label>

                        <select class="edit-orientation">

                            <option value="portrait" ${item.orientation === "portrait" ? "selected" : ""}>
                                Portrait Only
                            </option>

                            <option value="landscape" ${item.orientation === "landscape" ? "selected" : ""}>
                                Landscape Only
                            </option>

                            <option value="either" ${item.orientation === "either" ? "selected" : ""}>
                                Either
                            </option>

                        </select>


                        <button 
                            type="button"
                            class="save-button"
                        >
                            SAVE
                        </button>


                        <button
                            type="button"
                            class="cancel-button"
                        >
                            CANCEL
                        </button>

                    </div>

                `;

                card.querySelector(".save-button").addEventListener("click", async () => {

                    const { error } = await supabaseClient
                        .from("gallery")
                        .update({

                            artist:
                                card.querySelector(".edit-artist").value,

                            photographer:
                                card.querySelector(".edit-photographer").value,

                            photographer_instagram:
                                card.querySelector(".edit-instagram").value,

                            alt_text:
                                card.querySelector(".edit-alt").value,

                            orientation:
                                card.querySelector(".edit-orientation").value

                        })
                        .eq("id", item.id);


                    if (error) {

                        console.error(error);
                        alert("Failed to update image.");

                        return;

                    }

                    alert("Updated successfully!");


                    await loadGallery();

                });

                card.querySelector(".cancel-button").addEventListener("click", async () => {

                    await loadGallery();

                });

            });

            // DELETE LISTENER

            card.querySelector(".delete-button").addEventListener("click", async () => {

                const confirmed = confirm(
                    "Delete this image permanently?\n\nThis cannot be undone."
                );

                if (!confirmed) return;

                try {

                    // Delete all image versions from Storage
                    const imagePaths = [
                        item.image_path,
                        item.thumbnail_path,
                        item.lightbox_path
                    ].filter(Boolean);

                    const { error: storageError } =
                        await supabaseClient.storage
                            .from("gallery")
                            .remove(imagePaths);



                    if (storageError) throw storageError;


                    // Delete database record
                    const { error: databaseError } =
                        await supabaseClient
                            .from("gallery")
                            .delete()
                            .eq("id", item.id);

                    if (databaseError) throw databaseError;


                    await loadGallery();

                } catch (error) {

                    console.error(error);
                    alert("Failed to delete image.");

                }

            });

        });

    }



    
    if (form) {

        form.addEventListener('submit', async (e) => {

            e.preventDefault();

            const fileInput = document.getElementById('image');
            const file = fileInput.files[0];

            if (!file) {
                message.textContent = "Please select an image.";
                return;
            }

            const uploadedPaths = [];

            try {

                message.textContent = "Optimizing images...";

                // Generate unique filenames
                const timestamp = Date.now();
                const safeName = file.name.replace(/\s+/g, "-");

                const extensionIndex = safeName.lastIndexOf(".");
                const nameWithoutExtension = extensionIndex > 0
                    ? safeName.slice(0, extensionIndex)
                    : safeName;

                const originalPath = `${timestamp}-${safeName}`;
                const baseName = `${timestamp}-${nameWithoutExtension}`;


                const thumbnailPath = `${baseName}-thumbnail.jpeg`;
                const lightboxPath = `${baseName}-lightbox.jpeg`;

                // Generate optimized images
                const thumbnail = await createOptimizedImage(
                    file,
                    700,
                    0.82
                );

                const lightboxImage = await createOptimizedImage(
                    file,
                    1800,
                    0.88
                );

                // Upload original
                message.textContent = "Uploading original image...";

                const { error: originalError } =
                    await supabaseClient.storage
                        .from("gallery")
                        .upload(originalPath, file);

                if (originalError) throw originalError;

                uploadedPaths.push(originalPath);

                // Upload thumbnail
                message.textContent = "Uploading thumbnail...";

                const { error: thumbnailError } =
                    await supabaseClient.storage
                        .from("gallery")
                        .upload(thumbnailPath, thumbnail, {
                            contentType: "image/jpeg"
                        });

                if (thumbnailError) throw thumbnailError;

                uploadedPaths.push(thumbnailPath);

                // Upload lightbox image
                message.textContent = "Uploading lightbox image...";

                const { error: lightboxError } =
                    await supabaseClient.storage
                        .from("gallery")
                        .upload(lightboxPath, lightboxImage, {
                            contentType: "image/jpeg"
                        });

                if (lightboxError) throw lightboxError;

                uploadedPaths.push(lightboxPath);

                // Insert database record
                message.textContent = "Saving gallery details...";

                const { error: databaseError } =
                    await supabaseClient
                        .from("gallery")
                        .insert({

                            image_path: originalPath,
                            thumbnail_path: thumbnailPath,
                            lightbox_path: lightboxPath,

                            artist:
                                document.getElementById('artist').value,

                            photographer:
                                document.getElementById('photographer').value,

                            photographer_instagram:
                                document.getElementById('photographerInstagram').value,

                            alt_text:
                                document.getElementById('altText').value,

                            orientation:
                                document.getElementById('orientation').value

                        });

                if (databaseError) throw databaseError;

                message.textContent = "Upload successful!";

                form.reset();

                await loadGallery();

            } catch (error) {

                console.error(error);

                // Clean up files if the upload or database insert fails
                if (uploadedPaths.length > 0) {

                    const { error: cleanupError } =
                        await supabaseClient.storage
                            .from("gallery")
                            .remove(uploadedPaths);

                    if (cleanupError) {
                        console.error("Failed to clean up uploaded files:", cleanupError);
                    }

                }

                message.textContent = error.message;

            }

        });

    }




    // load existing images on page load
    loadGallery();


});