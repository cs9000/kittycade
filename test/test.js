function runTests() {
    console.log("Running tests...");
    testTurboResetOnLifeLost();
    console.log("Tests finished.");
}

function testTurboResetOnLifeLost() {
    console.log("testTurboResetOnLifeLost: START");
    // 1. Setup initial state
    window.initGame();
    game.started = true;
    game.lives = 3;
    game.baseSpeed = 200;
    game.speed = 200;
    
    // 2. Activate Turbo
    window.activateTurbo();
    console.assert(game.isTurbo === true, "Turbo should be active");
    console.assert(game.speed === 120, "Speed should be turbo speed");

    // 3. Lose a life
    window.loseLife("test collision");

    // 4. Assertions
    console.assert(game.isTurbo === false, "Turbo should be inactive after losing a life");
    console.assert(game.speed === game.baseSpeed, "Speed should be reset to base speed");
    console.assert(game.lives === 2, "Lives should be decremented");

    console.log("testTurboResetOnLifeLost: END");
}

// We need to wait for the game to be initialized
window.addEventListener('load', () => {
    // The game automatically initializes, but we can re-init for a clean slate
    runTests();
});