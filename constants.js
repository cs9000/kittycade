const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 11;
const CELL_SIZE = canvas.width / GRID_SIZE;
const SWIPE_THRESHOLD = 20;
const MOUSE_LOGIC_SPEED = 500;

const initialSnake = () => [
    {x: 5, y: 5, px: 5, py: 5}, 
    {x: 5, y: 6, px: 5, py: 6}, 
    {x: 5, y: 7, px: 5, py: 7}
];

// Polyfill for roundRect if needed
if (typeof CanvasRenderingContext2D.prototype.roundRect === 'undefined') {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        if (Array.isArray(r) && r.length === 4) {
            this.arcTo(x + w, y, x + w, y + h, r[1]);
            this.arcTo(x + w, y + h, x, y + h, r[2]);
            this.arcTo(x, y + h, x, y, r[3]);
            this.arcTo(x, y, x + w, y, r[0]);
        } else {
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
        }
        this.closePath();
        return this;
    }
}