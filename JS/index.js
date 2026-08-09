document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://game-backend-kgbl.onrender.com";

    /* =========================================
       1. SEARCH — Mobile & Desktop Logic
       ========================================= */
    const searchInput = document.querySelector('.search-input');
    const searchContainer = document.querySelector('.search-container');
    const searchBtn = document.querySelector('.search-btn');

    const recBox = document.createElement('div');
    recBox.className = 'search-recommendations';
    recBox.style.cssText = `
        position: absolute; top: calc(100% + 8px); left: 0; width: 100%;
        background: #1e293b; border-radius: 12px;
        z-index: 9999; display: none; overflow: visible;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    `;

    if (searchContainer) {
        searchContainer.appendChild(recBox);
    }

    if (searchBtn && searchContainer && searchInput) {
        ['click', 'touchstart'].forEach(eventType => {
            searchBtn.addEventListener(eventType, (e) => {
                e.preventDefault(); 
                e.stopPropagation(); 
                
                // iPad & Mobile (1024px or less)
                if (window.innerWidth <= 1024) {
                    const isOpen = searchContainer.classList.toggle('active');
                    if (isOpen) {
                        setTimeout(() => searchInput.focus(), 350);
                    } else {
                        recBox.style.display = 'none';
                        searchInput.value = ''; 
                        searchInput.blur();
                    }
                } 
                // COMPUTER LOGIC
                else {
                    // Clear text if clicked while text exists
                    if (searchInput.value.trim() !== '') {
                        searchInput.value = '';
                        recBox.style.display = 'none';
                    }
                    searchInput.focus(); 
                }
            }, { passive: false });
        });
    }

    // Close and clear the search bar if they tap anywhere else
    document.addEventListener('click', (e) => {
        if (searchContainer && !searchContainer.contains(e.target)) {
            recBox.style.display = 'none'; 
            
            if (window.innerWidth <= 1024 && searchContainer.classList.contains('active')) {
                searchContainer.classList.remove('active');
            }
            
            // Clear text on all devices when clicking away
            if (searchInput) {
                searchInput.value = ''; 
            }
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024 && searchContainer) {
            searchContainer.classList.remove('active');
        }
    });

    // API Search Input Listener
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            if (query.length < 2) { recBox.style.display = 'none'; return; }
            try {
                const res = await fetch(`${API_URL}/search?q=${query}`);
                const games = await res.json();
                if (games.length > 0) {
                    recBox.innerHTML = games.slice(0, 5).map(g => `
                        <div class="rec-item" style="padding:10px;display:flex;align-items:center;gap:10px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);"
                             onclick="window.location.href='game_details.html?id=${g.rawg_id}'">
                            <img src="${g.image_url}" alt="${g.title}" style="width:35px;height:35px;border-radius:4px;object-fit:cover;">
                            <span style="font-size:0.9rem;color:#fff;">${g.title}</span>
                        </div>`).join('');
                    recBox.style.display = 'block';
                } else {
                    recBox.style.display = 'none';
                }
            } catch (err) { console.error("Search Error:", err); }
        });
    }

    // Back Button/Cache Refresh Logic
    window.addEventListener('pageshow', (event) => {
        if (searchInput) {
            searchInput.value = ''; 
            searchInput.blur();
        }
        if (recBox) {
            recBox.style.display = 'none'; 
        }
        if (searchContainer && window.innerWidth <= 1024) {
            searchContainer.classList.remove('active');
        }
    });

    /* =========================================
       2. GAME CARD BUILDER
       ========================================= */
    function buildGameCard(game) {
        const card = document.createElement('a');
        card.href = `game_details.html?id=${game.id}`;
        card.className = 'game-card-link';
        card.innerHTML = `
            <div class="small-game-box" style="background-image:url('${game.cover_image}');"></div>
            <div class="game-card-info">
                <h4 class="game-card-title">${game.title}</h4>
                <span class="game-card-rating">⭐ ${game.rating || 'N/A'}</span>
            </div>`;
        return card;
    }

    function showError(gridEl) {
        gridEl.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;color:#64748b;padding:40px 0;">
                Unable to load games right now.
            </div>`;
    }

    /* =========================================
       3. LOAD HOME DATA
       ========================================= */
    async function loadHomePageData() {
        const topGrid = document.getElementById('topGamesGrid');
        const newGrid = document.getElementById('newGamesGrid');
        const track   = document.getElementById('carouselTrack');

        try {
            const response = await fetch(`${API_URL}/home`);
            if (!response.ok) throw new Error('API error');
            const data = await response.json();

            // A. Trending Carousel
            if (track && data.trending && data.trending.length > 0) {
                track.innerHTML = '';
                const trendingGames = data.trending.slice(0, 5);
                trendingGames.forEach((game) => {
                    const slide = document.createElement('div');
                    slide.className = 'slide-item';
                    slide.style.cssText = `
                        background-image: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.1) 60%, transparent 100%), url('${game.cover_image}');
                        background-size: cover; background-position: center;
                    `;
                    slide.innerHTML = `
                        <a href="game_details.html?id=${game.id}" style="text-decoration:none;display:flex;width:100%;height:100%;align-items:flex-end;padding:40px;box-sizing:border-box;">
                            <div>
                                <span style="color:#6366f1;font-size:0.8rem;font-weight:800;text-transform:uppercase;letter-spacing:2px;display:block;margin-bottom:8px;">Trending Now</span>
                                <h2 style="color:#fff;font-size:2.2rem;margin:0;font-weight:900;">${game.title}</h2>
                                <span style="color:#a855f7;font-weight:700;font-size:1rem;margin-top:6px;display:block;">⭐ ${game.rating || 'N/A'}</span>
                            </div>
                        </a>`;
                    track.appendChild(slide);
                });
                setupCarouselLogic(trendingGames.length);
            }

            // B. Top Rated
            if (topGrid && data.top_rated) {
                topGrid.innerHTML = '';
                const topGames = data.top_rated.slice(0, 8);
                topGames.length > 0
                    ? topGames.forEach(g => topGrid.appendChild(buildGameCard(g)))
                    : showError(topGrid);
            }

            // C. New Games
            if (newGrid && data.random) {
                newGrid.innerHTML = '';
                const newGames = data.random.slice(0, 8);
                newGames.length > 0
                    ? newGames.forEach(g => newGrid.appendChild(buildGameCard(g)))
                    : showError(newGrid);
            }

        } catch (error) {
            console.error("Load Error:", error);
            // window.location.href = '404.html';
        }
    }

    /* =========================================
       4. CAROUSEL — Logic
       ========================================= */
    function setupCarouselLogic(slideCount) {
        const track = document.getElementById('carouselTrack');
        const container = document.querySelector('.carousel-container');
        if (!track) return;

        let currentSlide = 0;
        let autoTimer;

        const goTo = (index) => {
            currentSlide = (index + slideCount) % slideCount;
            track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
        };

        const startAuto = () => {
            clearInterval(autoTimer);
            autoTimer = setInterval(() => goTo(currentSlide + 1), 4000);
        };

        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        if (nextBtn) nextBtn.onclick = () => { goTo(currentSlide + 1); startAuto(); };
        if (prevBtn) prevBtn.onclick = () => { goTo(currentSlide - 1); startAuto(); };

        if (container) {
            let touchStartX = 0;
            let isDragging = false;

            container.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                isDragging = true;
                clearInterval(autoTimer);
                track.style.transition = 'none';
            }, { passive: true });

            container.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const diff = e.touches[0].clientX - touchStartX;
                const base = -currentSlide * 100;
                track.style.transform = `translateX(calc(${base}% + ${diff}px))`;
            }, { passive: true });

            container.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchEndX - touchStartX;
                const threshold = container.offsetWidth * 0.2;

                if (diff < -threshold) { goTo(currentSlide + 1); } 
                else if (diff > threshold) { goTo(currentSlide - 1); } 
                else { goTo(currentSlide); }
                startAuto();
            }, { passive: true });
        }

        startAuto();
    }

    loadHomePageData();
});