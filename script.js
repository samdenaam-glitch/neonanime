// script.js – production ready

// Try to get Supabase credentials from environment variables (Netlify injects them)
// Fallback to hardcoded only if not present (for local dev)
const SUPABASE_URL = window.SUPABASE_URL || 'https://mwmxnicyodyxypfupdnu.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bXhuaWN5b2R5eHlwZnVwZG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTgzNTksImV4cCI6MjA4Njk5NDM1OX0.NMqzWV0bGVWJfAykqHO8KI0RXG1Po71RTSiwMbRUWwI';

// Initialize Supabase
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: show error in a container
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
    }
}

// Helper: create anime card HTML
function animeCard(anime) {
    return `
        <div class="anime-card" data-id="${anime.id}" data-title="${anime.title}" role="button" tabindex="0" aria-label="View ${anime.title}">
            <div class="card-img" style="background-image: url('${anime.cover_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=400&fit=crop'}');" role="img" aria-label="${anime.title} cover">
                <span class="card-badge">${anime.badge || 'NEW'}</span>
            </div>
            <div class="card-info">
                <h4>${anime.title}</h4>
                <div class="card-meta">
                    <span><i class="fas fa-microchip"></i> ${anime.type === 'movie' ? 'MOVIE' : (anime.episodes + ' eps')}</span>
                    <span><i class="fas fa-heart" style="color: magenta;"></i> ${anime.rating || '?'}%</span>
                </div>
            </div>
        </div>
    `;
}

// Generic fetch function with error handling
async function fetchAnime(queryBuilder, containerId, limit = 5, mapFn = animeCard) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
        const { data, error } = await queryBuilder;
        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="error-message">No content found</div>';
            return;
        }
        container.innerHTML = data.map(mapFn).join('');
    } catch (err) {
        console.error(`Error loading ${containerId}:`, err);
        container.innerHTML = `<div class="error-message">Failed to load: ${err.message}</div>`;
    }
}

// Load hero
async function loadHero() {
    const container = document.getElementById('hero-container');
    try {
        const { data, error } = await _supabase
            .from('anime')
            .select('*')
            .eq('featured', true)
            .limit(1);
        if (error) throw error;
        const anime = data && data[0] ? data[0] : null;
        if (!anime) {
            // Fallback static hero
            container.innerHTML = `
                <div class="hero-futuristic">
                    <div class="hero-featured">
                        <span class="badge"><i class="fas fa-crown"></i> WELCOME</span>
                        <h1>NEON ANIME</h1>
                        <p class="hero-desc">Explore public domain and indie animation.</p>
                        <div class="hologrid-stats">
                            <div><i class="fas fa-eye"></i> Join us</div>
                        </div>
                    </div>
                </div>`;
            return;
        }
        container.innerHTML = `
            <div class="hero-futuristic">
                <div class="hero-featured">
                    <span class="badge"><i class="fas fa-crown" style="color: gold;"></i> FEATURED</span>
                    <h1>${anime.title}</h1>
                    <p class="hero-desc">${anime.description || 'A classic anime now in legal stream.'}</p>
                    <div class="hologrid-stats">
                        <div><i class="fas fa-eye"></i> 4.2k watching</div>
                        <div><i class="fas fa-star" style="color: gold;"></i> ${anime.rating || 0}% match</div>
                    </div>
                </div>
                <div class="hero-panel">
                    <div class="panel-title"><i class="fas fa-chart-line" style="color: magenta;"></i> FEATURED</div>
                    <ul class="glow-ring">
                        <li><i class="fas fa-dragon"></i> ${anime.title} <span>#1</span></li>
                        <li><i class="fas fa-robot"></i> More classics <span>#2</span></li>
                    </ul>
                </div>
            </div>`;
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="error-message">⚠️ Failed to load featured</div>`;
    }
}

// Load trending (by rating)
function loadTrending() {
    const query = _supabase
        .from('anime')
        .select('*')
        .order('rating', { ascending: false })
        .limit(6);
    fetchAnime(query, 'trending-grid', 6);
}

// Load public domain (badge contains 'PD' or type 'public')
function loadPublicDomain() {
    const query = _supabase
        .from('anime')
        .select('*')
        .ilike('badge', '%PD%')
        .limit(4);
    fetchAnime(query, 'public-domain-grid', 4);
}

// Load carousel (latest)
function loadCarousel() {
    const query = _supabase
        .from('anime')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
    fetchAnime(query, 'carousel', 6, (item) => `
        <div class="scroll-card" data-id="${item.id}" role="button" tabindex="0" aria-label="View ${item.title}">
            <div class="tiny-cover" style="background-image: url('${item.cover_url}');"></div>
            <div><h5>${item.title}</h5><span style="color: #7b89a6;">${item.genre || 'classic'}</span></div>
        </div>
    `);
}

// Search functionality
async function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    const container = document.getElementById('trending-grid');
    container.innerHTML = '<div class="loading-spinner">Searching...</div>';
    try {
        const { data, error } = await _supabase
            .from('anime')
            .select('*')
            .ilike('title', `%${query}%`);
        if (error) throw error;
        if (data.length === 0) {
            container.innerHTML = '<div class="error-message">No results found</div>';
        } else {
            container.innerHTML = data.map(animeCard).join('');
        }
    } catch (err) {
        container.innerHTML = `<div class="error-message">Search failed: ${err.message}</div>`;
    }
}

// Attach search
document.getElementById('search-btn').addEventListener('click', handleSearch);
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Card click delegation (to navigate to detail page)
document.addEventListener('click', (e) => {
    const card = e.target.closest('.anime-card, .scroll-card');
    if (card && card.dataset.id) {
        // You can build a detail page later, e.g., /watch.html?id=...
        // For now, alert or redirect
        alert(`Navigate to anime ID: ${card.dataset.id} (implement watch page)`);
        // window.location.href = `/watch.html?id=${card.dataset.id}`;
    }
});

// Keyboard accessibility for cards
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.anime-card, .scroll-card');
        if (card && card.dataset.id) {
            e.preventDefault();
            alert(`Navigate to anime ID: ${card.dataset.id}`);
        }
    }
});

// Initial load
loadHero();
loadTrending();
loadCarousel();
loadPublicDomain();

// Optional: refresh on navigation clicks (if you want to implement filters)
document.querySelectorAll('.neon-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // You can implement category filtering later
        alert('Navigation - implement category filtering');
    });
});