document.addEventListener('DOMContentLoaded', async () => {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();


    if (error || !session) {

        window.location.href = "../index.html";

        return;

    }

});