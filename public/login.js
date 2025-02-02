document.addEventListener("DOMContentLoaded", function () {
    const submitButton = document.getElementById("submit");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const roleSelect = document.getElementById("role");

    submitButton.addEventListener("click", async function () {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const role = roleSelect.value;

        // basic validation
        if (!email || !password) {
            alert("Please fill in both email and password.");
            return;
        }

        // prepare login data
        const loginData = {
            email: email,
            password: password,
            role: role
        };

        console.log("Logging in with data:", loginData);
        // show loading indicator
        submitButton.disabled = true;
        submitButton.value = "Logging in...";

        try {
            // send login data to the server
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (!response.ok) {
                throw new Error('Login failed: ' + response.statusText);
            }

            const data = await response.json();

            // handle successful login
            console.log('Login successful:', data);

            // saving tokens to local storage with respective keys
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            window.location.href = '/dashboard'; // redirect to dashboard shell

        } catch (error) {
            console.error(error);
            alert('Login failed. Please check your credentials and try again.');

            // restore button
            submitButton.disabled = false;
            submitButton.value = "Log in";
        }
    });
});
