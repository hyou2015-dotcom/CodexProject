const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = {
  I: '#00e5ff',
  J: '#4f67ff',
  L: '#ff9f43',
  O: '#ffe066',
  S: '#57e389',
  T: '#b36bff',
  Z: '#ff5f7a'
};

const SHAPES = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1]
  ]
};

const boardCanvas = document.getElementById('board');
const ctx = boardCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const speedLabelEl = document.getElementById('speedLabel');
const speedRangeEl = document.getElementById('speedRange');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const rotateBtn = document.getElementById('rotateBtn');
const downBtn = document.getElementById('downBtn');
const dropBtn = document.getElementById('dropBtn');
const pauseBtn = document.getElementById('pauseBtn');

let board = [];
let piece = null;
let score = 0;
let level = 1;
let lines = 0;
let speedMultiplier = 1;
let gameOver = true;
let paused = false;
let lastTime = 0;
let dropCounter = 0;

function resetBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type,
    matrix: SHAPES[type].map((row) => [...row]),
    x: Math.floor(COLS / 2) - 1,
    y: -1
  };
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
}

function collision(testPiece) {
  return testPiece.matrix.some((row, y) =>
    row.some((value, x) => {
      if (!value) return false;
      const nextX = x + testPiece.x;
      const nextY = y + testPiece.y;
      return (
        nextX < 0 ||
        nextX >= COLS ||
        nextY >= ROWS ||
        (nextY >= 0 && board[nextY][nextX])
      );
    })
  );
}

function merge() {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value && y + piece.y >= 0) {
        board[y + piece.y][x + piece.x] = piece.type;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every((cell) => cell)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
  }

  if (cleared > 0) {
    lines += cleared;
    score += [0, 100, 300, 500, 800][cleared] * level;
    level = Math.floor(lines / 10) + 1;
    scoreEl.textContent = score;
    levelEl.textContent = level;
  }
}

function spawnPiece() {
  piece = randomPiece();
  if (collision(piece)) {
    gameOver = true;
    statusEl.textContent = 'ゲームオーバー。リスタートできます。';
  }
}

function dropInterval() {
  const levelInterval = Math.max(100, 700 - (level - 1) * 55);
  return Math.max(60, levelInterval / speedMultiplier);
}

function drop() {
  if (gameOver || paused || !piece) return;
  piece.y += 1;
  if (collision(piece)) {
    piece.y -= 1;
    merge();
    clearLines();
    spawnPiece();
  }
  dropCounter = 0;
}

function hardDrop() {
  if (gameOver || paused || !piece) return;
  while (!collision(piece)) {
    piece.y += 1;
  }
  piece.y -= 1;
  merge();
  clearLines();
  spawnPiece();
  dropCounter = 0;
}

function move(dir) {
  if (gameOver || paused || !piece) return;
  piece.x += dir;
  if (collision(piece)) piece.x -= dir;
}

function rotatePiece() {
  if (gameOver || paused || !piece) return;
  const backup = piece.matrix;
  piece.matrix = rotate(piece.matrix);
  if (collision(piece)) {
    piece.x += 1;
    if (collision(piece)) {
      piece.x -= 2;
      if (collision(piece)) {
        piece.x += 1;
        piece.matrix = backup;
      }
    }
  }
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  statusEl.textContent = paused ? '一時停止中' : `プレイ中（速度 ${speedMultiplier.toFixed(1)}x）`;
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}

function draw() {
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) drawCell(x, y, COLORS[cell]);
    });
  });

  if (piece) {
    piece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value && y + piece.y >= 0) {
          drawCell(x + piece.x, y + piece.y, COLORS[piece.type]);
        }
      });
    });
  }
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;
  if (!gameOver && !paused) {
    dropCounter += delta;
    if (dropCounter > dropInterval()) drop();
  }
  draw();
  requestAnimationFrame(update);
}

function updateSpeedLabel() {
  speedLabelEl.textContent = `${speedMultiplier.toFixed(1)}x`;
}

function startGame() {
  resetBoard();
  score = 0;
  level = 1;
  lines = 0;
  paused = false;
  gameOver = false;
  dropCounter = 0;
  scoreEl.textContent = score;
  levelEl.textContent = level;
  statusEl.textContent = `プレイ中（速度 ${speedMultiplier.toFixed(1)}x）`;
  spawnPiece();
}

function bindTap(button, action) {
  button.addEventListener('touchstart', (event) => {
    event.preventDefault();
    action();
  });
  button.addEventListener('click', action);
}

startBtn.addEventListener('click', startGame);

speedRangeEl.addEventListener('input', () => {
  speedMultiplier = Number(speedRangeEl.value);
  updateSpeedLabel();
  if (!gameOver && !paused) {
    statusEl.textContent = `プレイ中（速度 ${speedMultiplier.toFixed(1)}x）`;
  }
});

bindTap(leftBtn, () => move(-1));
bindTap(rightBtn, () => move(1));
bindTap(rotateBtn, rotatePiece);
bindTap(downBtn, drop);
bindTap(dropBtn, hardDrop);
bindTap(pauseBtn, togglePause);

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyP') {
    togglePause();
    return;
  }

  switch (event.code) {
    case 'ArrowLeft':
      move(-1);
      break;
    case 'ArrowRight':
      move(1);
      break;
    case 'ArrowDown':
      drop();
      break;
    case 'ArrowUp':
      rotatePiece();
      break;
    case 'Space':
      event.preventDefault();
      hardDrop();
      break;
    default:
      break;
  }
});

resetBoard();
updateSpeedLabel();
update();
