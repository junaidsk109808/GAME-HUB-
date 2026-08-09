document.addEventListener("DOMContentLoaded", async () => {

    const API = "https://game-backend-kgbl.onrender.com";

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    const descEl = document.getElementById('game-description');

    /* FIX: if no id in URL, go back to previous page instead of 404 */
    if (!gameId) {
        console.error("No game ID in URL");
        window.location.href = '404.html';
        return;
    }

    console.log("Loading game ID:", gameId);

    try {
        const response = await fetch(`${API}/game/${gameId}`);

        /* FIX: log the actual status instead of blindly redirecting */
        if (!response.ok) {
            console.error("API returned:", response.status, "for game ID:", gameId);
            window.location.href = '404.html';
            return;
        }

        const game = await response.json();
        console.log("API Result:", game);

        /* --- TITLE & BANNER --- */
        document.getElementById('gameTitle').innerText = game.title || "Unknown Game";

        if (game.cover_image) {
            document.getElementById('gameHero').style.backgroundImage =
                `linear-gradient(to bottom, rgba(0,0,0,0.4), #020617), url('${game.cover_image}')`;
        }

        /* --- DESCRIPTION --- */
        if (descEl) {
            descEl.innerHTML = game.description || "No description found.";
        }

        /* --- RATING --- */
        document.getElementById('game-rating').innerText = `★ ${game.rating || '--'}`;
        document.getElementById('rating-count').innerText = game.rating_count || "N/A";

        /* --- DEVELOPER --- */
        const devEl = document.getElementById('game-dev');
        if (devEl) {
            const devs = game.developers;
            devEl.innerText = Array.isArray(devs) && devs.length > 0 ? devs.join(', ') : "N/A";
        }

        /* --- RELEASE DATE --- */
        const releaseEl = document.getElementById('game-release');
        if (releaseEl && game.released) {
            const date = new Date(game.released);
            releaseEl.innerText = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        /* --- REQUIREMENTS --- */
        const reqTable = document.getElementById('reqTable');
        if (reqTable) {
            const req = game.requirements;
            const hasData = req?.min_cpu || req?.min_gpu || req?.min_ram_gb;
            if (hasData) {
                reqTable.innerHTML = `
                    <tr><th>Spec</th><th>Minimum</th><th>Recommended</th></tr>
                    <tr><td>OS</td><td>${req?.min_os || 'N/A'}</td><td>${req?.recommended_os || 'N/A'}</td></tr>
                    <tr><td>CPU</td><td>${req?.min_cpu || 'N/A'}</td><td>${req?.recommended_cpu || 'N/A'}</td></tr>
                    <tr><td>GPU</td><td>${req?.min_gpu || 'N/A'}</td><td>${req?.recommended_gpu || 'N/A'}</td></tr>
                    <tr><td>RAM</td><td>${req?.min_ram_gb ? req.min_ram_gb + ' GB' : 'N/A'}</td><td>${req?.recommended_ram_gb ? req.recommended_ram_gb + ' GB' : 'N/A'}</td></tr>
                    <tr><td>Storage</td><td>${req?.min_storage_gb ? req.min_storage_gb + ' GB' : 'N/A'}</td><td>${req?.recommended_storage_gb ? req.recommended_storage_gb + ' GB' : 'N/A'}</td></tr>
                `;
            } else {
                reqTable.closest('section').style.display = 'none';
            }
        }

        /* --- MEDIA GALLERY --- */
        const mediaSection = document.getElementById('mediaSection');
        const mediaStrip = document.getElementById('mediaStrip');
        const gameplayIds = game.media?.gameplay_ids || [];
        const gameplayChannels = game.media?.gameplay_channels || [];

        if (mediaStrip && gameplayIds.length > 0) {
            mediaSection.style.display = 'block';
            mediaStrip.innerHTML = '';

            gameplayIds.slice(0, 5).forEach((vidId, i) => {
                const channelName = gameplayChannels[i] || 'Gameplay';
                const thumb = document.createElement('div');
                thumb.className = 'media-thumb';
                thumb.innerHTML = `
                    <img src="https://img.youtube.com/vi/${vidId}/hqdefault.jpg"
                         alt="${channelName}"
                         onerror="this.src='${game.cover_image}'">
                    <div class="play-overlay">▶</div>
                `;
                thumb.onclick = () => openModal('video', `https://www.youtube.com/watch?v=${vidId}`);
                mediaStrip.appendChild(thumb);
            });
        }

        /* --- TAGS --- */
        const tagsCard = document.getElementById('tagsCard');
        const tagsList = document.getElementById('tagsList');
        const tags = game.tags || game.genres || [];

        if (tagsList && Array.isArray(tags) && tags.length > 0) {
            tagsCard.style.display = 'block';
            tagsList.innerHTML = tags.slice(0, 15).map(tag => {
                const name = typeof tag === 'string' ? tag : tag.name || tag;
                return `<span class="tag-pill">${name}</span>`;
            }).join('');
        }

        /* --- GAMEPLAY LINKS --- */
        const gameplayCard = document.getElementById('gameplayCard');
        const gameplayLinksEl = document.getElementById('gameplayLinks');
        const gpIds = game.media?.gameplay_ids || [];
        const gpChannels = game.media?.gameplay_channels || [];

        if (gameplayLinksEl && gpIds.length > 0) {
            gameplayCard.style.display = 'block';
            gameplayLinksEl.innerHTML = gpIds.slice(0, 5).map((id, i) => {
                const label = gpChannels[i] || `Video ${i + 1}`;
                return `
                    <a href="https://www.youtube.com/watch?v=${id}"
                       target="_blank" class="gameplay-link">
                        <span class="yt-icon">▶</span> ${label}
                    </a>
                `;
            }).join('');
        }

        /* --- RELATED GAMES --- */
        const relatedSection = document.getElementById('relatedSection');
        const relatedGrid = document.getElementById('relatedGames');

        if (relatedGrid && game.related_games && game.related_games.length > 0) {
            relatedSection.style.display = 'block';
            relatedGrid.innerHTML = game.related_games.slice(0, 10).map(g => {
                /* FIX: use g.rawg_id || g.id for related games too */
                const relId = g.rawg_id || g.id;
                return `
                    <a href="game_details.html?id=${relId}" class="related-card">
                        <img src="${g.cover_image || ''}" alt="${g.title}"
                             onerror="this.style.background='rgba(30,41,59,0.5)'">
                        <div class="related-card-info">
                            <h4>${g.title || 'Unknown'}</h4>
                            <p>★ ${g.rating || '--'}</p>
                        </div>
                    </a>
                `;
            }).join('');
        }

        /* --- REVIEW VIDEOS --- */
        const reviewsList = document.getElementById('reviewsList');
        const reviewIds = game.media?.review_ids || [];
        let reviewChannels = game.media?.review_channels || [];

        if (typeof reviewChannels === 'string') {
            try { reviewChannels = JSON.parse(reviewChannels); } catch { reviewChannels = []; }
        }

        if (reviewsList) {
            if (reviewIds.length > 0) {
                reviewsList.innerHTML = reviewIds.slice(0, 6).map((id, i) => {
                    const channel = reviewChannels[i] || `Review ${i + 1}`;
                    return `
                        <div class="review-video-card" onclick="openModal('video', 'https://www.youtube.com/watch?v=${id}')">
                            <div class="review-video-thumb">
                                <img src="https://img.youtube.com/vi/${id}/hqdefault.jpg"
                                     alt="${channel}"
                                     onerror="this.src='${game.cover_image}'">
                                <div class="review-play-btn">▶</div>
                            </div>
                            <div class="review-video-info">
                                <h5>${channel}</h5>
                                <span>Video Review</span>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                reviewsList.innerHTML = `<p style="color: #64748b;">No review videos yet.</p>`;
            }
        }

    } catch (err) {
        console.error("Fetch failed:", err);
        if (descEl) descEl.innerHTML = `<span style="color:#64748b;">Failed to load game data.</span>`;
    }
});

/* --- MODAL HELPERS --- */
function openModal(type, src) {
    const modal = document.getElementById('mediaModal');
    const content = document.getElementById('modalContent');
    modal.style.display = 'flex';

    if (type === 'image') {
        content.innerHTML = `<img src="${src}" alt="media">`;
    } else {
        const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        const ytId = ytMatch ? ytMatch[1] : '';
        const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}?autoplay=1` : src;
        content.innerHTML = `<iframe src="${embedUrl}" allowfullscreen allow="autoplay"></iframe>`;
    }

    document.addEventListener('keydown', handleEsc);
}

function closeModal() {
    const modal = document.getElementById('mediaModal');
    const content = document.getElementById('modalContent');
    modal.style.display = 'none';
    content.innerHTML = '';
    document.removeEventListener('keydown', handleEsc);
}

function handleEsc(e) {
    if (e.key === 'Escape') closeModal();
}