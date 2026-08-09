document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "https://game-backend-kgbl.onrender.com";

    const params    = new URLSearchParams(window.location.search);
    const genre     = params.get("genre");
    const container = document.getElementById("games-container");

    /* Title elements — mobile and desktop */
    const mobileTitleEl  = document.getElementById('genre-title');
    const desktopTitleEl = document.getElementById('genre-title-desktop');

    let currentPage = 1;
    const limit = 12;

    /* If no genre param, show all-games fallback */
    if (!genre) {
        if (mobileTitleEl)  mobileTitleEl.innerHTML  = `Browse <span>Games</span>`;
        if (desktopTitleEl) desktopTitleEl.innerHTML = `Browse <span>Games</span>`;
        container.innerHTML = `<p style="color:#64748b;grid-column:1/-1;text-align:center;padding:60px 0;">No genre selected. <a href="genres.html" style="color:#6366f1;">Go back to Genres</a></p>`;
        return;
    }

    /* Set page titles */
    const titleHTML = `${decodeURIComponent(genre)} <span>Games</span>`;
    if (mobileTitleEl)  mobileTitleEl.innerHTML  = titleHTML;
    if (desktopTitleEl) desktopTitleEl.innerHTML = titleHTML;
    document.title = `GameHub | ${decodeURIComponent(genre)} Games`;

    /* =========================================
       LOAD GAMES
       ========================================= */
    async function loadGames(page) {
        /* Skeleton while loading */
        container.innerHTML = Array(12).fill(`
            <div class="skeleton-card">
                <div class="small-game-box"></div>
                <div class="game-card-info">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-rating"></div>
                </div>
            </div>
        `).join('');

        try {
            const res = await fetch(`${API_URL}/genre/${encodeURIComponent(genre)}?page=${page}&limit=${limit}`);
            if (!res.ok) throw new Error(`API ${res.status}`);

            const data       = await res.json();
            const games      = data.results || [];
            const total      = data.total_results || 0;
            const totalPages = Math.ceil(total / limit);

            if (games.length === 0) {
                container.innerHTML = `<p style="color:#64748b;grid-column:1/-1;text-align:center;padding:60px 0;">No games found for "${genre}".</p>`;
                return;
            }

            container.innerHTML = games.map(g => {
                const gameId = g.rawg_id || g.id;
                if (!gameId) return '';
                return `
                    <a class="game-card" href="game_details.html?id=${gameId}">
                        <div class="small-game-box" style="background-image:url('${g.cover_image || ''}');"></div>
                        <div class="game-card-info">
                            <h4 class="game-card-title">${g.title || 'Unknown'}</h4>
                            <span class="game-card-rating">⭐ ${g.rating || 'N/A'}</span>
                        </div>
                    </a>
                `;
            }).join('');

            renderPagination(page, totalPages);

        } catch (err) {
            console.error('Load error:', err);
            container.innerHTML = `<p style="color:#64748b;grid-column:1/-1;text-align:center;padding:60px 0;">Failed to load games. Please try again.</p>`;
        }
    }

    /* =========================================
       PAGINATION
       ========================================= */
    function renderPagination(page, totalPages) {
        let paginationEl = document.getElementById('pagination');
        if (!paginationEl) {
            paginationEl = document.createElement('div');
            paginationEl.id = 'pagination';
            paginationEl.style.cssText = `
                display:flex; justify-content:center; align-items:center;
                gap:12px; padding:40px 0; flex-wrap:wrap;
            `;
            container.parentElement.appendChild(paginationEl);
        }

        if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

        let html = '';
        if (page > 1) html += `<button class="page-btn" onclick="goToPage(${page - 1})">← Prev</button>`;

        for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
            html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }

        if (page < totalPages) html += `<button class="page-btn" onclick="goToPage(${page + 1})">Next →</button>`;
        html += `<span style="color:#64748b;font-size:0.85rem;">Page ${page} of ${totalPages}</span>`;

        paginationEl.innerHTML = html;
    }

    window.goToPage = (page) => {
        currentPage = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadGames(page);
    };

    /* =========================================
       MOBILE MENU BUTTON (games.html has #menuBtn)
       ========================================= */
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
    }

    loadGames(currentPage);
});