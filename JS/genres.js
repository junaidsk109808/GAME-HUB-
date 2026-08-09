document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://game-backend-kgbl.onrender.com";

    const GENRES = [
        { name: "Action",      icon: "⚔️",  color: "#ef4444" },
        { name: "RPG",         icon: "🧙",  color: "#a855f7" },
        { name: "Strategy",    icon: "♟️",  color: "#6366f1" },
        { name: "Horror",      icon: "👻",  color: "#1e293b" },
        { name: "Sports",      icon: "⚽",  color: "#10b981" },
        { name: "Adventure",   icon: "🗺️",  color: "#f59e0b" },
        { name: "Shooter",     icon: "🔫",  color: "#3b82f6" },
        { name: "Puzzle",      icon: "🧩",  color: "#8b5cf6" },
        { name: "Racing",      icon: "🏎️",  color: "#f97316" },
        { name: "Simulation",  icon: "🏙️",  color: "#14b8a6" },
        { name: "Fighting",    icon: "🥊",  color: "#dc2626" },
        { name: "Platformer",  icon: "🎮",  color: "#7c3aed" },
    ];

    const genreGrid   = document.getElementById('genreGrid');
    const searchInput = document.getElementById('genreSearch');

    /* --- RENDER GENRE CARDS --- */
    function renderGenres(filter = '') {
        const filtered = GENRES.filter(g =>
            g.name.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            genreGrid.innerHTML = `<p style="color:#64748b; grid-column:1/-1; padding:40px 0;">No genres found.</p>`;
            return;
        }

        genreGrid.innerHTML = filtered.map(g => `
            <div class="genre-card" data-genre="${g.name}" style="--genre-color: ${g.color};">
                <div class="genre-bg-icon">${g.icon}</div>
                <div class="genre-content">
                    <span class="genre-count" id="count-${g.name}">Loading...</span>
                    <h3>${g.name}</h3>
                    <div class="explore-hint">View Library →</div>
                </div>
            </div>
        `).join('');

        /* FIX: redirect to games.html (the separate game list page) */
        document.querySelectorAll('.genre-card').forEach(card => {
            card.addEventListener('click', () => {
                const genre = card.getAttribute('data-genre');
                window.location.href = `games.html?genre=${encodeURIComponent(genre)}`;
            });
        });

        filtered.forEach(g => loadGenreCount(g.name));
    }

    /* --- LOAD GAME COUNT --- */
    async function loadGenreCount(genre) {
        try {
            const res = await fetch(`${API_URL}/genre/${encodeURIComponent(genre)}?page=1&limit=1`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const countEl = document.getElementById(`count-${genre}`);
            if (countEl) countEl.innerText = `${data.total_results || 0} Games`;
        } catch {
            const countEl = document.getElementById(`count-${genre}`);
            if (countEl) countEl.innerText = 'Games';
        }
    }

    /* --- SEARCH FILTER --- */
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderGenres(e.target.value));
    }

    /* --- MOBILE SEARCH TOGGLE --- */
    const searchBtn       = document.querySelector('.search-btn');
    const searchContainer = document.querySelector('.search-container');

    if (searchBtn && searchContainer) {
        searchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchContainer.classList.toggle('active');
            if (searchContainer.classList.contains('active')) {
                searchInput?.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                searchContainer.classList.remove('active');
                if (searchInput && searchInput.value !== '') {
                    searchInput.value = '';
                    renderGenres('');
                }
            }
        });
    }

    /* --- REFRESH ON BACK NAVIGATION --- */
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            if (searchInput) searchInput.value = '';
            renderGenres('');
        }
    });

    renderGenres();
});