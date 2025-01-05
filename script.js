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
    
    // Different routing for movies and TV shows
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

document.addEventListener('DOMContentLoaded', async () => {
    if (document.querySelector('.cards-container')) {
        // Only run these if we're on the main page
        renderSection('featured-section', 'movie', movieData.featured);
        renderSection('movies-section', 'movie', movieData.movies);
        renderSection('tvshows-section', 'tv', movieData.tvShows);
    }
});
