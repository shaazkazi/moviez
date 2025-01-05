let showData; // Global variable to store show data

function changeSource(sourceKey) {
    const playerInstance = jwplayer("player");
    const params = new URLSearchParams(window.location.search);
    const showId = params.get('id');
    const season = document.getElementById('seasonSelector').value;
    const episode = document.querySelector('.episode-btn.active').textContent;
    
    const videoSources = tvSources[showId][`season${season}`][`episode${episode}`];
    const currentTime = playerInstance.getPosition();
    
    playerInstance.load({
        file: videoSources[sourceKey].file
    });
    
    playerInstance.once('ready', () => {
        playerInstance.seek(currentTime);
        playerInstance.play();
    });
}

async function initializePlayer(showData, season, episode) {
    const playerInstance = jwplayer("player");
    const videoSources = tvSources[showData.id][`season${season}`][`episode${episode}`];
    
    playerInstance.setup({
        sources: Object.values(videoSources),
        image: `https://image.tmdb.org/t/p/original${showData.backdrop_path}`,
        title: `${showData.name} - S${season}E${episode}`,
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
        }
    });

    return playerInstance;
}

function updateShowInfo(showData) {
    document.querySelector('.show-title').textContent = showData.name;
    document.querySelector('.year').textContent = new Date(showData.first_air_date).getFullYear();
    document.querySelector('.rating').innerHTML = `<i class="fas fa-star"></i> ${showData.vote_average.toFixed(1)}`;
    document.querySelector('.synopsis p').textContent = showData.overview;
    
    document.querySelector('.info-item .value').textContent = showData.created_by?.map(creator => creator.name).join(', ') || 'N/A';
    document.querySelector('.info-item:nth-child(2) .value').textContent = showData.cast?.join(', ') || 'N/A';
    document.querySelector('.info-item:nth-child(3) .value').textContent = showData.genres?.map(g => g.name).join(', ') || 'N/A';
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

async function populateSeasonDropdown(showId) {
    const seasonData = await fetchTMDBData('tv', showId);
    const seasonSelector = document.getElementById('seasonSelector');
    
    seasonSelector.innerHTML = Array.from(
        {length: seasonData.number_of_seasons},
        (_, i) => `<option value="${i + 1}">Season ${i + 1}</option>`
    ).join('');
}

async function changeSeason(seasonNum) {
    const params = new URLSearchParams(window.location.search);
    const showId = params.get('id');
    
    const seasonData = await fetchTMDBData('tv', showId, `/season/${seasonNum}`);
    await populateEpisodes(showId, seasonNum);
    playEpisode(1);
}

async function populateEpisodes(showId, seasonNum) {
    const seasonData = await fetchTMDBData('tv', showId, `/season/${seasonNum}`);
    const episodesContainer = document.querySelector('.episodes-container');
    
    episodesContainer.innerHTML = Array.from(
        {length: seasonData.episodes.length},
        (_, i) => `<button onclick="playEpisode(${i + 1})" class="episode-btn">${i + 1}</button>`
    ).join('');
    
    document.querySelector('.episode-btn').classList.add('active');
}

function playEpisode(episodeNum) {
    const params = new URLSearchParams(window.location.search);
    const showId = params.get('id');
    const season = document.getElementById('seasonSelector').value;
    
    document.querySelectorAll('.episode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.episode-btn:nth-child(${episodeNum})`).classList.add('active');
    
    document.querySelector('.episode-info').textContent = `S${season}E${episodeNum}`;
    
    const playerInstance = jwplayer("player");
    const videoSources = tvSources[showId][`season${season}`][`episode${episodeNum}`];
    
    playerInstance.load({
        sources: Object.values(videoSources),
        image: `https://image.tmdb.org/t/p/original${showData.backdrop_path}`,
        title: `${showData.name} - S${season}E${episodeNum}`
    });
    
    populateSourceSelector(showId, season, episodeNum);
}

function populateSourceSelector(showId, season, episode) {
    const sourceSelector = document.getElementById('sourceSelector');
    const sources = tvSources[showId][`season${season}`][`episode${episode}`];
    
    sourceSelector.innerHTML = Object.entries(sources)
        .map(([key, source]) => `
            <option value="${key}">${source.label}</option>
        `).join('');
}

async function fetchTMDBData(mediaType, id, append = '') {
    const [details, credits] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/${mediaType}/${id}${append}?api_key=${TMDB_API_KEY}`).then(r => r.json()),
        fetch(`${TMDB_BASE_URL}/${mediaType}/${id}/credits?api_key=${TMDB_API_KEY}`).then(r => r.json())
    ]);

    return {
        ...details,
        cast: credits.cast?.slice(0, 3).map(actor => actor.name) || ['N/A']
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const showId = params.get('id');
    const mediaType = params.get('type');
    
    if (showId && mediaType) {
        showData = await fetchTMDBData(mediaType, showId);
        await populateSeasonDropdown(showId);
        await populateEpisodes(showId, 1);
        updateShowInfo(showData);
        
        const player = await initializePlayer(showData, 1, 1);
        document.querySelector('.episode-btn').classList.add('active');
        document.querySelector('.episode-info').textContent = 'S1E1';
        populateSourceSelector(showId, 1, 1);
        
        document.addEventListener('keydown', (e) => handleKeyboard(e, player));
    }
});
