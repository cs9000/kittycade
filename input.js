function initInput() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'h') {
            if (game.started && !game.gameOver && !game.paused) {
                game.highScore = 0;
                localStorage.setItem('catSnakeHighScore', '0');
                updateUI();
                e.preventDefault();
                return;
            }
        }

        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');


        if (game.gameOver && !gameOverScreen.classList.contains('hidden')) {
            gameOverScreen.classList.add('hidden');
            window.initGame();
            return;
        }
        
        if (e.key === ' ' || e.key.toLowerCase() === 'p') {
            if (game.started && !game.gameOver) { 
                window.togglePause();
            }
            e.preventDefault();
            return;
        }
        
        if (!game.started || game.gameOver || game.paused) return; 
        
        const key = e.key.toLowerCase();
        let newDir = null;
        
        if (key === 'arrowup' || key === 'w') newDir = {x: 0, y: -1};
        else if (key === 'arrowdown' || key === 's') newDir = {x: 0, y: 1};
        else if (key === 'arrowleft' || key === 'a') newDir = {x: -1, y: 0};
        else if (key === 'arrowright' || key === 'd') newDir = {x: 1, y: 0};
        
        if (newDir) pushDirection(newDir);
        if (newDir) e.preventDefault();
    });
    
    setupMobileControls();
}

function setupMobileControls() {
    const directions = {
        'btn-up': {x: 0, y: -1},
        'btn-down': {x: 0, y: 1},
        'btn-left': {x: -1, y: 0},
        'btn-right': {x: 1, y: 0}
    };

    Object.keys(directions).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!game.started || game.paused || game.gameOver) return;
                pushDirection(directions[id]);
            });
        }
    });
}

function pushDirection(newDir) {
    const currentDir = game.inputBuffer.length > 0 
        ? game.inputBuffer[game.inputBuffer.length - 1] 
        : game.direction;
    
    if ((newDir.x !== 0 && currentDir.x === 0) || (newDir.y !== 0 && currentDir.y === 0)) {
        if (game.inputBuffer.length < 2) {
            game.inputBuffer.push(newDir);
        }
    }
}