const TMDB_API_KEY = 'c6077e34d224bf08884e23cbdc5bcbf3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const movieData = {
    featured: [155, 27205], // Dark Knight, Inception
    movies: [19995, 238, 98, 475557, 496243, 438631], // Popular movies
    tvShows: [1396, 1399, 66732, 82856, 71912, 84958], // Popular TV shows
};

async function fetchTMDBData(mediaType, id) {
    const response = await fetch(
        `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}`
    );
    return response.json();
}

function createCardHTML(item, mediaType) {
    const title = item.title || item.name;
    const year = new Date(item.release_date || item.first_air_date).getFullYear();
    const duration = mediaType === 'movie'
        ? `${Math.floor(item.runtime/60)}h ${item.runtime%60}m`
        : `S${item.number_of_seasons}`;
    
    const href = mediaType === 'movie' 
        ? `player.html?id=${item.id}&type=${mediaType}&title=${encodeURIComponent(title)}`
        : `playertv.html?id=${item.id}&type=${mediaType}&title=${encodeURIComponent(title)}`;
    
    return `
        <div class="card" onclick="window.location.href='${href}'">
            <div class="card-image">
                <img src="${TMDB_IMAGE_BASE}${item.poster_path}" alt="${title}">
                <span class="quality">HD</span>
                <span class="duration">${duration}</span>
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="card-content">
                <h3>${title}</h3>
                <div class="meta">
                    <span class="year">${year}</span>
                    <span class="rating"><i class="fas fa-star"></i> ${item.vote_average.toFixed(1)}</span>
                </div>
            </div>
        </div>
    `;
}

async function renderSection(sectionId, mediaType, ids) {
    const container = document.querySelector(`#${sectionId} .cards-container`);
    container.innerHTML = '';
    
    try {
        const items = await Promise.all(
            ids.map(id => fetchTMDBData(mediaType, id))
        );
        
        items.forEach(item => {
            container.innerHTML += createCardHTML(item, mediaType);
        });
    } catch (error) {
        console.error(`Error loading ${sectionId}:`, error);
        container.innerHTML = '<p>Error loading content. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('index.html') || currentPath === '/') {
        // Main page
        renderSection('featured-section', 'movie', movieData.featured);
        renderSection('movies-section', 'movie', movieData.movies);
        renderSection('tvshows-section', 'tv', movieData.tvShows);
    } else if (currentPath.includes('movies.html')) {
        // Movies page
        renderSection('movies-section', 'movie', contentList.allMovies);
    } else if (currentPath.includes('tvshows.html')) {
        // TV Shows page
        renderSection('tvshows-section', 'tv', contentList.allTvShows);
    } else if (currentPath.includes('livetv.html')) {
        // Live TV page
        renderLiveChannels('livetv-section', contentList.allLiveChannels);
    }
});
function showError(message) {
    const existingError = document.querySelector('.search-error');
    if (existingError) {
        existingError.remove();
    }

    const error = document.createElement('div');
    error.className = 'search-error';
    error.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        ${message}
    `;
    document.body.appendChild(error);

    setTimeout(() => error.classList.add('show'), 100);
    setTimeout(() => {
        error.classList.remove('show');
        setTimeout(() => error.remove(), 300);
    }, 3000);
}

function openSearchPage() {
    const searchValue = document.getElementById("searchInput").value;
    if (searchValue.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(searchValue)}`;
    } else {
        showError("Please enter a search term");
    }
}
function createLiveChannelCard(channelId, channelData) {
    return `
        <div class="card" onclick="window.location.href='live.html?id=${channelId}'">
            <div class="card-image">
                <img src="https://picsum.photos/300/450" alt="${channelData.name}">
                <span class="quality">HD</span>
                <span class="live-badge">LIVE</span>
                <div class="play-overlay">
                    <i class="fas fa-broadcast-tower"></i>
                </div>
            </div>
            <div class="card-content">
                <h3>${channelData.name}</h3>
                <div class="meta">
                    <span class="category">${channelData.category}</span>
                    <span class="viewers"><i class="fas fa-eye"></i> ${channelData.viewers}</span>
                </div>
            </div>
        </div>
    `;
}

function renderLiveChannels(sectionId, channels) {
    const container = document.querySelector(`#${sectionId} .cards-container`);
    container.innerHTML = '';
    
    Object.entries(channels).forEach(([channelId, channelData]) => {
        container.innerHTML += createLiveChannelCard(channelId, channelData);
    });
}

// Add this to script.js after the existing code

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchWrapper = document.querySelector('.search');
    
    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    searchWrapper.appendChild(dropdown);
    
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim().toLowerCase();
        
        if (query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }

        const results = await searchContent(query);
        displaySearchResults(results, dropdown);
    });

    // Handle Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            openSearchPage();
        }
    });
}

async function searchContent(query) {
    const movieResults = await Promise.all(
        movieData.movies.map(async id => {
            const data = await fetchTMDBData('movie', id);
            return {
                id,
                title: data.title,
                type: 'movie',
                poster_path: data.poster_path
            };
        })
    );

    const tvResults = await Promise.all(
        movieData.tvShows.map(async id => {
            const data = await fetchTMDBData('tv', id);
            return {
                id,
                title: data.name,
                type: 'tv',
                poster_path: data.poster_path
            };
        })
    );

    const allResults = [...movieResults, ...tvResults].filter(item => 
        item.title.toLowerCase().includes(query)
    );

    return allResults.slice(0, 5); // Limit to 5 results
}

function displaySearchResults(results, dropdown) {
    if (!results.length) {
        dropdown.style.display = 'none';
        return;
    }

    dropdown.innerHTML = results.map(item => `
        <div class="dropdown-item" onclick="window.location.href='${item.type === 'movie' ? 'player' : 'playertv'}.html?id=${item.id}&type=${item.type}'">
            <img src="${TMDB_IMAGE_BASE}${item.poster_path}" onerror="this.src='placeholder.jpg'" alt="${item.title}">
            <div class="item-info">
                <div class="item-title">${item.title}</div>
                <div class="item-type">${item.type === 'movie' ? 'Movie' : 'TV Show'}</div>
            </div>
        </div>
    `).join('');
    
    dropdown.style.display = 'block';
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    // ... rest of your existing code
});

function scrollFeatured(direction) {
    const container = document.querySelector('#featured-section .cards-container');
    const scrollAmount = container.offsetWidth * 0.85;
    
    if (direction === 'left') {
        container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    } else {
        container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
}
