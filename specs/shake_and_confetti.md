# Feature Specification: Visual Polish ("Juice")

**Objective:** Implement "Screen Shake" on impact (keeping the UI stable) and "Confetti Particles" when eating food to make the game feel more responsive.

**Files to Modify:** `state.js`, `main.js`, `logic.js`, `renderer.js`

---

## 1. Update `state.js`

**Goal:** Add state variables to track the shake magnitude and particle instances.

* **In the `game` object:**
    Add these two properties:
    ```javascript
    shake: 0,
    foodParticles: [],
    ```

* **In the `resetGameState()` function:**
    Reset these values ensuring they clear on restart:
    ```javascript
    game.shake = 0;
    game.foodParticles = [];
    ```

---

## 2. Update `main.js`

**Goal:** Trigger the screen shake when the player crashes.

* **In `window.loseLife(msg)`:**
    At the very top of the function, set the shake magnitude:
    ```javascript
    game.shake = 20;
    ```

---

## 3. Update `logic.js`

**Goal:** Spawn particles when food is eaten and define the helper function to create them.

* **In `updateGameLogic()`:**
    Find the block handling food collision: `if (game.food && tx === game.food.x ...)`
    Inside this block, call the spawner:
    ```javascript
    spawnFoodParticles(tx, ty, '#ff6347'); // Tomato red color
    ```

* **Add Helper Function:**
    Add this function to the bottom of the file:
    ```javascript
    function spawnFoodParticles(gridX, gridY, color) {
        const CELL_SIZE = 40; // Ensure this matches constant or pass it in if needed
        const centerX = (gridX + 0.5) * CELL_SIZE;
        const centerY = (gridY + 0.5) * CELL_SIZE;
        
        for (let i = 0; i < 12; i++) {
            game.foodParticles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 10, 
                vy: (Math.random() - 0.5) * 10, 
                life: 1.0, 
                color: color
            });
        }
    }
    ```

---

## 4. Update `renderer.js`

**Goal:** Apply the coordinate translation (shake) to the game world layer only, leaving the background clean and the UI stable.

* **In `function draw(interpolationFactor, renderDeltaTime)`:**

    1.  **Isolate the Shake:**
        Find the lines that clear the screen (drawing the `#f0f0f0` background). Immediately **after** the background is drawn, add:
        ```javascript
        ctx.save();
        if (game.shake > 0) {
            const magnitude = game.shake;
            const x = (Math.random() - 0.5) * magnitude;
            const y = (Math.random() - 0.5) * magnitude;
            ctx.translate(x, y);
            game.shake *= 0.9; // Decay factor
            if (game.shake < 0.5) game.shake = 0;
        }
        ```

    2.  **Draw Particles & Restore Context:**
        Find the line `if (game.feedbackMessage) {` (which handles the UI overlays). **Immediately before** that line, close the shake isolation:
        ```javascript
        drawFoodParticles(ctx); // Draw particles inside the shaken coordinate system
        ctx.restore();          // Restore coordinates so UI is drawn normally
        ```

* **Add Helper Function:**
    Add this function to the bottom of the file to render the confetti:
    ```javascript
    function drawFoodParticles(ctx) {
        for (let i = game.foodParticles.length - 1; i >= 0; i--) {
            let p = game.foodParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02; 
            
            if (p.life <= 0) {
                game.foodParticles.splice(i, 1);
            } else {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 4, 4);
                ctx.globalAlpha = 1.0;
            }
        }
    }
    ```