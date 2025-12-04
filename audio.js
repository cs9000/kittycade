const sounds = {
    'catnip': { path: 'audio/catnip.mp3', volume: 0.6 },
    'food': { path: 'audio/eat_food.mp3', volume: 0.6 },
    'litter': { path: 'audio/litter_box2.wav', volume: 0.6 },
    'bed': { path: 'audio/snoring2.wav', volume: 0.6 },
    'treat': { path: 'audio/yarn.wav', volume: 0.6 },
    'mouse': { path: 'audio/mouse.mp3', volume: 0.6 },
    'ready': { path: 'audio/ready.wav', volume: 0.6 },
    'lose_life': { path: 'audio/lose_life2.wav', volume: 0.6 },
    'game_over': { path: 'audio/game_over.wav', volume: 0.6 },
    'yay': { path: 'audio/yay.mp3', volume: 0.4 },
    'meow': { path: 'audio/meow_short_quiet.wav', volume: 1.0 },
    'intro': { path: 'audio/intro.mp3', volume: 0.3 },
};

const audioCache = {};

window.playIntroSound = function() {
    if (game.muted) return;
    const audio = audioCache['intro'];
    if (audio) {
        audio.loop = true;
        audio.volume = sounds['intro'].volume;
        audio.play();
    }
}

window.stopIntroSound = function() {
    const audio = audioCache['intro'];
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

function preloadSounds() {
    console.log('Starting to preload sounds...');
    const promises = Object.entries(sounds).map(([name, soundInfo]) => {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            const onCanPlay = () => {
                // Remove listeners to prevent memory leaks
                audio.removeEventListener('canplaythrough', onCanPlay);
                audio.removeEventListener('error', onError);
                
                console.log(`Sound loaded: ${name}`);
                audioCache[name] = audio;
                resolve();
            };

            const onError = () => {
                 // Remove listeners to prevent memory leaks
                audio.removeEventListener('canplaythrough', onCanPlay);
                audio.removeEventListener('error', onError);

                console.error(`Failed to load sound: ${soundInfo.path}`);
                reject(new Error(`Failed to load sound: ${soundInfo.path}`));
            };

            audio.addEventListener('canplaythrough', onCanPlay);
            audio.addEventListener('error', onError);
            
            audio.src = soundInfo.path;
            audio.load(); // Explicitly trigger loading

            // Handle cases where the audio might be cached and ready immediately
            if (audio.readyState >= 4) { // HAVE_ENOUGH_DATA
                onCanPlay();
            }
        });
    });

    return Promise.all(promises).then(() => {
        console.log('All sounds preloaded successfully!');
    }).catch(error => {
        console.error('An error occurred during sound preloading:', error);
        throw error; // Re-throw to be caught by the caller in main.js
    });
}

function playSound(name, volume) {
    if (game.muted) return;
    const audio = audioCache[name];
    const soundInfo = sounds[name];
    if (audio && soundInfo) {
        audio.currentTime = 0;
        audio.volume = volume !== undefined ? volume : soundInfo.volume;
        audio.play();
    } else {
        console.error(`Sound not found: ${name}`);
    }
}
