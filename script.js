// script.js – modern version with Swiper and enhanced cards

// Supabase config – replace with your actual credentials or env vars
const SUPABASE_URL = window.SUPABASE_URL || 'https://mwmxnicyodyxypfupdnu.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bXhuaWN5b2R5eHlwZnVwZG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTgzNTksImV4cCI6MjA4Njk5NDM1OX0.NMqzWV0bGVWJfAykqHO8KI0RXG1Po71RTSiwMbRUWwI';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: show error
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
}

// Card renderers
function animeCard(anime) {
    return `
        <div class="anime-card" data-id="${anime.id}">
            <div class="card-img" style="background-image: url('${anime.cover_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=400&fit=crop'}');">
                <span class="card-badge">${anime.badge || 'NEW'}</span>
            </div>
            <div class="card-info">
                <h4>${anime.title}</h4>
                <div class="card-meta">
                    <span><i class="fas fa-microchip"></i> ${anime.type === 'movie' ? 'MOVIE' : anime.episodes + ' eps'}</span>
                    <span><i class="fas fa-heart"></i> ${anime.rating || '?'}%</span>
                </div>
            </div>
        </div>
    `;
}

function carouselCard(anime) {
    return `
        <div class="carousel-card" data-id="${anime.id}">
            <div class="tiny-cover" style="background-image: url('${anime.cover_url}');"></div>
            <div>
                <h5>${anime.title}</h5>
                <p>${anime.genre || 'Anime'}</p>
            </div>
        </div>
    `;
}

function heroSlide(anime) {
    return `
        <div class="swiper-slide hero-slide" style="background-image: url('${anime.cover_url}');">
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <span class="badge">FEATURED</span>
                <h2>${anime.title}</h2>
                <p>${anime.description || 'A classic anime now streaming legally.'}</p>
                <div class="slide-stats">
                    <span><i class="fas fa-star"></i> ${anime.rating}% Match</span>
                    <span><i class="fas fa-calendar"></i> ${anime.year || '2025'}</span>
                </div>
            </div>
        </div>
    `;
}

// Fetch and inject hero slides (featured animes)
async function loadHero() {
    const wrapper = document.getElementById('hero-swiper-wrapper');
    if (!wrapper) return;
    try {
        const { data, error } = await _supabase
            .from('anime')
            .select('*')
            .eq('featured', true)
            .limit(5);
        if (error) throw error;
        if (!data || data.length === 0) {
            wrapper.innerHTML = '<div class="swiper-slide">No featured</div>';
            return;
        }
        wrapper.innerHTML = data.map(heroSlide).join('');
        // Initialize Swiper
        new Swiper('.hero-swiper', {
            loop: true,
            autoplay: { delay: 5000 },
            pagination: { el: '.swiper-pagination' },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        });
    } catch (err) {
        console.error(err);
        wrapper.innerHTML = `<div class="swiper-slide error-message">Failed to load hero</div>`;
    }
}

// Load trending (highest rated)
async function loadTrending() {
    const grid = document.getElementById('trending-grid');
    grid.innerHTML = '<div class="loading-spinner">Loading...</div>';
    try {
        const { data, error } = await _supabase
            .from('anime')
            .select('*')
            .order('rating', { ascending: false })
            .limit(8);
        if (error) throw error;
        grid.innerHTML = data.map(animeCard).join('');
    } catch (err) {
        grid.innerHTML = `<div class="error-message">${err.message}</div>`;
    }
}

// Load latest additions (carousel)
async function loadCarousel() {
    const track = document.getElementById('carousel-track');
    track.innerHTML = '<div class="loading-spinner">Loading...</div>';
    try {
        const { data, error } = await _supabase
            .from('anime')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        if (error) throw error;
        track.innerHTML = data.map(carouselCard).join('');
    } catch (err) {
        track.innerHTML = `<div class="error-message">${err.message}</div>`;
    }
}

// Load public domain
async function loadPublicDomain() {
    const grid = document.getElementById('public-domain-grid');
    grid.innerHTML = '<div class="loading-spinner">Loading...</div>';
    try {
        const { data, error } = await _supabase
            .from('anime')
            .select('*')
            .ilike('badge', '%PD%')
            .limit(4);
        if (error) throw error;
        grid.innerHTML = data.map(animeCard).join('');
    } catch (err) {
        grid.innerHTML = `<div class="error-message">${err.message}</div>`;
    }
}

// Search
async function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    const grid = document.getElementById('trending-grid'); // reuse trending grid for results
    grid.innerHTML = '<div class="loading-spinner">Searching...</div>';
    try {
        const { data, error } = await _supabase
            .from('anime')
            .select('*')
            .ilike('title', `%${query}%`);
        if (error) throw error;
        if (data.length === 0) {
            grid.innerHTML = '<div class="error-message">No results found</div>';
        } else {
            grid.innerHTML = data.map(animeCard).join('');
        }
    } catch (err) {
        grid.innerHTML = `<div class="error-message">${err.message}</div>`;
    }
}

// Genre filter demo (just UI for now – you can extend to filter by genre)
document.querySelectorAll('.genre-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        // Here you could implement actual filtering by genre (needs column in DB)
        alert('Filter by genre – implement with Supabase query');
    });
});

// Card click navigation to watch page
document.addEventListener('click', (e) => {
    const card = e.target.closest('.anime-card, .carousel-card');
    if (card && card.dataset.id) {
        window.location.href = `/watch.html?id=${card.dataset.id}`;
    }
});

// Initial loads
loadHero();
loadTrending();
loadCarousel();
loadPublicDomain();

// Search event
document.getElementById('search-btn').addEventListener('click', handleSearch);
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
