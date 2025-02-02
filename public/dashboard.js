document.addEventListener("DOMContentLoaded", async function () {
    // Retrieve tokens from localStorage
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // Check if tokens exists
    if (!accessToken || !refreshToken) {
        window.location.href = '/';
    }

    try {
        // Verify the access token
        const parts = accessToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        // Decode the payload to get the role
        const payload = parts[1];
        const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        const role = decodedPayload.role;

        if (!role) {
            throw new Error('Invalid JWT');
        }

        // Fetch role-specific content
        const response = await fetch(`/${role.toLowerCase()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        });

        // Fetch role-specific content
        // const response = await fetch(`/student/achievements/${decodedPayload.id}`, {
        //     method: 'GET',
        //     headers: {
        //         'Authorization': `Bearer ${accessToken}`,
        //         'Content-Type': 'application/json',
        //     }
        // });

        if (!response.ok) {
            // If the access token is expired, try to refresh it
            if (response.status === 401) {
                const refreshResponse = await fetch('/auth/refresh-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('accessToken', data.newAccessToken);
                    // Retry fetching achievements
                    return await fetch(`/${role.toLowerCase()}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        }
                    });
                } else {
                    throw new Error('Unable to refresh token');
                }
            }
            throw new Error('Failed to fetch dashboard');
        }

        const dashboard = await response.text();
        console.log(dashboard);
        
        // Render dashboard
        const dashboardContainer = document.getElementById('app');
        dashboardContainer.innerHTML = dashboard;
        addLogoutListener();

    } catch (error) {
        console.error(error);
        window.location.href = '/';
    }
});

