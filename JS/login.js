document.addEventListener("DOMContentLoaded", () => {

    const API = "https://game-backend-kgbl.onrender.com";

    /* --- UI ELEMENT SELECTORS --- */
    const loginCard = document.getElementById('login-card');
    const signupCard = document.getElementById('signup-card');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    /* --- TOGGLE BETWEEN LOGIN & SIGNUP --- */
    if (showSignup) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.classList.add('hidden');
            signupCard.classList.remove('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupCard.classList.add('hidden');
            loginCard.classList.remove('hidden');
        });
    }

    /* --- LOGIN FORM SUBMISSION --- */
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPass').value.trim();
            const errorMsg = document.getElementById('loginError');
            const loginBtn = document.getElementById('loginBtn');

            if (errorMsg) errorMsg.innerText = "";
            if (loginBtn) loginBtn.classList.add('loading');

            try {
                const response = await fetch(`${API}/security/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    if (errorMsg) errorMsg.innerText = data.detail || "Invalid credentials.";
                    if (loginBtn) loginBtn.classList.remove('loading');
                    return;
                }

                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                localStorage.setItem('gh_username', data.username);
                localStorage.setItem('isLoggedIn', 'true');

                window.location.href = "index.html";

            } catch (err) {
                console.error("Login error:", err);
                if (errorMsg) errorMsg.innerText = "Could not reach server. Please try again.";
                if (loginBtn) loginBtn.classList.remove('loading');
            }
        });
    }

    /* --- SIGNUP FORM SUBMISSION --- */
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('signupUser').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPass').value.trim();
            const confirmPassword = document.getElementById('confirmPass').value.trim();
            const errorMsg = document.getElementById('signupError');
            const successMsg = document.getElementById('signupSuccess');
            const signupBtn = document.getElementById('signupBtn');

            if (errorMsg) errorMsg.innerText = "";
            if (successMsg) successMsg.innerText = "";

            if (password !== confirmPassword) {
                if (errorMsg) errorMsg.innerText = "Passwords do not match!";
                return;
            }

            if (signupBtn) signupBtn.classList.add('loading');

            try {
                const response = await fetch(`${API}/security/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    if (errorMsg) errorMsg.innerText = data.detail || "Signup failed.";
                    if (signupBtn) signupBtn.classList.remove('loading');
                    return;
                }

                if (successMsg) successMsg.innerText = "Account created! Please log in.";
                if (signupBtn) signupBtn.classList.remove('loading');

                setTimeout(() => {
                    signupCard.classList.add('hidden');
                    loginCard.classList.remove('hidden');
                }, 1500);

            } catch (err) {
                console.error("Signup error:", err);
                if (errorMsg) errorMsg.innerText = "Could not reach server. Please try again.";
                if (signupBtn) signupBtn.classList.remove('loading');
            }
        });
    }
});