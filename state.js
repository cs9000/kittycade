let game = {
    snake: initialSnake(),
    direction: {x: 0, y: -1},
    nextDirection: {x: 0, y: -1},
    inputBuffer: [],
    food: null, litterBox: null, treat: null, catBed: null, mouse: null, catnip: null, dog: null, 
    score: 0,
    highScore: parseInt(localStorage.getItem('catSnakeHighScore') || '0', 10),
    lives: 3, level: 1, foodCount: 0,
    speed: 200, 
    paused: false, userPaused: false, systemPaused: false,
    gameOver: false, muted: JSON.parse(localStorage.getItem('catSnakeMuted') || 'false'), animating: false, started: false,
    lastFrameTime: 0, lag: 0,
    lastRenderTime: 0,
    nextHeadPos: null, feedbackMessage: null, feedbackStartTime: 0, 
    zHead: null, zStream: [], zDirection: -1, shouldAnimateSleep: false,
    arfHead: null, arfStream: [], arfDirection: -1, shouldAnimateArf: false,
    savedSnakeState: null,
    mouseLastLogicTime: 0,
    baseSpeed: 200,
    initialSpeed: 200, 
    isTurbo: false,
    introMusicTimeoutId: null,
    lastGameSpeed: 200,
};

function resetGameState() {
    // --- BOARD RESET ONLY ---
    // We do NOT reset Score, Lives, Level, or Speed here anymore.
    // Those are preserved so they carry over after death or level up.
    
    game.snake = initialSnake();
    game.direction = {x: 0, y: -1};
    game.nextDirection = {x: 0, y: -1};
    game.inputBuffer = [];
    
    // Clear items
    game.food = null;
    game.litterBox = null;
    game.treat = null;
    game.catBed = null;
    game.mouse = null;
    game.catnip = null; 
    game.dog = null;
    
    // Reset flags
    game.paused = false;
    game.userPaused = false;
    game.systemPaused = false;
    game.gameOver = false;
    game.animating = false;
    game.started = false; // Logic loop waits for "Ready"
    
    // Reset timers/visuals
    game.lastFrameTime = 0;
    game.lastRenderTime = 0;
    game.lag = 0;
    game.nextHeadPos = null;
    game.feedbackMessage = null;
    game.feedbackStartTime = 0;
    game.zHead = null;
    game.zStream = [];
    game.zDirection = -1;
    game.shouldAnimateSleep = false;
    game.arfHead = null;
    game.arfStream = [];
    game.arfDirection = -1;
    game.shouldAnimateArf = false;
    game.mouseLastLogicTime = 0;
    game.isTurbo = false;
}