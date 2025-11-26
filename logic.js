let zIntervalId = null;

function getEmptyCells() {
    const empty = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (!isOccupied(x, y)) empty.push({x, y});
        }
    }
    return empty;
}

function isOccupied(x, y) {
    if (game.snake.some(seg => seg.x === x && seg.y === y)) return true;
    if (game.nextHeadPos && game.nextHeadPos.x === x && game.nextHeadPos.y === y) return true; 
    if (game.food && game.food.x === x && game.food.y === y) return true;
    if (game.litterBox && game.litterBox.x === x && game.litterBox.y === y) return true;
    if (game.treat && game.treat.x === x && game.treat.y === y) return true;
    if (game.catBed && game.catBed.x === x && game.catBed.y === y) return true;
    if (game.catnip && game.catnip.x === x && game.catnip.y === y) return true; 
    if (game.mouse && game.mouse.x === x && game.mouse.y === y) return true;
    return false;
}

function spawnFood() {
    const empty = getEmptyCells();
    if (empty.length > 0) game.food = empty[Math.floor(Math.random() * empty.length)];
}

function spawnLitterBox() {
    if (game.litterBox) return;
    const empty = getEmptyCells();
    if (empty.length > 0) game.litterBox = empty[Math.floor(Math.random() * empty.length)];
}

function spawnTreat() {
    if (game.treat || Math.random() > 0.3) return;
    const empty = getEmptyCells();
    if (empty.length > 0) game.treat = empty[Math.floor(Math.random() * empty.length)];
}

function spawnCatBed() {
    if (game.catBed || Math.random() > 0.1) return;
    const empty = getEmptyCells();
    if (empty.length > 0) game.catBed = empty[Math.floor(Math.random() * empty.length)];
}

function spawnMouse() {
    if (game.mouse || Math.random() > 0.15) return; 
    const empty = getEmptyCells();
    if (empty.length > 0) {
        const newPos = empty[Math.floor(Math.random() * empty.length)];
        game.mouse = { x: newPos.x, y: newPos.y, px: newPos.x, py: newPos.y, lastMoveTimestamp: performance.now() };
    }
}

function spawnCatnip() {
    if (game.catnip || Math.random() > 0.05) return; 
    const empty = getEmptyCells();
    if (empty.length > 0) game.catnip = empty[Math.floor(Math.random() * empty.length)];
}

function moveMouse() {
    if (!game.mouse) return;
    game.mouse.px = game.mouse.x;
    game.mouse.py = game.mouse.y;
    const dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
    const moves = [];
    for (const d of dirs) {
        const nx = game.mouse.x + d.x;
        const ny = game.mouse.y + d.y;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !isOccupied(nx, ny)) {
            moves.push({x: nx, y: ny});
        }
    }
    if (moves.length > 0) {
        const newPos = moves[Math.floor(Math.random() * moves.length)];
        game.mouse.x = newPos.x;
        game.mouse.y = newPos.y;
        game.mouse.lastMoveTimestamp = performance.now();
    }
}

function animateSleep(head) {
    game.animating = true;
    game.zHead = {x: head.x, y: head.y}; 
    game.zDirection = head.y < 2 ? 1 : -1; 
    const MAX_Z = 6;
    let zCount = 0;
    
    if (zIntervalId) clearInterval(zIntervalId);
    zIntervalId = setInterval(() => {
        game.zStream.push({ 
            offsetY: 0, offsetX: 0, startOffsetX: (Math.random() * 20 - 10) * game.zDirection, alpha: 1
        });
        zCount++;
        if (zCount >= MAX_Z) {
            clearInterval(zIntervalId);
            zIntervalId = null;
            setTimeout(() => {
                game.animating = false; 
                game.zHead = null;
                game.zStream = []; 
            }, 1000); 
        }
    }, 300); 
}

function updateGameLogic() {
    if (game.gameOver || game.paused || game.animating) return; 
    if (game.snake.length === 0) { window.loseLife("Fatal error: Cat vanished!"); return; }

    if (game.inputBuffer.length > 0) {
        const bufferedDir = game.inputBuffer.shift();
        if ((bufferedDir.x !== 0 && game.direction.x === 0) || 
            (bufferedDir.y !== 0 && game.direction.y === 0)) {
            game.nextDirection = bufferedDir;
        }
    }
    
    game.direction = {...game.nextDirection};
    const oldHead = game.snake[0]; 
    const tx = oldHead.x + game.direction.x;
    const ty = oldHead.y + game.direction.y;
    game.nextHeadPos = {x: tx, y: ty}; 

    // Collisions
    if (tx < 0 || tx >= GRID_SIZE || ty < 0 || ty >= GRID_SIZE) {
        window.loseLife("Oops! You hit the wall!"); 
        game.nextHeadPos = null; 
        return;
    }
    if (game.snake.slice(1).some(seg => seg.x === tx && seg.y === ty)) {
        window.loseLife("You ran into yourself!"); 
        game.nextHeadPos = null; 
        return;
    }

    let isGrowing = false;
    let isShrinking = false;

    // Interactions
    if (game.food && tx === game.food.x && ty === game.food.y) {
        game.score += 100; game.foodCount++; game.food = null;
        playSound('food');
        spawnFood();
        if (Math.random() < 0.33) spawnLitterBox(); 
        spawnTreat(); spawnCatBed(); spawnMouse(); spawnCatnip();
        isGrowing = true;
    }
    else if (game.treat && tx === game.treat.x && ty === game.treat.y) {
        game.score += 300; game.treat = null; playSound('treat');
    }
    else if (game.catBed && tx === game.catBed.x && ty === game.catBed.y) {
        game.score += 200; game.catBed = null;
        playSound('bed');
        game.shouldAnimateSleep = true; 
        if (game.isTurbo) window.restoreNormalSpeed(); 
    }
    else if (game.litterBox && tx === game.litterBox.x && ty === game.litterBox.y) {
        game.score += 100; isShrinking = true; game.litterBox = null;
        playSound('litter');
    }
    else if (game.mouse && tx === game.mouse.x && ty === game.mouse.y) {
        game.score += 500; game.mouse = null; isGrowing = true; 
        playSound('mouse');
    }
    else if (game.catnip && tx === game.catnip.x && ty === game.catnip.y) {
        game.score += 1000; game.catnip = null;
        playSound('catnip');
        window.activateTurbo(); 
    }

    // Move Body
    game.snake.forEach(seg => { seg.px = seg.x; seg.py = seg.y; });
    for (let i = game.snake.length - 1; i >= 1; i--) {
        game.snake[i].x = game.snake[i-1].x;
        game.snake[i].y = game.snake[i-1].y;
    }
    game.snake[0].x = tx;
    game.snake[0].y = ty;

    // Handle Length
    if (isGrowing) {
        const last = game.snake[game.snake.length - 1];
        game.snake.push({ x: last.px, y: last.py, px: last.px, py: last.py });
    } else if (isShrinking) {
        if (game.snake.length > 3) {
            const rem = Math.min(game.snake.length - 3, 3);
            game.snake.length -= rem;
        }
    } 
    
    // Animations
    if (game.shouldAnimateSleep) {
        animateSleep(game.snake[0]); 
        game.shouldAnimateSleep = false;
    }

    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('catSnakeHighScore', game.highScore);
    }

    game.nextHeadPos = null; 
    window.checkLevelUp();
    updateUI(); // Update UI after game logic, including score changes
}