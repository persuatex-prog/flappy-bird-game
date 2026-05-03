const GRAVITY = 0.5;
const FLAP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 1500;
let canvas, ctx;
let bird;
let pipes = [];
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let gameRunning = false;
let gameLoop;
let pipeSpawner;
let lastTime = 0;

const createBird = () => ({
  x: 50,
  y: 200,
  width: 34,
  height: 24,
  velocity: 0,
  rotation: 0,
  draw() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐦', 0, 0);
    ctx.restore();
  },
  update() {
    this.velocity += GRAVITY;
    this.y += this.velocity;
    this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.velocity * 0.1));
    if (this.y + this.height > canvas.height - 100) {
      this.y = canvas.height - 100 - this.height;
      gameOver();
    }
    if (this.y < 0) {
      this.y = 0;
      this.velocity = 0;
    }
  },
  flap() {
    this.velocity = FLAP_STRENGTH;
  }
});

class Pipe {
  constructor(canvasWidth, canvasHeight) {
    this.x = canvasWidth;
    this.width = 52;
    this.gap = 150;
    this.topHeight = Math.random() * (canvasHeight - 100 - this.gap - 100) + 50;
    this.bottomY = this.topHeight + this.gap;
    this.bottomHeight = canvasHeight - 100 - this.bottomY;
    this.passed = false;
  }
  draw() {
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(this.x, 0, this.width, this.topHeight);
    ctx.strokeStyle = '#558c22';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, 0, this.width, this.topHeight);
    ctx.fillRect(this.x - 2, this.topHeight - 20, this.width + 4, 20);
    ctx.strokeRect(this.x - 2, this.topHeight - 20, this.width + 4, 20);
    ctx.fillRect(this.x, this.bottomY, this.width, this.bottomHeight);
    ctx.strokeRect(this.x, this.bottomY, this.width, this.bottomHeight);
    ctx.fillRect(this.x - 2, this.bottomY, this.width + 4, 20);
    ctx.strokeRect(this.x - 2, this.bottomY, this.width + 4, 20);
  }
  update(canvasWidth) {
    this.x -= PIPE_SPEED;
  }
  isOffscreen() {
    return this.x + this.width < 0;
  }
  checkCollision(bird) {
    if (bird.x < this.x + this.width && bird.x + bird.width > this.x && bird.y < this.topHeight) return true;
    if (bird.x < this.x + this.width && bird.x + bird.width > this.x && bird.y + bird.height > this.bottomY) return true;
    return false;
  }
}

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  highScore = localStorage.getItem('flappyHighScore') || 0;
  document.getElementById('start-high-score').textContent = highScore;
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('restart-btn').addEventListener('click', startGame);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameRunning) bird.flap(); });
  canvas.addEventListener('click', () => { if (gameRunning) bird.flap(); });
  document.addEventListener('keydown', (e) => { if (e.code === 'Space' && gameRunning) { e.preventDefault(); bird.flap(); } });
}

function resizeCanvas() {
  const container = document.getElementById('game-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

function startGame() {
  bird = createBird();
  pipes = [];
  score = 0;
  gameRunning = true;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('score-display').classList.remove('hidden');
  document.getElementById('current-score').textContent = score;
  lastTime = performance.now();
  gameLoop = requestAnimationFrame(update);
  pipeSpawner = setInterval(() => { if (gameRunning) pipes.push(new Pipe(canvas.width, canvas.height)); }, PIPE_SPAWN_RATE);
}

function update(currentTime) {
  if (!gameRunning) return;
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  pipes.forEach((pipe, index) => {
    pipe.update(canvas.width);
    pipe.draw();
    if (pipe.checkCollision(bird)) { gameOver(); return; }
    if (!pipe.passed && pipe.x + pipe.width < bird.x) { pipe.passed = true; score++; document.getElementById('current-score').textContent = score; }
    if (pipe.isOffscreen()) pipes.splice(index, 1);
  });
  bird.update();
  bird.draw();
  drawGround();
  gameLoop = requestAnimationFrame(update);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#70c5ce');
  gradient.addColorStop(1, '#95e0d3');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(50, 80, 30, 0, Math.PI * 2);
  ctx.arc(90, 70, 40, 0, Math.PI * 2);
  ctx.arc(130, 80, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width - 100, 120, 30, 0, Math.PI * 2);
  ctx.arc(canvas.width - 60, 110, 40, 0, Math.PI * 2);
  ctx.arc(canvas.width - 20, 120, 30, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround() {
  const groundHeight = 100;
  const groundY = canvas.height - groundHeight;
  const gradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
  gradient.addColorStop(0, '#ded895');
  gradient.addColorStop(1, '#c9b86c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, groundY, canvas.width, groundHeight);
  ctx.fillStyle = '#73bf2e';
  ctx.fillRect(0, groundY, canvas.width, 15);
  ctx.strokeStyle = '#558c22';
  ctx.beginPath();
  ctx.moveTo(0, groundY + 15);
  ctx.lineTo(canvas.width, groundY + 15);
  ctx.stroke();
}

function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(gameLoop);
  clearInterval(pipeSpawner);
  if (score > highScore) { highScore = score; localStorage.setItem('flappyHighScore', highScore); }
  document.getElementById('final-score').textContent = score;
  document.getElementById('gameover-high-score').textContent = highScore;
  document.getElementById('score-display').classList.add('hidden');
  document.getElementById('gameover-screen').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', init);
