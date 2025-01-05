function changeSource(sourceKey) {
    const playerInstance = jwplayer("player");
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');
    const videoSources = movieSources[movieId];
    
    const currentTime = playerInstance.getPosition();
    
    playerInstance.load({
        file: videoSources[sourceKey].file
    });
    
    playerInstance.once('ready', () => {
        playerInstance.seek(currentTime);
        playerInstance.play();
    });
}


async function initializePlayer(movieData) {
    const playerInstance = jwplayer("player");
    const videoSources = movieSources[movieData.id];
    
    playerInstance.setup({
        sources: Object.values(videoSources),
        image: `https://image.tmdb.org/t/p/original${movieData.backdrop_path}`,
        title: movieData.title || movieData.name,
        width: "100%",
        aspectratio: "16:9",
        stretching: "uniform",
        preload: "auto",
        controls: true,
        primary: "html5",
        autostart: false,
        playbackRateControls: true,
        skin: {
            name: "netflix"
        },
        captions: {
            color: '#FFF',
            fontSize: 14,
            backgroundOpacity: 0,
            edgeStyle: 'raised'
        }
    });

    return playerInstance;
}

function updateMovieInfo(movieData) {
    document.querySelector('.movie-title').textContent = movieData.title || movieData.name;
    document.querySelector('.year').textContent = new Date(movieData.release_date || movieData.first_air_date).getFullYear();
    document.querySelector('.duration').textContent = `${Math.floor(movieData.runtime/60)}h ${movieData.runtime%60}m`;
    document.querySelector('.rating').innerHTML = `<i class="fas fa-star"></i> ${movieData.vote_average.toFixed(1)}`;
    document.querySelector('.synopsis p').textContent = movieData.overview;
    
    document.querySelector('.info-item .value').textContent = movieData.director || 'N/A';
    document.querySelector('.info-item:nth-child(2) .value').textContent = movieData.cast?.join(', ') || 'N/A';
    document.querySelector('.info-item:nth-child(3) .value').textContent = movieData.genres?.map(g => g.name).join(', ') || 'N/A';
}

function handleKeyboard(e, player) {
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
            e.preventDefault();
            player.getState() === 'playing' ? player.pause() : player.play();
            break;
        case 'f':
            e.preventDefault();
            player.setFullscreen(!player.getFullscreen());
            break;
        case 'm':
            e.preventDefault();
            player.setMute(!player.getMute());
            break;
        case 'arrowright':
            e.preventDefault();
            player.seek(player.getPosition() + 10);
            break;
        case 'arrowleft':
            e.preventDefault();
            player.seek(player.getPosition() - 10);
            break;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');
    const mediaType = params.get('type');
    
    if (movieId && mediaType) {
        const movieData = await fetchTMDBData(mediaType, movieId);
        const player = await initializePlayer(movieData);
        updateMovieInfo(movieData);
        
        document.addEventListener('keydown', (e) => handleKeyboard(e, player));
        
        player.on('error', function(e) {
            console.error('Player error:', e);
            const sources = Object.values(movieSources[movieId]);
            const currentSource = player.getPlaylistItem().sources[0];
            const currentIndex = sources.findIndex(s => s.file === currentSource.file);
            const nextSource = sources[(currentIndex + 1) % sources.length];
            
            if (nextSource) {
                player.load({
                    file: nextSource.file
                });
            }
        });
    }
});

function populateSourceSelector(movieId) {
    const sourceSelector = document.getElementById('sourceSelector');
    const sources = movieSources[movieId];
    
    sourceSelector.innerHTML = Object.entries(sources)
        .map(([key, source]) => `
            <option value="${key}">${source.label}</option>
        `).join('');
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');
    const mediaType = params.get('type');
    
    if (movieId && mediaType) {
        populateSourceSelector(movieId);  // Add this line
        // ... rest of your existing code
    }
});

async function fetchTMDBData(mediaType, id) {
    const [details, credits] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}`).then(r => r.json()),
        fetch(`${TMDB_BASE_URL}/${mediaType}/${id}/credits?api_key=${TMDB_API_KEY}`).then(r => r.json())
    ]);

    return {
        ...details,
        director: credits.crew.find(person => person.job === 'Director')?.name || 'N/A',
        cast: credits.cast.slice(0, 3).map(actor => actor.name) || ['N/A']
    };
}
