# **Feature Specification: Responsive Virtual D-Pad Integration**

## **1\. Objective**

Update the existing Snake game to include on-screen virtual controls (D-Pad) for touch devices. The current swipe implementation is considered too high-latency. The new system will use tap-based directional buttons located **outside** the game canvas.

## **2\. Layout Requirements**

The game canvas is square. The UI must adapt to the device form factor using a Flexbox container.

### **A. The Container Structure**

Wrap the existing \<canvas\> and the new D-Pad container in a parent div (e.g., .game-wrapper).

### **B. Mobile Layout (Portrait / Narrow Screens)**

* **Arrangement:** Vertical Stack (flex-direction: column).  
* **Order:** Game Board (Top), D-Pad (Bottom).  
* **Spacing:** Ensure the D-Pad has a bottom margin (safe area) of at least **30px** to avoid the iOS Home Bar / "Dead Zone".  
* **Sizing:** The D-Pad should fit comfortably in the space below the board without requiring scrolling.

### **C. Tablet/Desktop Layout (Landscape / Wide Screens)**

* **Trigger:** Use a CSS Media Query (suggested breakpoint: min-width: 768px).  
* **Arrangement:** Horizontal Row (flex-direction: row).  
* **Order:** Game Board (Left), D-Pad (Right).  
* **Spacing:** Add a gap between the Board and D-Pad (approx 40-50px).  
* **Sizing:** Scale the D-Pad up (approx 1.5x) to be easily accessible to the right thumb.

## **3\. Technical Implementation Details**

### **A. Input Latency (Crucial)**

* **No Click Events:** Do not use click listeners for the D-Pad, as they introduce a \~300ms delay on mobile browsers.  
* **Event Type:** Use pointerdown (preferred) or touchstart.  
* **Touch Action:** Apply touch-action: none; to both the D-Pad buttons and the Game Canvas to prevent the browser from interpreting taps/swipes as scrolling or zooming.  
* **Propagation:** Ensure D-Pad events call e.preventDefault() to stop ghost clicks.

### **B. The D-Pad HTML/CSS**

Use a 3x3 Grid layout or absolute positioning to create a standard "Cross" shape.

* **Center:** Empty or decorative (or a pause button).  
* **Top/Bottom/Left/Right:** The directional buttons.  
* **Visuals:** Buttons should be high contrast.

## **4\. Reference Implementation Code**

### **HTML Structure**

\<div class="game-wrapper"\>  
    \<\!-- Existing Canvas \--\>  
    \<canvas id="gameCanvas" width="400" height="400"\>\</canvas\>

    \<\!-- New Controls \--\>  
    \<div id="virtual-dpad" class="dpad-container"\>  
        \<div class="dpad-row"\>  
            \<button id="btn-up" class="dpad-btn"\>▲\</button\>  
        \</div\>  
        \<div class="dpad-row middle"\>  
            \<button id="btn-left" class="dpad-btn"\>◀\</button\>  
            \<div class="dpad-gap"\>\</div\>  
            \<button id="btn-right" class="dpad-btn"\>▶\</button\>  
        \</div\>  
        \<div class="dpad-row"\>  
            \<button id="btn-down" class="dpad-btn"\>▼\</button\>  
        \</div\>  
    \</div\>  
\</div\>

### **CSS Logic (SCSS/CSS)**

/\* Base Layout (Mobile First) \*/  
.game-wrapper {  
    display: flex;  
    flex-direction: column;  
    align-items: center;  
    justify-content: center;  
    height: 100vh;  
    overflow: hidden; /\* Prevent scrolling \*/  
}

.dpad-container {  
    margin-top: 20px;  
    margin-bottom: 40px; /\* Safety for iOS Home Bar \*/  
    display: flex;  
    flex-direction: column;  
    align-items: center;  
    touch-action: none; /\* Disables browser zoom/scroll \*/  
}

.dpad-row { display: flex; }  
.dpad-btn {  
    width: 60px;  
    height: 60px;  
    margin: 5px;  
    background: rgba(255, 255, 255, 0.2); /\* Semi-transparent \*/  
    border: 2px solid white;  
    border-radius: 10px;  
    font-size: 24px;  
    color: white;  
    cursor: pointer;  
    user-select: none; /\* Prevent text highlighting \*/  
}

/\* Tablet / Desktop Layout \*/  
@media (min-width: 768px) {  
    .game-wrapper {  
        flex-direction: row;  
    }

    .dpad-container {  
        margin-top: 0;  
        margin-left: 50px; /\* Move to right side \*/  
        margin-bottom: 0;  
        transform: scale(1.4); /\* Make buttons bigger for tablet \*/  
    }  
}

### **JavaScript Logic**

const setupMobileControls \= () \=\> {  
    const directions \= {  
        'btn-up': 'UP',  
        'btn-down': 'DOWN',  
        'btn-left': 'LEFT',  
        'btn-right': 'RIGHT'  
    };

    Object.keys(directions).forEach(id \=\> {  
        const btn \= document.getElementById(id);  
        if (btn) {  
            // Use pointerdown for instant reaction  
            btn.addEventListener('pointerdown', (e) \=\> {  
                e.preventDefault(); // Stop mouse emulation  
                e.stopPropagation(); // Stop bubbling  
                  
                // Call the existing game move function  
                // Assuming function handleInput(direction) exists  
                handleInput(directions\[id\]);   
            });  
        }  
    });  
};  
