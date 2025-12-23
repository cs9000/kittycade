let logicLoopId = null; 
let particleContainer = null;
let animationFrameId = null;
let mouseLogicId = null;
let featherTimerId = null; 

let readyTimeoutId = null;
let readyCountdown = 0;
let readyCountdownStart = 0;

let feedbackTimeoutId = null;
let feedbackCountdown = 0;
let feedbackCountdownStart = 0;
let feedbackCallback = null;

let turboCountdown = 0;
let turboCountdownStart = 0;

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function stopTimedIntervals() {
    if (mouseLogicId) { clearInterval(mouseLogicId); mouseLogicId = null; }
    if (readyTimeoutId) { clearTimeout(readyTimeoutId); readyTimeoutId = null; }
    if (feedbackTimeoutId) { clearTimeout(feedbackTimeoutId); feedbackTimeoutId = null; }
    if (featherTimerId) { clearTimeout(featherTimerId); featherTimerId = null; } 
}

function stopGameLoops() {
    stopTimedIntervals();
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
}

function startMouseLogic() {
    if (mouseLogicId) clearInterval(mouseLogicId);
    game.mouseLastLogicTime = performance.now();
    mouseLogicId = setInterval(() => {
        if (!game.paused && !game.gameOver) moveMouse();
    }, MOUSE_LOGIC_SPEED);
}

function gameLoop(currentTime) {
    if (!game.started || game.gameOver) {
        animationFrameId = null; // Ensure RAF stops if game is over or not started
        return;
    }

    // Calculate deltaTime for logic updates
    let logicDeltaTime = 0;
    if (!game.paused) {
        logicDeltaTime = currentTime - game.lastFrameTime;
        game.lastFrameTime = currentTime; // Update lastFrameTime after using it for logic
        game.lag += logicDeltaTime;

        while (game.lag >= game.speed) {
            game.snake.forEach(seg => { seg.px = seg.x; seg.py = seg.y; });
            updateGameLogic();
            game.lag -= game.speed;
        }
    } else {
        // If paused, just update lastFrameTime to prevent huge lag accumulation on unpause
        game.lastFrameTime = currentTime;
    }

    // Calculate deltaTime for rendering updates (always happens, even if paused)
    const renderDeltaTime = (currentTime - game.lastRenderTime) / 1000; // Convert to seconds
    game.lastRenderTime = currentTime; // Update lastRenderTime

    // Always render, even when paused (for feedback messages, pause overlay, animations)
    const interpolationFactor = game.lag / game.speed;
    draw(interpolationFactor, renderDeltaTime);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function updatePauseState() {
    const wasReadyRunning = readyTimeoutId != null;
    const wasFeedbackRunning = feedbackTimeoutId != null;
    const wasTurboRunning = featherTimerId != null;

    game.paused = game.userPaused || game.systemPaused;

    // 1. Stop everything and update UI
    stopGameLoops();
    document.getElementById('pauseOverlay').classList.toggle('hidden', !game.userPaused);
    document.getElementById('pauseBtn').textContent = game.userPaused ? '▶️' : '⏸';

    // 2. If we just paused, calculate remaining time and save state
    if (game.userPaused) {
        game.savedSnakeState = JSON.parse(JSON.stringify(game.snake)); // Deep copy snake state
        game.savedLag = game.lag; // Save current lag for precise resume position
        game.savedLastFrameTime = game.lastFrameTime;
        if (wasReadyRunning) readyCountdown -= (performance.now() - readyCountdownStart);
        if (wasFeedbackRunning) feedbackCountdown -= (performance.now() - feedbackCountdownStart);
        if (wasTurboRunning) turboCountdown -= (performance.now() - turboCountdownStart);
    }
    
    // 3. Decide what to restart
    const shouldBePaused = game.userPaused || game.systemPaused;
    if (!shouldBePaused) {
        // UNPAUSED: restore saved state and start main game loops
        if (game.savedSnakeState) {
            game.snake = JSON.parse(JSON.stringify(game.savedSnakeState)); // Deep copy back
            game.savedSnakeState = null; // Clear saved state
        }
        if (typeof game.savedLag === 'number') {
            game.lag = game.savedLag; // Restore lag
            game.savedLag = null;
        } else {
            game.lag = 0; // Fresh start, or no lag to restore
        }
        
        // Set current time as last frame time to start fresh delta calculation for the gameLoop
        game.lastFrameTime = performance.now();

        // Clear savedLastFrameTime if it exists, as it's not being used here for restoration
        if (typeof game.savedLastFrameTime === 'number') {
            game.savedLastFrameTime = null;
        }
        animationFrameId = requestAnimationFrame(gameLoop);
        startMouseLogic();
        // Restart any timers that were running
        if (readyCountdown > 0) {
            readyCountdownStart = performance.now();
            startCountdown(readyCountdown);
        }
        if (feedbackCountdown > 0) {
            feedbackCountdownStart = performance.now();
            startFeedbackCountdown(feedbackCountdown);
        }
        if (turboCountdown > 0) {
            turboCountdownStart = performance.now();
            startTurboCountdown(turboCountdown);
        }
    } else if (game.systemPaused && !game.userPaused) {
        // SYSTEM PAUSED, USER UNPAUSED: restart countdowns
        if (readyCountdown > 0) {
            readyCountdownStart = performance.now();
            startCountdown(readyCountdown);
        }
        if (feedbackCountdown > 0) {
            feedbackCountdownStart = performance.now();
            startFeedbackCountdown(feedbackCountdown);
        }
        if (turboCountdown > 0) {
            turboCountdownStart = performance.now();
            startTurboCountdown(turboCountdown);
        }
    } else { // USER PAUSED (or both): do nothing, everything should be stopped
    }
}

// --- Game Flow Control ---

window.initGame = function(baseSpeed = 200) {
    resetGameState();
    game.score = 0;
    game.lives = 3;
    game.level = 1;
    game.foodCount = 0;
    game.initialSpeed = baseSpeed;
    game.speed = baseSpeed;
    game.baseSpeed = baseSpeed;
    game.highScore = parseInt(localStorage.getItem('catSnakeHighScore') || '0', 10);
    game.started = true;
    game.lastFrameTime = performance.now(); // Initialize for logic updates
    game.lastRenderTime = performance.now(); // Initialize for rendering updates
    
    // Reset background animation speed
    game.backgroundAnimationDuration = 15;
    document.body.style.animationDuration = '15s';

    if (particleContainer) {
        updateParticleSpeed(1);
    }

    spawnFood();
    updateUI();
    draw();
    createLitterTexture();
    drawLegendItems();    // Draw legend items after canvas and ctx are ready
    showReady();
}

function startCountdown(duration) {
    readyTimeoutId = setTimeout(() => {
        readyTimeoutId = null;
        readyCountdown = 0;
        game.systemPaused = false;
        updatePauseState();
    }, duration);
}

function startFeedbackCountdown(duration) {
    feedbackTimeoutId = setTimeout(() => {
        feedbackTimeoutId = null;
        feedbackCountdown = 0;
        if (feedbackCallback) feedbackCallback();
        feedbackCallback = null;
    }, duration);
}

function startTurboCountdown(duration) {
    featherTimerId = setTimeout(() => {
        featherTimerId = null;
        turboCountdown = 0;
        window.restoreNormalSpeed();
    }, duration);
}

function showReady() {
    playSound('ready');
    game.systemPaused = true;
    updatePauseState();
    
    readyCountdown = 2000;
    readyCountdownStart = performance.now();

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Ready!', canvas.width / 2, canvas.height / 2);
    
    startCountdown(readyCountdown);
}

function update() {
    updateGameLogic();
    updateUI();
}

window.loseLife = function(msg) {
    game.lives--;
    playSound('lose_life');
    if (game.isTurbo) {
        window.restoreNormalSpeed(true);
    }
    game.systemPaused = true;
    updatePauseState();

    game.feedbackMessage = msg; 
    game.feedbackStartTime = performance.now(); 
    draw(game.feedbackStartTime);
    
    if (game.lives <= 0) {
        feedbackCallback = () => {
            endGame();
            game.feedbackMessage = null;
        };
    } else {
        feedbackCallback = () => {
            game.feedbackMessage = null; 
            resetGameState();
            game.started = true; 
            spawnFood();
            showReady();
        };
    }
    
                                            feedbackCountdown = 1500;
    
                                            feedbackCountdownStart = performance.now();
    
                                            startFeedbackCountdown(feedbackCountdown);
    
                                            updateUI(); // Update UI after life is lost
}

function endGame() {
    game.gameOver = true;
    game.systemPaused = false;
    game.userPaused = false;
    updatePauseState();
    stopGameLoops();
    playSound('game_over');

    // Wait 3 seconds and then play the intro song.
    game.introMusicTimeoutId = setTimeout(() => {
        window.playIntroSound();
    }, 3000);

    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('catSnakeHighScore', game.highScore);
    }
    
    document.getElementById('finalScore').textContent = `Your Score: ${game.score}`;
    document.getElementById('highScoreDisplay').textContent = `High: ${game.highScore}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

window.checkLevelUp = function() {
    const threshold = game.level * 5000;
    if (game.score >= threshold) {
        game.level++;
        game.backgroundAnimationDuration *= 0.75;
        document.body.style.animationDuration = game.backgroundAnimationDuration + 's';
        const maxSpeed = 20;
        const newSpeed = 1 + (game.level - 1) * 1.5;
        updateParticleSpeed(Math.min(newSpeed, maxSpeed));
        playSound('yay');
        game.baseSpeed = Math.max(50, game.initialSpeed - (game.level - 1) * 15);
        game.speed = game.baseSpeed;
        if (game.isTurbo) {
            window.restoreNormalSpeed(true); // Properly end turbo mode
        }
        
        game.systemPaused = true;
        updatePauseState();
        game.feedbackMessage = `Great - Level ${game.level}! 🚀`; 
        game.feedbackStartTime = performance.now(); 
        draw(game.feedbackStartTime);
        
        feedbackCallback = () => {
            game.feedbackMessage = null; 
            resetGameState();
            game.started = true;
            spawnFood();
            showReady();
        };
        
        feedbackCountdown = 2000;
        feedbackCountdownStart = performance.now();
        startFeedbackCountdown(feedbackCountdown);
    }
}

window.activateTurbo = function() {
    if (featherTimerId) { clearTimeout(featherTimerId); } // Clear any existing timer
    
    game.isTurbo = true;
    game.speed = game.baseSpeed * 0.75; 
    startMouseLogic(); 
    
    game.feedbackMessage = `ZOOMIES!`;
    game.feedbackStartTime = performance.now(); 
    
    turboCountdown = 5000;
    turboCountdownStart = performance.now();
    startTurboCountdown(turboCountdown);
}

window.restoreNormalSpeed = function(silent = false) {
    if (featherTimerId) { clearTimeout(featherTimerId); featherTimerId = null; }
    turboCountdown = 0;

    game.isTurbo = false;
    game.speed = game.baseSpeed; 
    
    if (!silent) {
        game.feedbackMessage = `Speed Restored.`;
        game.feedbackStartTime = performance.now(); 
        
        setTimeout(() => { game.feedbackMessage = null; game.feedbackStartTime = 0; }, 1000);
    } else {
        // When silent, clear the ZOOMIES! message if it's the one present.
        if (game.feedbackMessage === `ZOOMIES!`) {
            game.feedbackMessage = null;
            game.feedbackStartTime = 0;
        }
    }

    startMouseLogic(); 
}

window.togglePause = function() {
    if (game.gameOver) return;
    game.userPaused = !game.userPaused;
    updatePauseState();
}

function updateUI() {
    document.getElementById('score').children[0].textContent = `Score: ${game.score}`;
    document.getElementById('score').children[1].textContent = `High: ${game.highScore}`;
    document.getElementById('level').textContent = `Level: ${game.level}`;
    document.getElementById('lives').textContent = `${'🐱'.repeat(Math.max(0, game.lives))}`;
}

function startGame(speed) {
    game.lastGameSpeed = speed; // Remember the last speed
    // Stop the delayed intro music if it's scheduled
    if (game.introMusicTimeoutId) {
        clearTimeout(game.introMusicTimeoutId);
        game.introMusicTimeoutId = null;
    }
    window.stopIntroSound();
    document.getElementById('startScreen').classList.add('hidden');
    window.initGame(speed);
}

document.getElementById('startNormalBtn').addEventListener('click', () => startGame(200));
document.getElementById('startRelaxedBtn').addEventListener('click', () => startGame(245));

document.getElementById('restartBtn').addEventListener('click', () => {
    // Stop the delayed intro music if it's scheduled
    if (game.introMusicTimeoutId) {
        clearTimeout(game.introMusicTimeoutId);
        game.introMusicTimeoutId = null;
    }
    // Stop the intro sound if it's playing
    window.stopIntroSound();

    document.getElementById('gameOverScreen').classList.add('hidden');
    // We don't reset the entire game state, just re-init the game
    window.initGame(game.lastGameSpeed);
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    // Allow pausing anytime except game over.
    // The feedback message check is removed to allow pausing on "oops" screens.
    if (game.started && !game.gameOver) {
        window.togglePause();
    }
});

document.getElementById('muteBtn').addEventListener('click', () => {
    game.muted = !game.muted;
    document.getElementById('muteBtn').textContent = game.muted ? '🔇' : '🔊';
    localStorage.setItem('catSnakeMuted', game.muted);
    if (!game.started || game.gameOver) {
        if (game.muted) {
            window.stopIntroSound();
        } else {
            window.playIntroSound();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('startScreen');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const clickToStartOverlay = document.getElementById('clickToStartOverlay');

    // Show loading overlay
    loadingOverlay.classList.remove('hidden');

    // Set initial mute button state
    document.getElementById('muteBtn').textContent = game.muted ? '🔇' : '🔊';

    initInput();
    createLitterTexture();
    drawLegendItems();
    initParticles();

    preloadSounds().then(() => {
        // Sounds loaded, hide loading and show click to start overlay
        loadingOverlay.classList.add('hidden');
        clickToStartOverlay.classList.remove('hidden');
    }).catch(error => {
        console.error("Failed to preload sounds:", error);
        // Even if sounds fail, show the start screen so the game is playable
        loadingOverlay.innerHTML = '<h1>Error loading sounds.</h1>';
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            startScreen.classList.remove('hidden');
        }, 2000);
    });

    clickToStartOverlay.addEventListener('click', () => {
        clickToStartOverlay.classList.add('hidden');
        startScreen.classList.remove('hidden');
        window.playIntroSound();
    });
});

async function initParticles() {
    // tsParticles is loaded globally via the script tag in index.html
    if (typeof tsParticles === "undefined") {
        console.error("tsParticles not loaded. Check the script tag in index.html.");
        return;
    }

    particleContainer = await tsParticles.load({
        id: "tsparticles",
        options: {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        area: 800
                    },
                },
                color: {
                    value: "#ffffff",
                },
                shape: {
                    type: "circle",
                },
                opacity: {
                    value: 0.6,
                },
                size: {
                    value: { min: 2, max: 4 },
                },
                links: {
                    enable: true,
                    distance: 150,
                    color: "#ffffff",
                    opacity: 0.5,
                    width: 2,
                },
                move: {
                    enable: true,
                    speed: 1,
                    direction: "none",
                    random: true,
                    straight: false,
                    outModes: {
                        default: "out"
                    },
                },
            },
            interactivity: {
                detectsOn: "window",
                events: {
                    onHover: {
                        enable: false,
                        mode: "repulse",
                    },
                    onClick: {
                        enable: false,
                        mode: "push",
                    },
                    resize: true,
                },
            },
            detectRetina: true,
            background: {
                color: {
                    value: "transparent"
                }
            }
        },
    });
}

function updateParticleSpeed(speed) {
    if (particleContainer) {
        const options = particleContainer.options;
        options.particles.move.speed = speed;
        particleContainer.refresh();
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // --- TAB HIDDEN ---
        
        // 1. Pause the Game Logic
        // We use 'systemPaused' so we don't overwrite the user's manual pause state.
        if (game.started && !game.gameOver) {
            game.systemPaused = true;
            updatePauseState();
        }

        // 2. Silence the Music
        // The intro music is the main culprit for background noise.
        // We stop it here.
        window.stopIntroSound();

    } else {
        // --- TAB VISIBLE ---

        // 1. Resume the Game Logic
        // Only unpause if the USER didn't pause it themselves.
        if (game.started && !game.gameOver && game.systemPaused) {
            game.systemPaused = false;
            
            // CRITICAL: reset the clock to prevent the "Fast Forward" crash
            // (updatePauseState handles this reset internally, but good to be explicit)
            game.lastFrameTime = performance.now(); 
            game.lag = 0;
            
            updatePauseState();
            
            // Optional: Show "Ready!" again so they don't die instantly
            showReady(); 
        }

        // 2. Resume Music (If applicable)
        // If we are on the Start Screen or Game Over screen, the music should be playing.
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        
        // If either screen is visible (not hidden), restart the music
        if (!startScreen.classList.contains('hidden') || !gameOverScreen.classList.contains('hidden')) {
             window.playIntroSound();
        }
    }
});
