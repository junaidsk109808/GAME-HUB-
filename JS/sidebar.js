document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    const mainContent = document.querySelector('.main-content');

    const isMobile = () => window.innerWidth <= 1024;

    /* =========================================
       BACKDROP — declared FIRST so open/close
       helpers can reference it safely
       ========================================= */
    const backdrop = document.createElement('div');
    backdrop.id = 'sidebarBackdrop';
    backdrop.style.cssText = `
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,0.6); z-index: 99998;
        backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
        cursor: pointer;
    `;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', closeSidebar);

    /* =========================================
       OPEN / CLOSE HELPERS
       ========================================= */
    function openSidebar() {
        if (!sidebar) return;
        sidebar.style.transform = 'translateX(0)';
        sidebar.classList.add('open');
        backdrop.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (!sidebar) return;
        sidebar.style.transform = 'translateX(-100%)';
        sidebar.classList.remove('open');
        backdrop.style.display = 'none';
        document.body.style.overflow = '';
    }

    /* =========================================
       1. INITIAL STATE
       — Desktop: always start COLLAPSED on page load
       — Mobile: always start hidden (off-screen)
       ========================================= */
    if (sidebar) {
        if (isMobile()) {
            sidebar.classList.remove('collapsed');
            sidebar.style.transform = 'translateX(-100%)';
        } else {
            sidebar.style.transform = '';
            sidebar.classList.add('collapsed');
            localStorage.setItem('sidebarCollapsed', 'true');
        }
    }

    if (mainContent) {
        if (isMobile()) {
            mainContent.style.cssText = 'margin-left:0!important;width:100%!important;max-width:100%!important;';
        } else {
            mainContent.style.transition = 'none';
            mainContent.style.marginLeft = '60px';
            mainContent.style.width = 'calc(100% - 60px)';
            mainContent.style.maxWidth = 'calc(100% - 60px)';
            requestAnimationFrame(() => requestAnimationFrame(() => {
                mainContent.style.transition = 'margin-left 0.4s cubic-bezier(0.4,0,0.2,1), width 0.4s cubic-bezier(0.4,0,0.2,1)';
            }));
        }
    }

    /* =========================================
       2. INJECT ☰ INTO .main-header
       ========================================= */
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader && !document.getElementById('headerMenuBtn')) {
        const menuBtn = document.createElement('button');
        menuBtn.id = 'headerMenuBtn';
        menuBtn.setAttribute('aria-label', 'Open menu');
        menuBtn.style.cssText = `
            background: none; border: none; color: #fff;
            font-size: 1.5rem; cursor: pointer; padding: 4px 8px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; line-height: 1;
        `;
        menuBtn.innerHTML = '☰';
        mainHeader.prepend(menuBtn);

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar && sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
        });
    }

    /* =========================================
       3. SIDEBAR'S OWN ☰ TOGGLE
       ========================================= */
    if (toggleBtn && sidebar && mainContent) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMobile()) {
                sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
            } else {
                sidebar.style.transform = '';
                sidebar.classList.toggle('collapsed');
                const collapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', collapsed);
                const ml = collapsed ? '60px' : '280px';
                const w  = collapsed ? 'calc(100% - 60px)' : 'calc(100% - 280px)';
                mainContent.style.marginLeft = ml;
                mainContent.style.width = w;
                mainContent.style.maxWidth = w;
            }
        });
    }

    /* =========================================
       4. CLOSE ON NAV LINK CLICK
       ========================================= */
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
            if (isMobile()) {
                closeSidebar();
            } else {
                sidebar.classList.add('collapsed');
                localStorage.setItem('sidebarCollapsed', 'true');
                mainContent.style.marginLeft = '60px';
                mainContent.style.width = 'calc(100% - 60px)';
                mainContent.style.maxWidth = 'calc(100% - 60px)';
            }
        });
    });

    /* =========================================
       5. ESC KEY TO CLOSE
       ========================================= */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) closeSidebar();
    });

    /* =========================================
       6. RESIZE HANDLER
       ========================================= */
    window.addEventListener('resize', () => {
        if (!sidebar || !mainContent) return;

        if (isMobile()) {
            closeSidebar();
            sidebar.classList.remove('collapsed');
            sidebar.style.transform = 'translateX(-100%)';
            mainContent.style.cssText = 'margin-left:0!important;width:100%!important;max-width:100%!important;';
        } else {
            backdrop.style.display = 'none';
            document.body.style.overflow = '';
            sidebar.classList.remove('open');
            sidebar.style.transform = '';
            sidebar.classList.add('collapsed');
            mainContent.style.cssText = 'margin-left:60px;width:calc(100% - 60px);max-width:calc(100% - 60px);';
        }
    });

    /* =========================================
       7. USERNAME
       ========================================= */
    const displayUsername = document.getElementById('display-username');
    if (displayUsername) {
        displayUsername.innerText = localStorage.getItem('gh_username') || "PlayerOne";
    }

    /* =========================================
       8. LOGIN / LOGOUT
       ========================================= */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            logoutBtn.innerHTML = `<span>Logout</span>`;
            logoutBtn.onclick = () => { localStorage.clear(); window.location.reload(); };
        } else {
            logoutBtn.innerHTML = `<span>Sign In / Login</span>`;
            logoutBtn.onclick = () => { window.location.href = "login.html"; };
        }
    }
});