document.addEventListener("DOMContentLoaded", async () => {

    // Verify the user is logged in
    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.href = "index.html";
        return;
    }

    // Display the user's email
    const userEmail = document.getElementById("userEmail");

    if (userEmail) {
        userEmail.textContent = `Logged in as ${session.user.email}`;
    }

    // Log out
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {

            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                console.error(error);
                return;
            }

            window.location.href = "index.html";
        });
    }

});