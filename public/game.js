// Letterfall - falling-block word puzzle
// MVP: 8x14 board, single letters, manual tap-to-clear, 3+ letter words

const COLS = 8;
const ROWS = 14;
const CELL = 40; // px
const MIN_WORD_LEN = 3;

// Letter values (Scrabble-like)
const LETTER_VALUES = {
  A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10,
};

// Weighted letter distribution (vowels + common consonants emphasized)
const LETTER_WEIGHTS = {
  E: 12, A: 9, I: 9, O: 8, U: 4,
  R: 6, T: 6, N: 6, S: 6, L: 4,
  D: 4, G: 3, B: 2, C: 2, M: 2, P: 2,
  F: 2, H: 2, V: 1, W: 2, Y: 2,
  K: 1, J: 1, X: 1, Q: 1, Z: 1,
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

// Word length multipliers
const LENGTH_MULTIPLIER = { 3: 1, 4: 2, 5: 3, 6: 5, 7: 8 };
function lengthMult(len) {
  if (len >= 8) return 12;
  return LENGTH_MULTIPLIER[len] || 1;
}

// Level speeds in ms between gravity ticks
const LEVEL_SPEEDS = [
  900, // 1
  800, // 2
  700, // 3
  600, // 4
  500, // 5
  420, // 6
  350, // 7
  300, // 8
  260, // 9
  220, // 10
];

// ===== Game State =====

const state = {
  board: [], // 2D array [row][col] = { letter, value, id, highlighted, clearing }
  current: null, // { letter, value, row, col }
  next: null, // letter
  fallTimer: 0,
  fallInterval: 900,
  score: 0,
  level: 1,
  wordsCleared: 0,
  lettersPlaced: 0,
  bestWord: "",
  highlightedWords: [], // [{ cells: [{row,col}], word, score, isBest }]
  running: false,
  paused: false,
  gameOver: false,
  combo: 0,
};

let dictionary = new Set();
let dictReady = false;

let nextTileId = 0;
function newId() { return ++nextTileId; }

function emptyBoard() {
  const b = [];
  for (let r = 0; r < ROWS; r++) {
    b.push(new Array(COLS).fill(null));
  }
  return b;
}

// ===== Letter Generation =====

function weightedLetter() {
  // Track vowel ratio on the board to nudge generation
  let vowelCount = 0, totalCount = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell) {
        totalCount++;
        if (VOWELS.has(cell.letter)) vowelCount++;
      }
    }
  }
  const vowelRatio = totalCount > 0 ? vowelCount / totalCount : 0.4;

  // Adjust weights based on board composition
  const adjusted = { ...LETTER_WEIGHTS };
  if (vowelRatio < 0.3) {
    // Too few vowels — boost them
    for (const v of VOWELS) adjusted[v] *= 2;
  } else if (vowelRatio > 0.55) {
    // Too many vowels — reduce them
    for (const v of VOWELS) adjusted[v] = Math.max(1, Math.floor(adjusted[v] / 2));
  }

  let total = 0;
  for (const w of Object.values(adjusted)) total += w;
  let r = Math.random() * total;
  for (const [letter, weight] of Object.entries(adjusted)) {
    r -= weight;
    if (r <= 0) return letter;
  }
  return "E";
}

function spawnPiece() {
  const letter = state.next || weightedLetter();
  state.next = weightedLetter();
  const startCol = Math.floor(COLS / 2) - 1;
  // If spawn area blocked, game over
  if (state.board[0][startCol]) {
    state.gameOver = true;
    state.running = false;
    return null;
  }
  state.current = {
    letter,
    value: LETTER_VALUES[letter] || 1,
    row: 0,
    col: startCol,
    id: newId(),
  };
  return state.current;
}

// ===== Board Operations =====

function canMoveTo(row, col) {
  if (col < 0 || col >= COLS) return false;
  if (row < 0 || row >= ROWS) return false;
  return state.board[row][col] === null;
}

function lockPiece() {
  if (!state.current) return;
  const { letter, value, row, col, id } = state.current;
  state.board[row][col] = { letter, value, id, highlighted: false };
  state.current = null;
  state.lettersPlaced++;
}

function applyGravity() {
  let moved = false;
  for (let c = 0; c < COLS; c++) {
    // Compact column: pull all non-null down
    const stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (state.board[r][c]) stack.push(state.board[r][c]);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      const fromBottom = ROWS - 1 - r;
      const newCell = stack[fromBottom] || null;
      if (state.board[r][c] !== newCell) moved = true;
      state.board[r][c] = newCell;
    }
  }
  return moved;
}

// ===== Word Detection =====

function findAllWords() {
  const found = [];
  const seen = new Set(); // dedupe by cell signature

  // Horizontal scan
  for (let r = 0; r < ROWS; r++) {
    let runStart = -1;
    let runStr = "";
    for (let c = 0; c <= COLS; c++) {
      const cell = c < COLS ? state.board[r][c] : null;
      if (cell) {
        if (runStart === -1) runStart = c;
        runStr += cell.letter;
      } else {
        if (runStr.length >= MIN_WORD_LEN) {
          // Try every contiguous substring of length >= 3
          for (let len = MIN_WORD_LEN; len <= runStr.length; len++) {
            for (let s = 0; s + len <= runStr.length; s++) {
              const sub = runStr.substr(s, len);
              if (dictionary.has(sub.toLowerCase())) {
                const cells = [];
                for (let k = 0; k < len; k++) cells.push({ row: r, col: runStart + s + k });
                const sig = cells.map(p => `${p.row},${p.col}`).join("|") + ":H";
                if (!seen.has(sig)) {
                  seen.add(sig);
                  found.push({ cells, word: sub, dir: "H" });
                }
              }
            }
          }
        }
        runStart = -1;
        runStr = "";
      }
    }
  }

  // Vertical scan
  for (let c = 0; c < COLS; c++) {
    let runStart = -1;
    let runStr = "";
    for (let r = 0; r <= ROWS; r++) {
      const cell = r < ROWS ? state.board[r][c] : null;
      if (cell) {
        if (runStart === -1) runStart = r;
        runStr += cell.letter;
      } else {
        if (runStr.length >= MIN_WORD_LEN) {
          for (let len = MIN_WORD_LEN; len <= runStr.length; len++) {
            for (let s = 0; s + len <= runStr.length; s++) {
              const sub = runStr.substr(s, len);
              if (dictionary.has(sub.toLowerCase())) {
                const cells = [];
                for (let k = 0; k < len; k++) cells.push({ row: runStart + s + k, col: c });
                const sig = cells.map(p => `${p.row},${p.col}`).join("|") + ":V";
                if (!seen.has(sig)) {
                  seen.add(sig);
                  found.push({ cells, word: sub, dir: "V" });
                }
              }
            }
          }
        }
        runStart = -1;
        runStr = "";
      }
    }
  }

  // Score each word
  for (const w of found) {
    let baseScore = 0;
    for (const { row, col } of w.cells) {
      const cell = state.board[row][col];
      if (cell) baseScore += cell.value;
    }
    w.score = baseScore * lengthMult(w.cells.length);
  }

  return found;
}

function refreshHighlights() {
  // Clear highlights
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell) cell.highlighted = false;
    }
  }
  // Find words and mark cells
  state.highlightedWords = findAllWords();
  // Sort by length desc then score desc, so when overlapping, longest wins click priority
  state.highlightedWords.sort((a, b) => b.cells.length - a.cells.length || b.score - a.score);
  for (const w of state.highlightedWords) {
    for (const { row, col } of w.cells) {
      const cell = state.board[row][col];
      if (cell) cell.highlighted = true;
    }
  }
}

// ===== Word Clearing =====

function clearWord(word, chainStep = 0) {
  let multiplier = 1;
  if (chainStep === 1) multiplier = 1.5;
  else if (chainStep === 2) multiplier = 2;
  else if (chainStep >= 3) multiplier = 3;

  const points = Math.round(word.score * multiplier);
  state.score += points;
  state.wordsCleared++;
  if (word.word.length > state.bestWord.length) {
    state.bestWord = word.word.toUpperCase();
  }

  // Remove cells
  for (const { row, col } of word.cells) {
    state.board[row][col] = null;
  }

  showMessage(
    `${word.word.toUpperCase()} +${points}${chainStep > 0 ? ` (chain x${multiplier})` : ""}`
  );

  // Apply gravity, check for chain
  applyGravity();

  // Level progression
  const targetLevel = Math.min(LEVEL_SPEEDS.length, 1 + Math.floor(state.wordsCleared / 5));
  if (targetLevel > state.level) {
    state.level = targetLevel;
    state.fallInterval = LEVEL_SPEEDS[state.level - 1];
    showMessage(`Level ${state.level}!`);
  }

  // Check for chain reactions
  refreshHighlights();
  // Auto-clear single-word chains? No — let player decide. Just update highlights.
}

function handleClickAt(px, py, rect) {
  if (!state.running || state.paused || state.gameOver) return;
  // Convert pixel to grid
  const x = px - rect.left;
  const y = py - rect.top;
  const scaleX = COLS * CELL / rect.width;
  const scaleY = ROWS * CELL / rect.height;
  const c = Math.floor(x * scaleX / CELL);
  const r = Math.floor(y * scaleY / CELL);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
  // Find which highlighted word contains this cell — prefer longest
  for (const w of state.highlightedWords) {
    if (w.cells.some(p => p.row === r && p.col === c)) {
      clearWord(w);
      // Re-render
      draw();
      return;
    }
  }
}

// ===== Game Loop =====

function step(dtMs) {
  if (!state.running || state.paused || state.gameOver) return;
  state.fallTimer += dtMs;
  if (state.fallTimer >= state.fallInterval) {
    state.fallTimer = 0;
    if (!state.current) {
      spawnPiece();
      if (state.gameOver) { onGameOver(); return; }
      return;
    }
    // Try to fall
    const { row, col } = state.current;
    if (canMoveTo(row + 1, col)) {
      state.current.row++;
    } else {
      lockPiece();
      refreshHighlights();
      spawnPiece();
      if (state.gameOver) { onGameOver(); return; }
    }
  }
}

function softDrop() {
  if (!state.current || !state.running || state.paused) return;
  const { row, col } = state.current;
  if (canMoveTo(row + 1, col)) {
    state.current.row++;
    state.fallTimer = 0;
  }
}

function hardDrop() {
  if (!state.current || !state.running || state.paused) return;
  while (canMoveTo(state.current.row + 1, state.current.col)) {
    state.current.row++;
  }
  lockPiece();
  refreshHighlights();
  spawnPiece();
  if (state.gameOver) onGameOver();
  state.fallTimer = 0;
}

function moveLeft() {
  if (!state.current || !state.running || state.paused) return;
  if (canMoveTo(state.current.row, state.current.col - 1)) state.current.col--;
}

function moveRight() {
  if (!state.current || !state.running || state.paused) return;
  if (canMoveTo(state.current.row, state.current.col + 1)) state.current.col++;
}

// ===== Rendering =====

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

function setupCanvas() {
  // Size canvas to fit cells exactly with high DPI
  const dpr = window.devicePixelRatio || 1;
  const w = COLS * CELL;
  const h = ROWS * CELL;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawCell(c, r, cell, isCurrent = false) {
  const x = c * CELL;
  const y = r * CELL;
  ctx.save();

  // Background
  if (cell.highlighted) {
    // Highlighted (forms a word)
    ctx.fillStyle = "#fbbf24";
  } else if (isCurrent) {
    ctx.fillStyle = "#60a5fa";
  } else if (VOWELS.has(cell.letter)) {
    ctx.fillStyle = "#cbd5e1";
  } else {
    ctx.fillStyle = "#e2e8f0";
  }
  roundRect(ctx, x + 2, y + 2, CELL - 4, CELL - 4, 5);
  ctx.fill();

  // Letter
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cell.letter, x + CELL / 2, y + CELL / 2 + 1);

  // Point value
  ctx.fillStyle = "#475569";
  ctx.font = "bold 9px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText(String(cell.value), x + CELL - 5, y + CELL - 5);

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function draw() {
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

  // Grid lines
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, ROWS * CELL);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(COLS * CELL, r * CELL);
    ctx.stroke();
  }

  // Danger zone overlay (top 2 rows)
  for (let r = 0; r < 2; r++) {
    let dangerCount = 0;
    for (let c = 0; c < COLS; c++) if (state.board[r][c]) dangerCount++;
    if (dangerCount > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${0.05 + 0.04 * dangerCount})`;
      ctx.fillRect(0, r * CELL, COLS * CELL, CELL);
    }
  }

  // Locked cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell) drawCell(c, r, cell);
    }
  }

  // Current falling piece
  if (state.current) {
    drawCell(state.current.col, state.current.row, state.current, true);
  }
}

// ===== UI Update =====

function updateHud() {
  document.getElementById("score").textContent = state.score.toLocaleString();
  document.getElementById("level").textContent = state.level;
  document.getElementById("words").textContent = state.wordsCleared;
  document.getElementById("nextTile").textContent = state.next || "-";
}

let messageTimer = null;
function showMessage(text) {
  const el = document.getElementById("message");
  el.classList.remove("fade");
  el.textContent = text;
  if (messageTimer) clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    el.classList.add("fade");
  }, 2000);
}

function onGameOver() {
  state.gameOver = true;
  state.running = false;

  const high = parseInt(localStorage.getItem("letterfall.highScore") || "0", 10);
  if (state.score > high) {
    localStorage.setItem("letterfall.highScore", String(state.score));
  }
  const newHigh = Math.max(high, state.score);

  document.getElementById("overlayTitle").textContent = "Game Over";
  document.getElementById("overlaySubtitle").textContent = "The board is full.";
  document.getElementById("howToPlay").classList.add("hidden");
  document.getElementById("finalStats").classList.remove("hidden");
  document.getElementById("finalScore").textContent = state.score.toLocaleString();
  document.getElementById("finalWords").textContent = state.wordsCleared;
  document.getElementById("finalBest").textContent = state.bestWord || "-";
  document.getElementById("finalHigh").textContent = newHigh.toLocaleString();
  document.getElementById("startBtn").textContent = "Play Again";
  document.getElementById("overlay").classList.remove("hidden");
}

function startGame() {
  state.board = emptyBoard();
  state.current = null;
  state.next = weightedLetter();
  state.fallTimer = 0;
  state.fallInterval = LEVEL_SPEEDS[0];
  state.score = 0;
  state.level = 1;
  state.wordsCleared = 0;
  state.lettersPlaced = 0;
  state.bestWord = "";
  state.highlightedWords = [];
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  spawnPiece();
  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("howToPlay").classList.remove("hidden");
  document.getElementById("finalStats").classList.add("hidden");
}

// ===== Input =====

function attachInput() {
  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (!state.running) return;
    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        moveLeft(); e.preventDefault(); break;
      case "ArrowRight":
      case "d":
      case "D":
        moveRight(); e.preventDefault(); break;
      case "ArrowDown":
      case "s":
      case "S":
        softDrop(); e.preventDefault(); break;
      case " ":
        hardDrop(); e.preventDefault(); break;
      case "p":
      case "P":
      case "Escape":
        togglePause(); e.preventDefault(); break;
    }
  });

  // Click on canvas to clear highlighted words
  canvas.addEventListener("click", (e) => {
    handleClickAt(e.clientX, e.clientY, canvas.getBoundingClientRect());
  });

  // Touch: drag to move, tap to clear
  let touchStartX = 0, touchStartY = 0, touchStartCol = 0, touchMoved = false, touchActive = false;
  canvas.addEventListener("touchstart", (e) => {
    if (!state.running || !state.current) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartCol = state.current.col;
    touchMoved = false;
    touchActive = true;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchActive || !state.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const rect = canvas.getBoundingClientRect();
    const cellPx = rect.width / COLS;
    const colDelta = Math.round(dx / cellPx);
    const targetCol = touchStartCol + colDelta;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) touchMoved = true;
    if (state.current.col !== targetCol) {
      // Move step by step toward targetCol
      while (state.current.col < targetCol) {
        if (canMoveTo(state.current.row, state.current.col + 1)) state.current.col++;
        else break;
      }
      while (state.current.col > targetCol) {
        if (canMoveTo(state.current.row, state.current.col - 1)) state.current.col--;
        else break;
      }
    }
    // Swipe down → soft drop
    if (dy > 40 && Math.abs(dx) < 30) {
      softDrop();
    }
  }, { passive: true });

  canvas.addEventListener("touchend", (e) => {
    if (!touchActive) return;
    touchActive = false;
    if (!touchMoved) {
      // Treat as a tap — clear highlighted word at touch point
      const t = e.changedTouches[0];
      handleClickAt(t.clientX, t.clientY, canvas.getBoundingClientRect());
    }
  });

  // Touch buttons
  document.querySelectorAll(".touch-btn").forEach(btn => {
    const action = btn.getAttribute("data-action");
    const repeat = (fn) => {
      let ival;
      const start = (e) => {
        e.preventDefault();
        fn();
        ival = setInterval(fn, 120);
      };
      const stop = () => { if (ival) { clearInterval(ival); ival = null; } };
      btn.addEventListener("touchstart", start, { passive: false });
      btn.addEventListener("mousedown", start);
      btn.addEventListener("touchend", stop);
      btn.addEventListener("touchcancel", stop);
      btn.addEventListener("mouseup", stop);
      btn.addEventListener("mouseleave", stop);
    };
    if (action === "left") repeat(moveLeft);
    else if (action === "right") repeat(moveRight);
    else if (action === "drop") repeat(softDrop);
    else if (action === "hard") {
      btn.addEventListener("click", (e) => { e.preventDefault(); hardDrop(); });
    }
  });

  // Start button
  document.getElementById("startBtn").addEventListener("click", () => {
    if (!dictReady) {
      showMessage("Loading dictionary…");
      return;
    }
    startGame();
  });

  // Pause button
  document.getElementById("pauseBtn").addEventListener("click", togglePause);
}

function togglePause() {
  if (!state.running || state.gameOver) return;
  state.paused = !state.paused;
  if (state.paused) {
    document.getElementById("overlayTitle").textContent = "Paused";
    document.getElementById("overlaySubtitle").textContent = "Take a breath.";
    document.getElementById("howToPlay").classList.remove("hidden");
    document.getElementById("finalStats").classList.add("hidden");
    document.getElementById("startBtn").textContent = "Resume";
    document.getElementById("overlay").classList.remove("hidden");
  } else {
    document.getElementById("overlay").classList.add("hidden");
  }
}

// ===== Bootstrap =====

async function loadDictionary() {
  try {
    const res = await fetch("words.txt");
    const text = await res.text();
    const words = text.split("\n").map(w => w.trim().toLowerCase()).filter(w => w.length >= MIN_WORD_LEN);
    dictionary = new Set(words);
    dictReady = true;
    showMessage(`Loaded ${dictionary.size.toLocaleString()} words. Press Start.`);
  } catch (e) {
    showMessage("Failed to load dictionary.");
    console.error(e);
  }
}

let lastFrame = 0;
function loop(ts) {
  if (!lastFrame) lastFrame = ts;
  const dt = ts - lastFrame;
  lastFrame = ts;
  step(dt);
  draw();
  requestAnimationFrame(loop);
}

setupCanvas();
state.board = emptyBoard();
attachInput();
loadDictionary();
updateHud();
setInterval(updateHud, 100);
draw();
requestAnimationFrame(loop);
