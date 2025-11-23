let logicLoopId = null; 
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
document.getElementById('controlText').textContent = isTouchDevice 
    ? 'Swipe to change direction' 
    : 'Use Arrow Keys or WASD to move';

createLitterTexture();
drawLegendItems();

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

        if (!game.paused) {
            const deltaTime = currentTime - game.lastFrameTime;
            game.lastFrameTime = currentTime;
            game.lag += deltaTime;
    
            while (game.lag >= game.speed) {
                game.snake.forEach(seg => { seg.px = seg.x; seg.py = seg.y; });
                updateGameLogic();
                game.lag -= game.speed;
            }
        } else { // If paused, just update lastFrameTime to prevent huge lag accumulation on unpause
            game.lastFrameTime = currentTime;
        }
    
        // Always render, even when paused (for feedback messages, pause overlay, animations)
        const interpolationFactor = game.lag / game.speed;
        draw(interpolationFactor);    animationFrameId = requestAnimationFrame(gameLoop);
}

function updatePauseState() {
    const wasReadyRunning = readyTimeoutId != null;
    const wasFeedbackRunning = feedbackTimeoutId != null;
    const wasTurboRunning = featherTimerId != null;

    game.paused = game.userPaused || game.systemPaused;

    // 1. Stop everything and update UI
    stopGameLoops();
    document.getElementById('pauseOverlay').classList.toggle('hidden', !game.userPaused);
    document.getElementById('pauseBtn').textContent = game.userPaused ? '▶️ Resume' : '⏸ Pause';

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

window.initGame = function() {
    resetGameState();
    game.score = 0;
    game.lives = 3;
    game.level = 1;
    game.foodCount = 0;
    game.speed = 200;
    game.baseSpeed = 200;
    game.started = true;
    spawnFood();
    updateUI();
    draw();
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
    game.systemPaused = true;
    updatePauseState();
    
    readyCountdown = 2000;
    readyCountdownStart = performance.now();

    draw();
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
    playSound('lose');
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
    
                    startFeedbackCountdown(feedbackCountdown);}

function endGame() {
    game.gameOver = true;
    game.systemPaused = false;
    game.userPaused = false;
    updatePauseState();
    stopGameLoops();

    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('catSnakeHighScore', game.highScore);
    }
    
    document.getElementById('finalScore').textContent = `Your Score: ${game.score}`;
    document.getElementById('highScoreDisplay').textContent = `High Score: ${game.highScore}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

window.checkLevelUp = function() {
    const threshold = game.level * 5000;
    if (game.score >= threshold) {
        game.level++;
        game.baseSpeed = Math.max(50, 200 - (game.level - 1) * 15);
        game.speed = game.baseSpeed;
        if (game.isTurbo) {
            window.restoreNormalSpeed(); // Properly end turbo mode
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
    game.speed = 120; 
    startMouseLogic(); 
    
    game.feedbackMessage = `TURBO BOOST!`;
    game.feedbackStartTime = performance.now(); 
    
    turboCountdown = 5000;
    turboCountdownStart = performance.now();
    startTurboCountdown(turboCountdown);
}

window.restoreNormalSpeed = function() {
    if (featherTimerId) { clearTimeout(featherTimerId); featherTimerId = null; }
    turboCountdown = 0;

    game.isTurbo = false;
    game.speed = game.baseSpeed; 
    game.feedbackMessage = `Speed Restored.`;
    game.feedbackStartTime = performance.now(); 
    
    setTimeout(() => { game.feedbackMessage = null; game.feedbackStartTime = 0; }, 1000);

    startMouseLogic(); 
}

window.togglePause = function() {
    if (game.gameOver) return;
    game.userPaused = !game.userPaused;
    updatePauseState();
}

function updateUI() {
    document.getElementById('score').textContent = `Score: ${game.score}`;
    document.getElementById('level').textContent = `Level: ${game.level}`;
    document.getElementById('lives').textContent = `Lives: ${'🐱'.repeat(Math.max(0, game.lives))}`;
}

document.getElementById('startBtn').addEventListener('click', () => {
    document.getElementById('startScreen').classList.add('hidden');
    window.initGame();
});

document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('gameOverScreen').classList.add('hidden');
    window.initGame();
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
    document.getElementById('muteBtn').textContent = game.muted ? '🔇 Muted' : '🔊 Sound';
});

initInput();