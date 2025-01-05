const TMDB_API_KEY = 'c6077e34d224bf08884e23cbdc5bcbf3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function searchTMDB(query) {
    const [movieResults, tvResults] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${query}`).then(r => r.json()),
        fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${query}`).then(r => r.json())
    ]);
    
    // Filter movies to only those in our database
    const filteredMovies = movieResults.results.filter(movie => 
        contentList.allMovies.includes(movie.id)
    ).map(item => ({...item, mediaType: 'movie'}));

    // Filter TV shows to only those in our database
    const filteredTvShows = tvResults.results.filter(show => 
        contentList.allTvShows.includes(show.id)
    ).map(item => ({...item, mediaType: 'tv'}));
    
    return [...filteredMovies, ...filteredTvShows];
}
function searchLiveChannels(query) {
    return Object.entries(contentList.allLiveChannels)
        .filter(([_, channel]) => 
            channel.name.toLowerCase().includes(query.toLowerCase()) ||
            channel.category.toLowerCase().includes(query.toLowerCase())
        )
        .map(([id, channel]) => ({...channel, id, mediaType: 'live'}));
}

function createResultCard(item) {
    const title = item.title || item.name;
    const year = new Date(item.release_date || item.first_air_date).getFullYear();
    
    let href, overlay, badge;
    
    if (item.mediaType === 'live') {
        href = `live.html?id=${item.id}`;
        overlay = '<i class="fas fa-broadcast-tower"></i>';
        badge = '<span class="live-badge">LIVE</span>';
    } else {
        href = `${item.mediaType === 'movie' ? 'player' : 'playertv'}.html?id=${item.id}&type=${item.mediaType}&title=${encodeURIComponent(title)}`;
        overlay = '<i class="fas fa-play"></i>';
        badge = '<span class="quality">HD</span>';
    }

    return `
        <div class="card" onclick="window.location.href='${href}'">
            <div class="card-image">
                <img src="${item.mediaType === 'live' ? 'https://picsum.photos/300/450' : TMDB_IMAGE_BASE + item.poster_path}" alt="${title}">
                ${badge}
                <div class="play-overlay">
                    ${overlay}
                </div>
            </div>
            <div class="card-content">
                <h3>${title}</h3>
                <div class="meta">
                    ${item.mediaType === 'live' 
                        ? `<span class="category">${item.category}</span><span class="viewers"><i class="fas fa-eye"></i> ${item.viewers}</span>`
                        : `<span class="year">${year}</span><span class="rating"><i class="fas fa-star"></i> ${item.vote_average?.toFixed(1) || 'N/A'}</span>`
                    }
                </div>
            </div>
        </div>
    `;
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    
    if (query) {
        document.getElementById('searchInput').value = query;
        document.getElementById('search-query').textContent = query;
        
        const container = document.querySelector('.cards-container');
        container.innerHTML = '<p>Searching...</p>';
        
        try {
            const tmdbResults = await searchTMDB(query);
            const liveResults = searchLiveChannels(query);
            const allResults = [...tmdbResults, ...liveResults];
            
            if (allResults.length === 0) {
                container.innerHTML = '<p>No results found.</p>';
                return;
            }
            
            container.innerHTML = allResults
                .map(item => createResultCard(item))
                .join('');
                
        } catch (error) {
            console.error('Search error:', error);
            container.innerHTML = '<p>Error performing search. Please try again.</p>';
        }
    }
});

// Enable search on Enter key
document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});
