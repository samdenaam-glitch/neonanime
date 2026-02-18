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

// Card renderers (now using <img> for lazy loading)
function animeCard(anime) {
    return `
        <div class="anime-card" data-id="${anime.id}">
            <div class="card-img">
                <img src="${anime.cover_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=400&fit=crop'}" alt="${anime.title}" loading="lazy">
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
            <div class="tiny-cover">
                <img src="${anime.cover_url}" alt="${anime.title}" loading="lazy">
            </div>
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
    // Show skeletons
    grid.innerHTML = Array(8).fill('<div class="skeleton-card"></div>').join('');
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
    track.innerHTML = Array(10).fill('<div class="skeleton-carousel"></div>').join('');
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
    grid.innerHTML = Array(4).fill('<div class="skeleton-card"></div>').join('');
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

// Filter by genre
async function filterByGenre(genre) {
    const grid = document.getElementById('trending-grid');
    const titleEl = document.getElementById('trending-title');
    grid.innerHTML = '<div class="loading-spinner">Loading...</div>';
    try {
        let query = _supabase.from('anime').select('*');
        if (genre !== 'All') {
            // Assuming genre column is text array
            query = query.contains('genre', [genre]);
        }
        const { data, error } = await query.limit(20);
        if (error) throw error;
        if (data.length === 0) {
            grid.innerHTML = '<div class="error-message">No anime found in this genre</div>';
        } else {
            titleEl.textContent = genre === 'All' ? '🔥 Trending Now' : `📺 ${genre} Anime`;
            grid.innerHTML = data.map(animeCard).join('');
        }
    } catch (err) {
        grid.innerHTML = `<div class="error-message">${err.message}</div>`;
    }
}

// Search
async function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    const grid = document.getElementById('trending-grid');
    const titleEl = document.getElementById('trending-title');
    grid.innerHTML = '<div class="loading-spinner">Searching...</div>';
    document.getElementById('clear-search').style.display = 'inline';
    try {
        const { data, error } = await _supabase
            .from('anime')
            .select('*')
            .ilike('title', `%${query}%`);
        if (error) throw error;
        if (data.length === 0) {
            grid.innerHTML = '<div class="error-message">No results found</div>';
        } else {
            titleEl.textContent = `Search Results for "${query}"`;
            grid.innerHTML = data.map(animeCard).join('');
        }
    } catch (err) {
        grid.innerHTML = `<div class="error-message">${err.message}</div>`;
    }
}

// Clear search
function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').style.display = 'none';
    document.getElementById('trending-title').textContent = '🔥 Trending Now';
    loadTrending();
}

// Genre filter event listeners
document.querySelectorAll('.genre-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const genre = chip.getAttribute('data-genre');
        filterByGenre(genre);
    });
});

// Card click navigation to watch page
document.addEventListener('click', (e) => {
    const card = e.target.closest('.anime-card, .carousel-card');
    if (card && card.dataset.id) {
        window.location.href = `/watch.html?id=${card.dataset.id}`;
    }
});

// ==================== AUTHENTICATION ====================
const modal = document.getElementById('auth-modal');
const userMenu = document.getElementById('user-menu');
const closeBtn = document.querySelector('.close');

// Tab switching
document.getElementById('login-tab').addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('login-tab').classList.add('active');
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active-form'));
    document.getElementById('login-form').classList.add('active-form');
});

document.getElementById('signup-tab').addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('signup-tab').classList.add('active');
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active-form'));
    document.getElementById('signup-form').classList.add('active-form');
});

// Open modal
userMenu.addEventListener('click', () => {
    modal.style.display = 'block';
});

// Close modal
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// Handle Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageEl = document.getElementById('login-message');
    messageEl.textContent = 'Logging in...';
    
    const { data, error } = await _supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
        messageEl.textContent = error.message;
    } else {
        messageEl.textContent = 'Login successful!';
        modal.style.display = 'none';
        updateUserMenu(data.user);
    }
});

// Handle Sign Up
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const messageEl = document.getElementById('signup-message');
    messageEl.textContent = 'Creating account...';
    
    const { data, error } = await _supabase.auth.signUp({
        email,
        password
    });
    
    if (error) {
        messageEl.textContent = error.message;
    } else {
        messageEl.textContent = 'Account created! Check your email for confirmation.';
        // Optionally auto-login? No, user must confirm email first.
    }
});

// Update user menu based on auth state
async function updateUserMenu(user = null) {
    const menuIcon = document.querySelector('.user-menu i');
    if (user) {
        menuIcon.className = 'fas fa-user-check'; // logged in icon
        menuIcon.style.color = 'var(--accent-secondary)';
    } else {
        menuIcon.className = 'far fa-user-circle';
        menuIcon.style.color = 'var(--text-dim)';
    }
}

// Check initial auth state
async function checkAuthState() {
    const { data: { user } } = await _supabase.auth.getUser();
    updateUserMenu(user);
}

// Listen for auth changes
_supabase.auth.onAuthStateChange((event, session) => {
    updateUserMenu(session?.user ?? null);
});

// Call on load
checkAuthState();

// Logout function (optional) – you could add a logout button in user menu dropdown later
async function logout() {
    await _supabase.auth.signOut();
    updateUserMenu(null);
}

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
document.getElementById('clear-search').addEventListener('click', clearSearch);
