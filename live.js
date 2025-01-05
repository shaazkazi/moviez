let channelData;

function changeSource(sourceKey) {
    const playerInstance = jwplayer("player");
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('id');
    
    const videoSources = liveSources[channelId];
    
    playerInstance.load({
        file: videoSources[sourceKey].file
    });
}

async function initializePlayer(channelId) {
    const playerInstance = jwplayer("player");
    const videoSources = liveSources[channelId];
    
    playerInstance.setup({
        sources: Object.values(videoSources),
        image: channelData.thumbnail,
        title: channelData.name,
        width: "100%",
        aspectratio: "16:9",
        stretching: "uniform",
        preload: "auto",
        controls: true,
        primary: "html5",
        autostart: true,
        playbackRateControls: false,
        skin: {
            name: "netflix"
        }
    });

    return playerInstance;
}

function updateChannelInfo(channelData) {
    document.querySelector('.channel-title').textContent = channelData.name;
    document.querySelector('.viewers').innerHTML = `<i class="fas fa-eye"></i> ${channelData.viewers}`;
    document.querySelector('.category').textContent = channelData.category;
    document.querySelector('.description p').textContent = channelData.description;
    
    document.querySelector('.info-item .value').textContent = channelData.language;
    document.querySelector('.info-item:nth-child(2) .value').textContent = channelData.category;
    document.querySelector('.info-item:nth-child(3) .value').textContent = channelData.region;
}

function populateSourceSelector(channelId) {
    const sourceSelector = document.getElementById('sourceSelector');
    const sources = liveSources[channelId];
    
    sourceSelector.innerHTML = Object.entries(sources)
        .filter(([key]) => key !== 'channelInfo')
        .map(([key, source]) => `
            <option value="${key}">${source.label}</option>
        `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('id');
    
    if (channelId && liveSources[channelId]) {
        channelData = liveSources[channelId].channelInfo;
        updateChannelInfo(channelData);
        
        const player = await initializePlayer(channelId);
        populateSourceSelector(channelId);
    }
});