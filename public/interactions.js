function addLogoutListener() {
    const logoutButton = document.getElementById("logout");
    console.log("jii");

    logoutButton.addEventListener("click", async function () {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            alert("You are not logged in.");
            return;
        }

        try {
            // send logout request to the server
            const response = await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                throw new Error('Logout failed: ' + response.statusText);
            }

            // clear tokens from local storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            alert('Logout successful.');
            // redirect to login page
            window.location.href = '/';
        } catch (error) {
            console.error(error);
            alert('Logout failed. Please try again.');
        }
    });
}