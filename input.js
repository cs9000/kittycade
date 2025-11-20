function initInput() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');

        if (!game.started && !startScreen.classList.contains('hidden')) {
            startScreen.classList.add('hidden');
            window.initGame();
            return;
        }
        
        if (game.gameOver && !gameOverScreen.classList.contains('hidden')) {
            gameOverScreen.classList.add('hidden');
            window.initGame();
            return;
        }
        
        if (e.key === ' ' || e.key.toLowerCase() === 'p') {
            if (game.started && !game.gameOver && !game.animating && !game.feedbackMessage) { 
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
    
    // Touch
    const canvas = document.getElementById('gameCanvas');
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault(); 
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        if (!game.started || game.paused || game.gameOver) return; 
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        let newDir = null;
        
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
            newDir = dx > 0 ? {x: 1, y: 0} : {x: -1, y: 0};
        } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD) {
            newDir = dy > 0 ? {x: 0, y: 1} : {x: 0, y: -1};
        }
        
        if (newDir) pushDirection(newDir);
        e.preventDefault();
    }, { passive: false });
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