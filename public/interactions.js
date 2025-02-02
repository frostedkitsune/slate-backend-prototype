function addLogoutListener() {
    const logoutButton = document.getElementById("logout");

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

function addAchievementFetcherListener() {
    const fetchButton = document.getElementById("fetch-achievements");

    fetchButton.addEventListener("click", async function () {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
            alert("You are not logged in.");
            return;
        }

        try {
            // get linked student id
            const response = await fetch('/linked-student-id', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Id Fetching failed: ' + response.statusText);
            }

            const data = await response.json();
            try {
                // fetch and display student id
                const achievementResponse = await fetch(`/student/achievements/${data.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!achievementResponse.ok) {
                    throw new Error('Achievement Fetching failed: ' + response.statusText);
                }

                const achievementData = await achievementResponse.json();
                const achievementsContainer = document.getElementById("achievements");
                let achievementsHTML = '';
                
                achievementData.map((achievement) => {
                    achievementsHTML += '<li>' + achievement.name + ' from ' + achievement.school_name +
                        ', <em>achievement: ' + achievement.achievements + '</li>';
                });
                achievementsContainer.innerHTML = achievementsHTML;
            } catch (error) {
                console.error(error);
                alert('Fetching failed. Please try again.');
            }

        } catch (error) {
            console.error(error);
            alert('Fetching failed. Please try again.');
        }
    });
}