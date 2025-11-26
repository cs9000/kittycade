const sounds = {
    'catnip': 'audio/catnip.mp3',
    'food': 'audio/eat_food.mp3',
    'litter': 'audio/litter_box2.wav',
    'bed': 'audio/snoring2.wav',
    'treat': 'audio/yarn.wav',
    'mouse': 'audio/mouse.mp3',
};

const audioCache = {};

function preloadSounds() {
    console.log('Starting to preload sounds...');
    const promises = Object.entries(sounds).map(([name, src]) => {
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

                console.error(`Failed to load sound: ${src}`);
                reject(new Error(`Failed to load sound: ${src}`));
            };

            audio.addEventListener('canplaythrough', onCanPlay);
            audio.addEventListener('error', onError);
            
            audio.src = src;
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

function playSound(name) {
    if (game.muted) return;
    const audio = audioCache[name];
    if (audio) {
        audio.currentTime = 0;
        audio.play();
    } else {
        console.error(`Sound not found: ${name}`);
    }
}
