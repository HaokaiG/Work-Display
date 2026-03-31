// --- GLOBAL VARIABLES (CRITICAL) ---
let layers = [];
let imageSize = 80; 
let phase = 1;         // This was missing!
let phaseStart;
let expandDuration = 3000;
let zoomDuration = 3000;
let totalImages = 52; 
let loadedImages = [];

function preload() {
  for (let i = 1; i <= totalImages; i++) {
    loadedImages[i - 1] = {
      id: i,
      img: loadImage(`images/img${i}.jpg`)
    };
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  phaseStart = millis();

  // Spacing: (Count, Radius, Speed)
  layers.push(new Ring(12, 70, 0.015)); 
  layers.push(new Ring(18, 150, 0.012));
  layers.push(new Ring(22, 240, 0.010));
}

function draw() {
  background(0);
  
  let currentZoom = 1;
  if (phase === 2) {
    let t = constrain((millis() - phaseStart) / zoomDuration, 0, 1);
    currentZoom = 1 + easeOutExpo(t) * 1.2; 
  }

  push();
  translate(width / 2, height / 2);
  scale(currentZoom);

  let mx = (mouseX - width / 2) / currentZoom;
  let my = (mouseY - height / 2) / currentZoom;

  if (phase === 1 && (millis() - phaseStart) > expandDuration) {
    phase = 2;
    phaseStart = millis();
  }

  // 1. Find single hovered image using square hitbox
  let hoveredId = null;
  for (let i = layers.length - 1; i >= 0; i--) {
    let id = layers[i].getHoveredId(mx, my);
    if (id !== null) {
      hoveredId = id;
      break; 
    }
  }

  // 2. Update and display rings
  for (let ring of layers) {
    if (phase === 2) {
      let t = constrain((millis() - phaseStart) / zoomDuration, 0, 1);
      ring.setSpeedScale(1 - easeOutExpo(t) * 0.9);
    }
    ring.update();
    ring.display(mx, my, hoveredId); 
  }
  pop();
}

function mousePressed() {
  let currentZoom = 1;
  if (phase === 2) {
    let t = constrain((millis() - phaseStart) / zoomDuration, 0, 1);
    currentZoom = 1 + easeOutExpo(t) * 1.2;
  }
  let mx = (mouseX - width / 2) / currentZoom;
  let my = (mouseY - height / 2) / currentZoom;

  for (let i = layers.length - 1; i >= 0; i--) {
    let clickedId = layers[i].checkClick(mx, my);
    if (clickedId !== null) {
      window.location.href = `pages/image_${clickedId}.html`;
      break; 
    }
  }
}

function easeOutExpo(t) { return t === 1 ? 1 : 1 - pow(2, -10 * t); }

class Ring {
  constructor(num, targetRadius, baseSpeed) {
    this.num = num;
    this.targetRadius = targetRadius;
    this.currentRadius = 0;
    this.baseSpeed = baseSpeed;
    this.angle = 0;
    this.speedScale = 1;
    this.startTime = millis();
    this.tiles = [];
    for (let i = 0; i < num; i++) {
      let data = loadedImages[(Ring.imageIndex++) % loadedImages.length];
      this.tiles.push({ ...data, currentScale: 1.0 });
    }
  }

  setSpeedScale(s) { this.speedScale = s; }

  update() {
    let t = constrain((millis() - this.startTime) / expandDuration, 0, 1);
    this.currentRadius = this.targetRadius * (1 - pow(1 - t, 3));
    this.angle += this.baseSpeed * this.speedScale;
  }

  getHoveredId(mx, my) {
    for (let i = 0; i < this.num; i++) {
      let a = (TWO_PI / this.num) * i + this.angle;
      let x = cos(a) * this.currentRadius;
      let y = sin(a) * this.currentRadius;
      
      // FIXED HITBOX: Square detection makes edges easier to hover
      let r = imageSize / 2;
      if (mx > x - r && mx < x + r && my > y - r && my < y + r) {
        return this.tiles[i].id;
      }
    }
    return null;
  }

  display(mx, my, globalHoveredId) {
    for (let i = 0; i < this.num; i++) {
      let tile = this.tiles[i];
      let a = (TWO_PI / this.num) * i + this.angle;
      let x = cos(a) * this.currentRadius;
      let y = sin(a) * this.currentRadius;
      
      let isHovered = (tile.id === globalHoveredId);
      let targetScale = isHovered ? 1.4 : 1.0;
      
      // Fast snap lerp
      tile.currentScale = lerp(tile.currentScale, targetScale, 0.35);
      
      let aspectRatio = tile.img.height / tile.img.width;
      let dw = imageSize * tile.currentScale;
      let dh = (imageSize * aspectRatio) * tile.currentScale;

      image(tile.img, x, y, dw, dh);
    }
  }

  checkClick(mx, my) {
    return this.getHoveredId(mx, my);
  }
}
Ring.imageIndex = 0;