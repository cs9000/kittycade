

let litterTextureCanvas = null;

function createLitterTexture() {
    const CELL_SIZE = 40; // Base size for calculation
    const padding = 6;
    const sandW = CELL_SIZE - (padding * 2) - 8;
    const sandH = CELL_SIZE - (padding * 2) - 8;

    litterTextureCanvas = document.createElement('canvas');
    litterTextureCanvas.width = sandW;
    litterTextureCanvas.height = sandH;
    const tCtx = litterTextureCanvas.getContext('2d');

    // We only need to draw the sand and dots to the texture
    tCtx.fillStyle = '#F5CBA7'; // Sand color
    tCtx.beginPath();
    if (tCtx.roundRect) {
        tCtx.roundRect(0, 0, sandW, sandH, 4); // Draw at (0,0) in the small canvas
    } else {
        tCtx.rect(0, 0, sandW, sandH);
    }
    tCtx.fill();

    // Add Texture (Grains of litter)
    tCtx.fillStyle = '#D35400'; // Darker orange/brown specks
    for (let i = 0; i < 8; i++) {
        const dotX = Math.random() * sandW;
        const dotY = Math.random() * sandH;
        tCtx.fillRect(Math.floor(dotX), Math.floor(dotY), 2, 2);
    }

    tCtx.fillStyle = '#FDF2E9'; // Lighter specks
    for (let i = 0; i < 5; i++) {
        const dotX = Math.random() * sandW;
        const dotY = Math.random() * sandH;
        tCtx.fillRect(Math.floor(dotX), Math.floor(dotY), 2, 2);
    }
}


function drawLitterBoxGraphic(ctx, X, Y, W, H, isLegend) {
    ctx.save();
    const boxX = X;
    const boxY = Y;
    const CELL_SIZE = W; // Assuming W and H are the same
    const padding = 6;

    // 1. Draw the Tray (Blue Plastic Container)
    const grad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + CELL_SIZE);
    grad.addColorStop(0, '#5DADE2');
    grad.addColorStop(1, '#3498DB');

    ctx.fillStyle = grad;
    ctx.beginPath();

    if (ctx.roundRect) {
        ctx.roundRect(boxX + padding, boxY + padding, CELL_SIZE - (padding * 2), CELL_SIZE - (padding * 2), 8);
    } else {
        ctx.rect(boxX + padding, boxY + padding, CELL_SIZE - (padding * 2), CELL_SIZE - (padding * 2));
    }
    ctx.fill();

    // Border for the tray
    ctx.strokeStyle = '#2874A6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Draw the pre-rendered Sand and Texture
    if (litterTextureCanvas) {
        const sandX = boxX + padding + 4;
        const sandY = boxY + padding + 4;
        const sandW = CELL_SIZE - (padding * 2) - 8;
        const sandH = CELL_SIZE - (padding * 2) - 8;
        ctx.drawImage(litterTextureCanvas, sandX, sandY, sandW, sandH);
    }

    ctx.restore();
}

function drawDog(ctx) {
    if (!game.dog) return;
    const centerX = (game.dog.x + 0.5) * CELL_SIZE;
    const centerY = (game.dog.y + 0.5) * CELL_SIZE;
    ctx.fillText('🐕', centerX, centerY);
}

function draw(interpolationFactor, renderDeltaTime) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (game.food) {
        const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.15; // Oscillates ~0.85 to 1.15
        const centerX = (game.food.x + 0.5) * CELL_SIZE;
        const centerY = (game.food.y + 0.5) * CELL_SIZE;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(pulseScale, pulseScale);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐟', 0, 0); // Draw at origin of translated context
        ctx.restore();
    }
    if (game.litterBox) drawLitterBoxGraphic(ctx, game.litterBox.x * CELL_SIZE, game.litterBox.y * CELL_SIZE, CELL_SIZE, CELL_SIZE, false);
    if (game.catBed) ctx.fillText('🛏️', (game.catBed.x + 0.5) * CELL_SIZE, (game.catBed.y + 0.5) * CELL_SIZE);
    if (game.catnip) {
        const pulseScale = 1 + Math.sin(Date.now() / 100) * 0.15; // Faster pulse
        const centerX = (game.catnip.x + 0.5) * CELL_SIZE;
        const centerY = (game.catnip.y + 0.5) * CELL_SIZE;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(pulseScale, pulseScale);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌿', 0, 0);
        ctx.restore();
    }
    if (game.dog) drawDog(ctx);

    if (game.treat) {
        const centerX = (game.treat.x + 0.5) * CELL_SIZE;
        const centerY = (game.treat.y + 0.5) * CELL_SIZE;
        ctx.fillText('🧶', centerX, centerY);
    }

    if (game.mouse) {
        const mouseMovementPeriod = 500;
        const timeSinceMouseMove = performance.now() - game.mouse.lastMoveTimestamp;
        const mouseInterpolationFactor = Math.min(1, timeSinceMouseMove / mouseMovementPeriod);

        const currentX = game.mouse.px + (game.mouse.x - game.mouse.px) * mouseInterpolationFactor;
        const currentY = game.mouse.py + (game.mouse.y - game.mouse.py) * mouseInterpolationFactor;
        ctx.fillText('🐀', (currentX + 0.5) * CELL_SIZE, (currentY + 0.5) * CELL_SIZE);
    }

    game.snake.forEach((seg, index) => {
        const currentX = seg.px + (seg.x - seg.px) * interpolationFactor;
        const currentY = seg.py + (seg.y - seg.py) * interpolationFactor;
        const centerX = (currentX + 0.5) * CELL_SIZE;
        const centerY = (currentY + 0.5) * CELL_SIZE;

        if (index === 0) {
            drawCatHead(ctx, centerX, centerY, CELL_SIZE);
        } else if (index === game.snake.length - 1) {
            const tailColor = game.isTurbo ? '#66ffff' : '#ffb366';
            ctx.fillStyle = tailColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, (CELL_SIZE - 8) / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const bodyColor = game.isTurbo ? '#99ffff' : '#ffaa5a';
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, (CELL_SIZE - 6) / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    if (game.animating && game.zHead) {
        drawSleepAnimation(ctx, renderDeltaTime);
    }

    if (game.arfHead) {
        drawArfAnimation(ctx, renderDeltaTime);
    }

    if (game.feedbackMessage) {
        drawFeedback(ctx, performance.now());
    }
}

function drawCatHead(ctx, centerX, centerY, cellSize) {
    const faceRadius = (cellSize / 2) - 4;
    const catColor = game.isTurbo ? '#66ffff' : '#ff8c42';
    ctx.fillStyle = catColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, faceRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = catColor;
    if (game.direction.y === -1) {
        drawEar(ctx, centerX, centerY, faceRadius, -1, -1);
        drawEar(ctx, centerX, centerY, faceRadius, 1, -1);
    } else if (game.direction.y === 1) {
        drawEar(ctx, centerX, centerY, faceRadius, -1, 1);
        drawEar(ctx, centerX, centerY, faceRadius, 1, 1);
    } else if (game.direction.x === -1) {
        drawEar(ctx, centerX, centerY, faceRadius, -1, 1, true);
        drawEar(ctx, centerX, centerY, faceRadius, -1, -1, true);
    } else {
        drawEar(ctx, centerX, centerY, faceRadius, 1, 1, true);
        drawEar(ctx, centerX, centerY, faceRadius, 1, -1, true);
    }

    let eyeOffsetX = 0;
    let eyeOffsetY = -faceRadius * 0.2;
    if (game.direction.x === 1) { eyeOffsetX = faceRadius * 0.2; eyeOffsetY = 0; }
    else if (game.direction.x === -1) { eyeOffsetX = -faceRadius * 0.2; eyeOffsetY = 0; }
    else if (game.direction.y === 1) { eyeOffsetY = faceRadius * 0.2; }

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    if (game.direction.y !== 0) {
        ctx.arc(centerX - faceRadius * 0.35, centerY + eyeOffsetY, 6, 0, Math.PI * 2);
        ctx.arc(centerX + faceRadius * 0.35, centerY + eyeOffsetY, 6, 0, Math.PI * 2);
    } else {
        ctx.arc(centerX + eyeOffsetX, centerY - faceRadius * 0.25, 6, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffsetX, centerY + faceRadius * 0.25, 6, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = 'black';
    if (game.direction.y !== 0) {
        ctx.fillRect(centerX - faceRadius * 0.35 - 1, centerY + eyeOffsetY - 5, 2, 10);
        ctx.fillRect(centerX + faceRadius * 0.35 - 1, centerY + eyeOffsetY - 5, 2, 10);
    } else {
        ctx.fillRect(centerX + eyeOffsetX - 1, centerY - faceRadius * 0.25 - 5, 2, 10);
        ctx.fillRect(centerX + eyeOffsetX - 1, centerY + faceRadius * 0.25 - 5, 2, 10);
    }

    ctx.fillStyle = '#ffb3d9';
    ctx.beginPath();
    if (game.direction.y === -1) {
        ctx.moveTo(centerX, centerY - faceRadius * 0.05);
        ctx.lineTo(centerX - 3, centerY + faceRadius * 0.1);
        ctx.lineTo(centerX + 3, centerY + faceRadius * 0.1);
    } else if (game.direction.y === 1) {
        ctx.moveTo(centerX, centerY + faceRadius * 0.4);
        ctx.lineTo(centerX - 3, centerY + faceRadius * 0.25);
        ctx.lineTo(centerX + 3, centerY + faceRadius * 0.25);
    } else if (game.direction.x === -1) {
        ctx.moveTo(centerX - faceRadius * 0.05, centerY);
        ctx.lineTo(centerX + faceRadius * 0.1, centerY - 3);
        ctx.lineTo(centerX + faceRadius * 0.1, centerY + 3);
    } else {
        ctx.moveTo(centerX + faceRadius * 0.4, centerY);
        ctx.lineTo(centerX + faceRadius * 0.25, centerY - 3);
        ctx.lineTo(centerX + faceRadius * 0.25, centerY + 3);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (game.direction.y !== 0) {
        ctx.moveTo(centerX - faceRadius * 0.6, centerY - 5); ctx.lineTo(centerX - faceRadius * 1.5, centerY - 8);
        ctx.moveTo(centerX - faceRadius * 0.6, centerY); ctx.lineTo(centerX - faceRadius * 1.5, centerY);
        ctx.moveTo(centerX + faceRadius * 0.6, centerY - 5); ctx.lineTo(centerX + faceRadius * 1.5, centerY - 8);
        ctx.moveTo(centerX + faceRadius * 0.6, centerY); ctx.lineTo(centerX + faceRadius * 1.5, centerY);
    } else {
        ctx.moveTo(centerX - 5, centerY - faceRadius * 0.6); ctx.lineTo(centerX - 8, centerY - faceRadius * 1.5);
        ctx.moveTo(centerX, centerY - faceRadius * 0.6); ctx.lineTo(centerX, centerY - faceRadius * 1.5);
        ctx.moveTo(centerX + 5, centerY - faceRadius * 0.6); ctx.lineTo(centerX + 8, centerY - faceRadius * 1.5);
        ctx.moveTo(centerX, centerY + faceRadius * 0.6); ctx.lineTo(centerX, centerY + faceRadius * 1.5);
    }
    ctx.stroke();
}

function drawEar(ctx, cx, cy, r, sideX, sideY, isHorizontal) {
    ctx.fillStyle = game.isTurbo ? '#66ffff' : '#ff8c42';
    ctx.beginPath();
    if (!isHorizontal) {
        ctx.moveTo(cx + (sideX * r * 0.6), cy + (sideY * r * 0.4));
        ctx.lineTo(cx + (sideX * r * 0.8), cy + (sideY * r * 1.3));
        ctx.lineTo(cx + (sideX * r * 0.3), cy + (sideY * r * 0.7));
    } else {
        ctx.moveTo(cx + (sideX * r * 0.4), cy + (sideY * r * 0.6));
        ctx.lineTo(cx + (sideX * r * 1.3), cy + (sideY * r * 0.8));
        ctx.lineTo(cx + (sideX * r * 0.7), cy + (sideY * r * 0.3));
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffb3d9';
    ctx.beginPath();
    if (!isHorizontal) {
        ctx.moveTo(cx + (sideX * r * 0.55), cy + (sideY * r * 0.5));
        ctx.lineTo(cx + (sideX * r * 0.7), cy + (sideY * r * 1.1));
        ctx.lineTo(cx + (sideX * r * 0.4), cy + (sideY * r * 0.7));
    } else {
        ctx.moveTo(cx + (sideX * r * 0.5), cy + (sideY * r * 0.55));
        ctx.lineTo(cx + (sideX * r * 1.1), cy + (sideY * r * 0.7));
        ctx.lineTo(cx + (sideX * r * 0.7), cy + (sideY * r * 0.4));
    }
    ctx.closePath();
    ctx.fill();
}

function drawSleepAnimation(ctx, renderDeltaTime) {
    if (!game.paused) {
        const Z_SPEED = 40;
        const MAX_Z_OFFSET = 80;
        const dist = Z_SPEED * renderDeltaTime * game.zDirection;

        game.zStream.forEach(z => {
            z.offsetY += dist;
            const distance = Math.abs(z.offsetY);
            const progress = Math.min(1, distance / MAX_Z_OFFSET);
            z.offsetX = z.startOffsetX * (1 - progress);
            z.alpha = 1 - progress;
        });

        game.zStream = game.zStream.filter(z => Math.abs(z.offsetY) < MAX_Z_OFFSET);
    }

    const head = game.zHead;
    const cx = (head.x + 0.5) * CELL_SIZE;
    const cy = (head.y + 0.5) * CELL_SIZE;

    ctx.font = 'bold 24px Arial';
    game.zStream.forEach(z => {
        ctx.globalAlpha = z.alpha;
        ctx.fillStyle = '#667eea';
        ctx.fillText('Z', cx + z.offsetX, cy + z.offsetY);
    });
    ctx.globalAlpha = 1;
}

function drawArfAnimation(ctx, renderDeltaTime) {
    if (!game.paused) {
        const ARF_SPEED = 40;
        const MAX_ARF_OFFSET = 80;
        const dist = ARF_SPEED * renderDeltaTime * game.arfDirection;

        game.arfStream.forEach(arf => {
            arf.offsetY += dist;
            const distance = Math.abs(arf.offsetY);
            const progress = Math.min(1, distance / MAX_ARF_OFFSET);
            arf.offsetX = arf.startOffsetX * (1 - progress);
            arf.alpha = 1 - progress;
        });

        game.arfStream = game.arfStream.filter(arf => Math.abs(arf.offsetY) < MAX_ARF_OFFSET);
    }

    const head = game.arfHead;
    const cx = (head.x + 0.5) * CELL_SIZE;
    const cy = (head.y + 0.5) * CELL_SIZE;

    ctx.font = 'bold 18px Arial';
    game.arfStream.forEach(arf => {
        ctx.globalAlpha = arf.alpha;
        ctx.fillStyle = '#333';
        ctx.fillText(arf.text, cx + arf.offsetX, cy + arf.offsetY);
    });
    ctx.globalAlpha = 1;
}

function drawFeedback(ctx, timestamp) {
    const timeSinceFeedbackStart = timestamp - game.feedbackStartTime;
    const isCollision = game.feedbackMessage.includes("hit the wall") || game.feedbackMessage.includes("ran into yourself") || game.feedbackMessage.includes("Fatal");
    const isTurboOrRestore = game.feedbackMessage.includes("ZOOMIES") || game.feedbackMessage.includes("Speed Restored");

    if (!isTurboOrRestore) {
        if (isCollision && timeSinceFeedbackStart < 100) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    ctx.fillText(game.feedbackMessage, canvas.width / 2, canvas.height / 2);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawLegendItems() {
    const litterItem = document.getElementById('litterBoxLegendItem');
    if (litterItem) {
        const lCanv = document.createElement('canvas');
        lCanv.width = 40; lCanv.height = 40;
        const lCtx = lCanv.getContext('2d');
        lCtx.fillStyle = '#f8f9ff'; lCtx.fillRect(0, 0, 40, 40);
        litterItem.innerHTML = ''; litterItem.appendChild(lCanv);
        drawLitterBoxGraphic(lCtx, 0, 0, 40, 40, true);
    }

    const yarnLegend = document.getElementById('yarnLegend');
    if (yarnLegend) {
        const ctx = yarnLegend.getContext('2d');
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧶', 20, 20);
    }
}