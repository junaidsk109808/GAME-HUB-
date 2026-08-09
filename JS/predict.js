document.addEventListener("DOMContentLoaded", () => {

    const API = "https://game-backend-kgbl.onrender.com";

    // Clear results on refresh but keep on back navigation
    if (!sessionStorage.getItem('comingBack')) {
        sessionStorage.removeItem('predictResults');
    }
    sessionStorage.removeItem('comingBack');

    /* --- CHECK API ON LOAD --- */
    async function checkAPI() {
        try {
            const res = await fetch(`${API}/home`);
            if (!res.ok) throw new Error('API error');
        } catch (err) {
            window.location.href = '404.html';
        }
    }
    checkAPI();

    /* --- 1. FORM AUTO-FILL — only restore if coming back from game page --- */
    if (sessionStorage.getItem('comingBack')) {
        const savedGPU = localStorage.getItem('userGPU') || "";
        const savedCPU = localStorage.getItem('userCPU') || "";
        const savedRAM = localStorage.getItem('userRAM') || "";

        if (document.getElementById('gpu')) document.getElementById('gpu').value = savedGPU;
        if (document.getElementById('cpu')) document.getElementById('cpu').value = savedCPU;
        if (document.getElementById('ram')) document.getElementById('ram').value = savedRAM;
    }

    /* --- 2. AUTOCOMPLETE --- */
    function setupAutocomplete(inputId, endpoint, fieldName) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const wrapper = input.closest('.input-group');
        if (!wrapper) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        dropdown.style.display = 'none';
        wrapper.style.position = 'relative';
        wrapper.appendChild(dropdown);

        input.addEventListener('input', async () => {
            const query = input.value.trim();
            dropdown.innerHTML = '';
            dropdown.style.display = 'none';
            if (query.length < 2) return;

            try {
                const res = await fetch(`${API}${endpoint}?q=${encodeURIComponent(query)}`);
                const data = await res.json();

                if (data.length === 0) return;

                dropdown.innerHTML = data.slice(0, 5).map(item => {
                    const text = item[fieldName] || item;
                    return `<div class="autocomplete-item">${text}</div>`;
                }).join('');
                dropdown.style.display = 'block';

                dropdown.querySelectorAll('.autocomplete-item').forEach((item, i) => {
                    item.addEventListener('click', () => {
                        input.value = data[i][fieldName] || data[i];
                        dropdown.innerHTML = '';
                        dropdown.style.display = 'none';
                    });
                });

            } catch (err) {
                console.error('Autocomplete error:', err);
            }
        });

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            }
        });
    }

    setupAutocomplete('cpu', '/search/cpu', 'cpu_name');
    setupAutocomplete('gpu', '/search/gpu', 'gpu_name');

    /* --- RESTORE SAVED RESULTS --- */
    const savedResults = sessionStorage.getItem('predictResults');
    if (savedResults) {
        const { searchedHTML, relatedHTML, runnableHTML, resultHTML, dynamicVisible } = JSON.parse(savedResults);

        const searchedResult     = document.getElementById('searchedResult');
        const relatedGamesGrid   = document.getElementById('relatedGamesGrid');
        const runnableGamesGrid  = document.getElementById('runnableGamesGrid');
        const dynamicResults     = document.getElementById('dynamicResults');
        const resultArea         = document.getElementById('resultArea');
        const resultText         = document.getElementById('resultText');

        if (searchedResult)    searchedResult.innerHTML    = searchedHTML || '';
        if (relatedGamesGrid)  relatedGamesGrid.innerHTML  = relatedHTML  || '';
        if (runnableGamesGrid) runnableGamesGrid.innerHTML = runnableHTML || '';
        if (resultText)        resultText.innerHTML        = resultHTML   || '';
        if (dynamicVisible && dynamicResults) dynamicResults.classList.remove('hidden');
        if (resultHTML && resultArea)         resultArea.classList.remove('hidden');

        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                sessionStorage.setItem('comingBack', 'true');
            });
        });
    }

    /* --- 3. PREDICT LOGIC --- */
    const configForm = document.getElementById('configForm');
    const resultArea = document.getElementById('resultArea');
    const resultText = document.getElementById('resultText');

    if (configForm) {
        configForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const cpu  = document.getElementById('cpu').value.trim();
            const gpu  = document.getElementById('gpu').value.trim();
            const ram  = document.getElementById('ram').value.trim();
            const game = document.getElementById('game').value.trim();
            const btn  = configForm.querySelector('.predict-btn');

            localStorage.setItem('userGPU', gpu);
            localStorage.setItem('userCPU', cpu);
            localStorage.setItem('userRAM', ram);

            btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing Rig...`;
            btn.style.pointerEvents = "none";

            if (resultArea) resultArea.classList.add('hidden');

            const searchedResult    = document.getElementById('searchedResult');
            const relatedGamesGrid  = document.getElementById('relatedGamesGrid');
            const runnableGamesGrid = document.getElementById('runnableGamesGrid');
            const dynamicResults    = document.getElementById('dynamicResults');

            if (searchedResult)    searchedResult.innerHTML    = buildSkeleton(1);
            if (relatedGamesGrid)  relatedGamesGrid.innerHTML  = buildSkeleton(8);
            if (runnableGamesGrid) runnableGamesGrid.innerHTML = buildSkeleton(8);
            if (dynamicResults)    dynamicResults.classList.remove('hidden');

            try {
                const ramNum = parseFloat(ram.replace(/[^0-9.]/g, '')) || 8;

                const recommendRes = await fetch(`${API}/recommend/recommend`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cpu_name: cpu, gpu_name: gpu, ram: ramNum, page: 1 })
                });
                if (!recommendRes.ok) throw new Error('Score API error');
                const recommendData = await recommendRes.json();
                const runnableGames = recommendData.games || [];

                const searchRes = await fetch(`${API}/search?q=${encodeURIComponent(game)}`);
                if (!searchRes.ok) throw new Error('Search API error');
                const searchResults = await searchRes.json();
                const foundGame = searchResults[0] || null;

                let relatedGames = [];
                if (foundGame) {
                    const gameRes = await fetch(`${API}/game/${foundGame.rawg_id}`);
                    if (gameRes.ok) {
                        const gameData = await gameRes.json();
                        relatedGames = gameData.related_games || [];
                    }
                }

                btn.innerHTML = `Analyze Performance`;
                btn.style.pointerEvents = "auto";

                const canRunSearched = foundGame
                    ? runnableGames.some(g => g.rawg_id === foundGame.rawg_id || g.id === foundGame.rawg_id)
                    : false;

                /* --- RESULT BOX --- */
                let resultHTML = '';
                if (resultArea) {
                    resultArea.classList.remove('hidden');
                    if (canRunSearched) {
                        resultHTML = `
                            <p>✅ Your <span style="color:#a855f7;font-weight:bold;">${gpu}</span>
                            can run <strong>${game}</strong>.</p>
                            <p style="margin-top:10px;color:#10b981;font-weight:bold;">
                                Your system meets the requirements for this game.
                            </p>`;
                    } else if (!foundGame) {
                        resultHTML = `<p style="color:#64748b;">Game not found. Try a different name.</p>`;
                    } else {
                        resultHTML = `
                            <p>❌ Your <span style="color:#a855f7;font-weight:bold;">${gpu}</span>
                            may struggle to run <strong>${game}</strong>.</p>
                            <p style="margin-top:10px;color:#ef4444;font-weight:bold;">
                                Your system does not meet the minimum requirements.
                            </p>`;
                    }
                    resultText.innerHTML = resultHTML;
                }

                /* --- SEARCHED GAME --- */
                let searchedHTML = '';
                if (searchedResult) {
                    if (foundGame) {
                        searchedHTML = `
                            <a class="game-card" href="game_details.html?id=${foundGame.rawg_id}" onclick="sessionStorage.setItem('comingBack','true')">
                                <div class="small-game-box" style="background-image:url('${foundGame.image_url || ''}');"></div>
                                <div class="game-card-info">
                                    <h4 class="game-card-title">${foundGame.title || 'Unknown'}</h4>
                                    <span class="game-card-rating">⭐ ${foundGame.rating || 'N/A'}</span>
                                    <span class="compat-badge ${canRunSearched ? 'can-run' : 'cannot-run'}">${canRunSearched ? '✅ Can Run' : '❌ Cannot Run'}</span>
                                </div>
                            </a>`;
                    } else {
                        searchedHTML = `<p style="color:#64748b;">Game not found. Try a different name.</p>`;
                    }
                    searchedResult.innerHTML = searchedHTML;
                }

                /* --- RELATED GAMES --- */
                let relatedHTML = '';
                if (relatedGamesGrid) {
                    if (relatedGames.length > 0) {
                        relatedHTML = relatedGames.slice(0, 8).map(g => {
                            const canRun = runnableGames.some(r => r.rawg_id === g.id || r.id === g.id || r.rawg_id === g.rawg_id);
                            return `
                                <a class="game-card" href="game_details.html?id=${g.id}" onclick="sessionStorage.setItem('comingBack','true')">
                                    <div class="small-game-box" style="background-image:url('${g.cover_image || ''}');"></div>
                                    <div class="game-card-info">
                                        <h4 class="game-card-title">${g.title || 'Unknown'}</h4>
                                        <span class="game-card-rating">⭐ ${g.rating || 'N/A'}</span>
                                        <span class="compat-badge ${canRun ? 'can-run' : 'cannot-run'}">${canRun ? '✅ Can Run' : '❌ Cannot Run'}</span>
                                    </div>
                                </a>`;
                        }).join('');
                    } else {
                        relatedHTML = `<p style="color:#64748b;grid-column:1/-1;">No related games found.</p>`;
                    }
                    relatedGamesGrid.innerHTML = relatedHTML;
                }

                /* --- RUNNABLE GAMES --- */
                let runnableHTML = '';
                if (runnableGamesGrid) {
                    if (runnableGames.length > 0) {
                        runnableHTML = runnableGames.slice(0, 8).map(g => `
                            <a class="game-card" href="game_details.html?id=${g.rawg_id || g.id}" onclick="sessionStorage.setItem('comingBack','true')">
                                <div class="small-game-box" style="background-image:url('${g.cover_image || ''}');"></div>
                                <div class="game-card-info">
                                    <h4 class="game-card-title">${g.title || 'Unknown'}</h4>
                                    <span class="game-card-rating">⭐ ${g.rating || 'N/A'}</span>
                                    <span class="compat-badge can-run">✅ Can Run</span>
                                </div>
                            </a>`).join('');
                    } else {
                        runnableHTML = `<p style="color:#64748b;grid-column:1/-1;">No additional compatible games found.</p>`;
                    }
                    runnableGamesGrid.innerHTML = runnableHTML;
                }

                sessionStorage.setItem('predictResults', JSON.stringify({
                    searchedHTML,
                    relatedHTML,
                    runnableHTML,
                    resultHTML,
                    dynamicVisible: true
                }));

                if (dynamicResults) dynamicResults.scrollIntoView({ behavior: 'smooth' });

            } catch (err) {
                console.error("Predict error:", err);
                btn.innerHTML = `Analyze Performance`;
                btn.style.pointerEvents = "auto";

                if (dynamicResults) dynamicResults.innerHTML = `
                    <p style="color:#64748b;text-align:center;padding:40px 0;">
                        Something went wrong, please try again.
                    </p>`;
            }
        });
    }

    /* --- SKELETON BUILDER --- */
    function buildSkeleton(count) {
        return Array(count).fill(`
            <div class="skeleton-card">
                <div class="small-game-box" style="background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:16px;aspect-ratio:16/9;"></div>
                <div class="game-card-info">
                    <div style="height:14px;width:70%;background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:6px;margin-bottom:8px;"></div>
                    <div style="height:12px;width:30%;background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:6px;"></div>
                </div>
            </div>`).join('');
    }
});