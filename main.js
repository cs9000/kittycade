let logicLoopId = null; 
let animationFrameId = null;
let mouseLogicId = null;
let featherTimerId = null; 
let readyTimeoutId = null;

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
document.getElementById('controlText').textContent = isTouchDevice 
    ? 'Swipe to change direction' 
    : 'Use Arrow Keys or WASD to move';

createLitterTexture();
drawLegendItems();

function stopTimedIntervals() {
    if (logicLoopId) { clearInterval(logicLoopId); logicLoopId = null; }
    if (mouseLogicId) { clearInterval(mouseLogicId); mouseLogicId = null; }
    if (readyTimeoutId) { clearTimeout(readyTimeoutId); readyTimeoutId = null; }
}

function clearTurboTimer() {
    if (featherTimerId) { clearTimeout(featherTimerId); featherTimerId = null; }
}

function stopGameLoops() {
    stopTimedIntervals();
    clearTurboTimer();
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
}

function startMouseLogic() {
    if (mouseLogicId) clearInterval(mouseLogicId);
    game.mouseLastLogicTime = performance.now();
    mouseLogicId = setInterval(() => {
        if (!game.paused && !game.gameOver) moveMouse();
    }, MOUSE_LOGIC_SPEED);
}

function renderLoop(timestamp) {
    if (!game.started || game.gameOver) return;
    if (!game.paused || game.animating || game.feedbackMessage) { 
        draw(timestamp); 
    }
    animationFrameId = requestAnimationFrame(renderLoop);
}

// --- Game Flow Control ---

// This function runs ONLY when clicking "Start Game" or "Play Again"
window.initGame = function() {
    resetGameState(); // Clears the board
    
    // --- STAT RESET ---
    // This is the only place we reset stats now
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

function showReady() {
    game.paused = true;
    draw();
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Ready!', canvas.width / 2, canvas.height / 2);
    
    readyTimeoutId = setTimeout(() => {
        game.paused = false;
        game.lastUpdateTimestamp = performance.now(); 
        game.lastDrawTimestamp = performance.now();   
        
        if (logicLoopId) clearInterval(logicLoopId); 
        logicLoopId = setInterval(update, game.speed);
        animationFrameId = requestAnimationFrame(renderLoop);
        startMouseLogic(); 

        readyTimeoutId = null;
    }, 2000);
}

function update() {
    updateGameLogic();
    updateUI();
}

window.loseLife = function(msg) {
    game.lives--; // Decrement life
    playSound('lose');
    game.paused = true; 
    game.feedbackMessage = msg; 
    game.feedbackStartTime = performance.now(); 
    stopGameLoops(); 
    draw(game.feedbackStartTime);
    
    if (game.lives <= 0) {
        // No lives left? Game Over.
        setTimeout(() => {
            endGame();
            game.feedbackMessage = null;
            game.feedbackStartTime = 0; 
        }, 1500); 
    } else {
        // Lives remaining? Reset board, but KEEP stats.
        setTimeout(() => {
            game.feedbackMessage = null; 
            game.feedbackStartTime = 0; 
            
            resetGameState(); // Only resets positions, not lives
            game.started = true; 
            
            spawnFood();
            showReady();
        }, 1500); 
    }
}

function endGame() {
    game.gameOver = true;
    stopGameLoops();
    game.paused = false;
    document.getElementById('pauseOverlay').classList.add('hidden');
    document.getElementById('pauseBtn').textContent = '⏸ Pause';
    
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
        if (!game.isTurbo) game.speed = game.baseSpeed;
        
        stopGameLoops();
        game.paused = true;
        game.feedbackMessage = `Great - Level ${game.level}! 🚀`; 
        game.feedbackStartTime = performance.now(); 
        draw(game.feedbackStartTime);
        
        setTimeout(() => {
            game.feedbackMessage = null; 
            game.feedbackStartTime = 0; 
            
            // Reset board, but KEEP stats (Level/Score/Lives)
            resetGameState();
            game.started = true;

            spawnFood();
            showReady();
        }, 2000); 
    }
}

window.activateTurbo = function() {
    clearTurboTimer();
    game.isTurbo = true;
    game.speed = 120; 
    stopTimedIntervals(); 
    logicLoopId = setInterval(update, game.speed); 
    startMouseLogic(); 
    
    game.feedbackMessage = `🌿 CATNIP TURBO BOOST! (5s) 🌿`;
    game.feedbackStartTime = performance.now(); 
    featherTimerId = setTimeout(window.restoreNormalSpeed, 5000); 
}

window.restoreNormalSpeed = function() {
    clearTurboTimer();
    game.isTurbo = false;
    game.speed = game.baseSpeed; 
    game.feedbackMessage = `Speed Restored.`;
    game.feedbackStartTime = performance.now(); 
    
    setTimeout(() => { game.feedbackMessage = null; game.feedbackStartTime = 0; }, 1000);

    stopTimedIntervals(); 
    logicLoopId = setInterval(update, game.speed); 
    startMouseLogic(); 
}

window.togglePause = function() {
    game.paused = !game.paused;
    document.getElementById('pauseOverlay').classList.toggle('hidden', !game.paused);
    document.getElementById('pauseBtn').textContent = game.paused ? '▶️ Resume' : '⏸ Pause';

    if (game.paused) {
        stopGameLoops(); 
    } else {
        game.lastUpdateTimestamp = performance.now();
        game.lastDrawTimestamp = performance.now();
        logicLoopId = setInterval(update, game.speed);
        animationFrameId = requestAnimationFrame(renderLoop);
        startMouseLogic(); 
    }
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
    if (game.started && !game.gameOver && !game.animating && !game.feedbackMessage) window.togglePause();
});

document.getElementById('muteBtn').addEventListener('click', () => {
    game.muted = !game.muted;
    document.getElementById('muteBtn').textContent = game.muted ? '🔇 Muted' : '🔊 Sound';
});

initInput();