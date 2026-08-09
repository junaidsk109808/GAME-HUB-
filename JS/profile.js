document.addEventListener("DOMContentLoaded", () => {

    const API = "https://game-backend-kgbl.onrender.com";

    /* --- AUTH GUARD --- */
    const token = localStorage.getItem('access_token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn || !token) {
        window.location.href = 'login.html';
        return;
    }

    /* --- LOAD USER DATA --- */
    const username = localStorage.getItem('gh_username') || "PlayerOne";
    const gpu = localStorage.getItem('userGPU') || "—";
    const cpu = localStorage.getItem('userCPU') || "—";

    const profUsername = document.getElementById('prof-username');
    const avatarInitials = document.getElementById('avatar-initials');
    const badgeGpu = document.getElementById('badge-gpu');
    const badgeCpu = document.getElementById('badge-cpu');
    const displayUsername = document.getElementById('display-username');

    if (profUsername) profUsername.innerText = username;
    if (avatarInitials) avatarInitials.innerText = username.charAt(0).toUpperCase();
    if (badgeGpu) badgeGpu.innerText = `GPU: ${gpu}`;
    if (badgeCpu) badgeCpu.innerText = `CPU: ${cpu}`;
    if (displayUsername) displayUsername.innerText = username;

    /* --- FETCH USER INFO FROM API --- */
    async function loadUserInfo() {
        try {
            const res = await fetch(`${API}/security/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Auth failed');
            const data = await res.json();

            if (profUsername) profUsername.innerText = data.username || username;
            if (avatarInitials) avatarInitials.innerText = (data.username || username).charAt(0).toUpperCase();

            const emailEl = document.getElementById('prof-email');
            if (emailEl) emailEl.innerText = data.email || '—';

        } catch (err) {
            console.error('Failed to load user info:', err);
        }
    }

    loadUserInfo();

    /* --- SETTINGS FORM --- */
    const profileForm = document.getElementById('profileForm');
    const saveStatus = document.getElementById('saveStatus');
    const usernameInput = document.getElementById('usernameInput');
    const gpuInput = document.getElementById('gpuInput');
    const cpuInput = document.getElementById('cpuInput');

    if (usernameInput) usernameInput.placeholder = username;
    if (gpuInput) gpuInput.placeholder = gpu !== '—' ? gpu : 'e.g. RTX 3060 Ti';
    if (cpuInput) cpuInput.placeholder = cpu !== '—' ? cpu : 'e.g. Intel Core i7';

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newName = usernameInput?.value.trim();
            const newGpu = gpuInput?.value.trim();
            const newCpu = cpuInput?.value.trim();

            if (newName) {
                localStorage.setItem('gh_username', newName);
                if (profUsername) profUsername.innerText = newName;
                if (avatarInitials) avatarInitials.innerText = newName.charAt(0).toUpperCase();
                if (displayUsername) displayUsername.innerText = newName;
            }
            if (newGpu) {
                localStorage.setItem('userGPU', newGpu);
                if (badgeGpu) badgeGpu.innerText = `GPU: ${newGpu}`;
            }
            if (newCpu) {
                localStorage.setItem('userCPU', newCpu);
                if (badgeCpu) badgeCpu.innerText = `CPU: ${newCpu}`;
            }

            if (saveStatus) {
                saveStatus.innerText = "✅ Changes saved successfully!";
                saveStatus.style.color = "#10b981";
                setTimeout(() => { saveStatus.innerText = ''; }, 3000);
            }

            profileForm.reset();
        });
    }


});