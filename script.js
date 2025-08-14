/*********************
 * Background image
 *********************/
const categories = ["nature", "technology", "abstract", "city", "space", "ocean", "mountains"];
const randomCategory = categories[Math.floor(Math.random() * categories.length)];
fetch(`https://source.unsplash.com/1600x900/?${encodeURIComponent(randomCategory)}`)
  .then(res => { document.body.style.backgroundImage = `url(${res.url})`; })
  .catch(() => { document.body.style.backgroundColor = "#0f1217"; });

/*********************
 * Particles FX (WPM reactive)
 *********************/
const fx = (() => {
  const canvas = document.getElementById("fxCanvas");
  const ctx = canvas.getContext("2d");
  let w, h, particles = [], baseSpeed = 0.3;

  function resize() { w = canvas.width = innerWidth; h = canvas.height = innerHeight; }
  addEventListener("resize", resize); resize();

  function spawn(n=60) {
    particles = new Array(n).fill(0).map(() => ({
      x: Math.random()*w,
      y: Math.random()*h,
      r: Math.random()*2+0.5,
      vx: (Math.random()*2-1) * baseSpeed,
      vy: (Math.random()*2-1) * baseSpeed,
      a: Math.random()*0.6+0.2
    }));
  }
  spawn(70);

  function setSpeedFromWPM(wpm) {
    baseSpeed = Math.min(1.8, 0.25 + wpm/200); // faster with higher WPM
    particles.forEach(p => {
      const angle = Math.atan2(p.vy, p.vx);
      p.vx = Math.cos(angle) * baseSpeed * (Math.random()*1.2+0.6);
      p.vy = Math.sin(angle) * baseSpeed * (Math.random()*1.2+0.6);
    });
  }

  function tick() {
    ctx.clearRect(0,0,w,h);
    ctx.globalCompositeOperation = "lighter";
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -5) p.x = w+5; if (p.x > w+5) p.x = -5;
      if (p.y < -5) p.y = h+5; if (p.y > h+5) p.y = -5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(0, 255, 163, ${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();

  return { setSpeedFromWPM };
})();

/*********************
 * Typing Logic
 *********************/
// Sample sentences
const sentences = [
  "The quick brown fox jumps over the lazy dog near the old oak tree.",
  "She sells seashells by the seashore while the waves crash against the rocks.",
  "A journey of a thousand miles begins with a single step forward.",
  "Technology has changed the way we communicate with each other every day.",
  "The beautiful sunset painted the sky with shades of orange and purple.",
  "Learning new skills requires patience practice and dedication to improve yourself.",
  "Music has the power to bring people together from different cultures worldwide.",
  "The library was filled with books containing stories from around the world.",
  "Cooking delicious meals for family and friends brings joy to many people.",
  "Exercise and healthy eating habits contribute to a long and happy life.",
  "The mountain climber reached the summit after hours of difficult climbing.",
  "Reading books expands your knowledge and opens doors to new possibilities.",
  "The garden bloomed with colorful flowers attracting butterflies and busy bees.",
  "Writing helps us express our thoughts and feelings in creative meaningful ways.",
  "The ocean waves crashed against the shore creating a soothing natural rhythm.",
  "Friendship is one of the most valuable treasures we can have in life.",
  "The stars shine brightly in the clear night sky above the quiet city.",
  "Education opens doors to opportunities and helps us grow as human beings.",
  "The coffee shop buzzed with conversations and the aroma of fresh beans.",
  "Dreams give us hope and motivation to work toward our future goals."
];

// Game state
let gameState = {
  mode: 'time',        // 'time' or 'words'
  timeLimit: 30,
  wordLimit: 50,
  currentTime: 30,
  isGameActive: false,
  isGameStarted: false,
  startTime: null,
  currentSentence: '',
  input: '',
  correctChars: 0,
  totalChars: 0,
  errors: 0,
  timer: null
};

// DOM
const textDisplay = document.getElementById('textDisplay');
const wordsContainer = document.getElementById('wordsContainer');
const timerElement = document.getElementById('timer');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const rawElement = document.getElementById('raw');
const resultsElement = document.getElementById('results');
const typingInput = document.getElementById('typingInput');
const progressBar = document.getElementById('progressBar');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Auth (local placeholder)
const openAuth = document.getElementById('openAuth');
const authDialog = document.getElementById('authDialog');
const authName = document.getElementById('authName');
const loginLocal = document.getElementById('loginLocal');
const userInfo = document.getElementById('userInfo');
const userNameEl = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

// History
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

// Share/Export
const shareBtn = document.getElementById('shareBtn');
const savePngBtn = document.getElementById('savePngBtn');
const savePdfBtn = document.getElementById('savePdfBtn');

// Local user (temporary until Firebase)
let currentUser = localStorage.getItem('tm_user') || null;
refreshUserUI();

/*********** Init ***********/
function initGame() {
  gameState.isGameActive = false;
  gameState.isGameStarted = false;
  gameState.input = '';
  gameState.correctChars = 0;
  gameState.totalChars = 0;
  gameState.errors = 0;
  gameState.currentTime = gameState.timeLimit;

  generateText();
  renderChars();
  updateTimer();
  updateStats();
  updateProgress(0);
  resultsElement.classList.remove('show');
  typingInput.value = '';
}

function generateText() {
  if (gameState.mode === 'words') {
    const pool = [];
    let count = 0;
    let idx = 0;
    while (count < gameState.wordLimit && idx < sentences.length) {
      const s = sentences[idx++].split(' ');
      for (const w of s) {
        if (count < gameState.wordLimit) { pool.push(w); count++; }
      }
    }
    gameState.currentSentence = pool.join(' ');
  } else {
    const rs = [];
    for (let i=0; i<5; i++) rs.push(sentences[Math.floor(Math.random()*sentences.length)]);
    gameState.currentSentence = rs.join(' ');
  }
}

function renderChars() {
  wordsContainer.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'sentence';

  const chars = [...gameState.currentSentence];
  chars.forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch;
    if (i === 0) span.classList.add('current');
    wrap.appendChild(span);
  });
  wordsContainer.appendChild(wrap);
}

function startGame() {
  if (gameState.isGameStarted) return;
  gameState.isGameStarted = true;
  gameState.isGameActive = true;
  gameState.startTime = Date.now();

  if (gameState.mode === 'time') {
    gameState.timer = setInterval(() => {
      gameState.currentTime--;
      updateTimer();
      // progress = time elapsed
      const elapsed = (gameState.timeLimit - gameState.currentTime) / gameState.timeLimit;
      updateProgress(Math.min(1, Math.max(0, elapsed)));
      if (gameState.currentTime <= 0) endGame();
    }, 1000);
  }
}

function endGame() {
  gameState.isGameActive = false;
  if (gameState.timer) clearInterval(gameState.timer);
  calculateFinal();
  showResults();
  saveHistoryEntry(); // local (will go to Firebase next)
}

function updateTimer() {
  timerElement.textContent = gameState.currentTime;
}

function updateStats() {
  if (gameState.isGameStarted && gameState.startTime) {
    const elapsedMin = Math.max(0.01, (Date.now() - gameState.startTime) / 1000 / 60);
    const grossWPM = Math.round((gameState.totalChars / 5) / elapsedMin) || 0;
    const netWPM = Math.max(0, Math.round(((gameState.totalChars / 5) - gameState.errors) / elapsedMin) || 0);
    const accuracy = gameState.totalChars > 0 ? Math.round((gameState.correctChars / gameState.totalChars) * 100) : 100;

    wpmElement.textContent = netWPM;
    rawElement.textContent = grossWPM;
    accuracyElement.textContent = accuracy;

    // Animate particles with WPM
    fx.setSpeedFromWPM(netWPM);
  }
}

function updateProgress(value01) {
  progressBar.style.width = `${Math.round(value01 * 100)}%`;
}

function calculateFinal() {
  const elapsedMin = gameState.mode === 'time'
    ? Math.max(0.01, (gameState.timeLimit - gameState.currentTime) / 60)
    : Math.max(0.01, (Date.now() - gameState.startTime) / 1000 / 60);

  const grossWPM = Math.round((gameState.totalChars / 5) / elapsedMin) || 0;
  const netWPM = Math.max(0, Math.round(((gameState.totalChars / 5) - gameState.errors) / elapsedMin) || 0);
  const accuracy = gameState.totalChars > 0 ? Math.round((gameState.correctChars / gameState.totalChars) * 100) : 100;

  document.getElementById('finalWpm').textContent = netWPM;
  document.getElementById('finalRaw').textContent = grossWPM;
  document.getElementById('finalAccuracy').textContent = accuracy;
  document.getElementById('finalTime').textContent = gameState.mode === 'time'
    ? (gameState.timeLimit - gameState.currentTime)
    : Math.round((Date.now() - gameState.startTime) / 1000);
}

function showResults() { resultsElement.classList.add('show'); }
function restartTest() { initGame(); }

/*********** Input handling (with visible caret) ***********/
typingInput.addEventListener('input', (e) => {
  if (!gameState.isGameStarted) startGame();
  if (!gameState.isGameActive) return;

  const val = e.target.value;
  const chars = document.querySelectorAll('.char');

  gameState.totalChars = val.length;
  gameState.errors = 0;

  for (let i=0; i<chars.length; i++) {
    const ch = chars[i];
    ch.classList.remove('correct', 'incorrect', 'current');
    if (i < val.length) {
      if (val[i] === gameState.currentSentence[i]) {
        ch.classList.add('correct');
      } else {
        ch.classList.add('incorrect');
        gameState.errors++;
      }
    } else if (i === val.length) {
      ch.classList.add('current'); // caret here
    }
  }
  gameState.correctChars = Math.max(0, gameState.totalChars - gameState.errors);

  // Progress for words mode = chars progress
  if (gameState.mode === 'words') {
    const p = Math.min(1, gameState.totalChars / gameState.currentSentence.length);
    updateProgress(p);
  }

  updateStats();

  // Complete if typed all characters (words mode)
  if (gameState.mode === 'words' && val.length >= gameState.currentSentence.length) {
    endGame();
  }
});

typingInput.addEventListener('keydown', (e) => {
  if (!gameState.isGameActive) return;
  // Stop extra typing beyond length in words mode
  if (gameState.mode === 'words' && e.key !== 'Backspace' && typingInput.value.length >= gameState.currentSentence.length) {
    e.preventDefault();
  }
});

/*********** Controls ***********/
document.querySelectorAll('.time-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.word-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameState.mode = 'time';
    gameState.timeLimit = parseInt(btn.dataset.time);
    initGame();
  });
});

document.querySelectorAll('.word-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.word-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameState.mode = 'words';
    gameState.wordLimit = parseInt(btn.dataset.words);
    initGame();
  });
});

startBtn.addEventListener('click', () => { typingInput.focus(); startGame(); });
restartBtn.addEventListener('click', () => { restartTest(); typingInput.focus(); });

/*********** Results: share & export ***********/
shareBtn.addEventListener('click', async () => {
  const wpm = document.getElementById('finalWpm').textContent;
  const acc = document.getElementById('finalAccuracy').textContent;
  const time = document.getElementById('finalTime').textContent;
  const text = `I just typed at ${wpm} WPM with ${acc}% accuracy in ${time}s on TypeMaster!`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'TypeMaster Result', text });
    } catch {}
  } else {
    alert(text);
  }
});

async function captureElementPNG(el, filename="typemaster-result.png") {
  const canvas = await html2canvas(el, { backgroundColor: null, useCORS: true });
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename; a.click();
}

savePngBtn.addEventListener('click', () => {
  captureElementPNG(document.getElementById('results'));
});

savePdfBtn.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const el = document.getElementById('results');
  const canvas = await html2canvas(el, { backgroundColor: "#0e151d", useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const scale = pageWidth / canvas.width;
  pdf.addImage(imgData, 'PNG', 20, 20, canvas.width*scale-40, canvas.height*scale-40);
  pdf.save('typemaster-result.pdf');
});

/*********** History (local for now) ***********/
function entryKeyPrefix() {
  return currentUser ? `tm_hist_${currentUser}` : `tm_hist_guest`;
}

function loadHistory() {
  const raw = localStorage.getItem(entryKeyPrefix());
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveHistory(list) {
  localStorage.setItem(entryKeyPrefix(), JSON.stringify(list.slice(0, 50))); // keep last 50
}
function renderHistory() {
  const list = loadHistory();
  historyList.innerHTML = '';
  if (!list.length) {
    historyList.classList.add('empty');
    historyList.textContent = 'No results yet.';
    return;
  }
  historyList.classList.remove('empty');
  list.forEach(it => {
    const row = document.createElement('div');
    row.className = 'history-row';
    row.innerHTML = `
      <div><strong>${it.wpm} WPM</strong> &middot; ${it.acc}% acc &middot; raw ${it.raw} &middot; ${it.mode}(${it.len})</div>
      <div style="opacity:.8;font-size:.9rem">${new Date(it.ts).toLocaleString()}</div>
    `;
    historyList.appendChild(row);
  });
}

function saveHistoryEntry() {
  const wpm = +document.getElementById('finalWpm').textContent || 0;
  const raw = +document.getElementById('finalRaw').textContent || 0;
  const acc = +document.getElementById('finalAccuracy').textContent || 0;
  const len = gameState.mode === 'time' ? `${gameState.timeLimit}s` : `${gameState.wordLimit}w`;

  const list = loadHistory();
  list.unshift({
    wpm, raw, acc, mode: gameState.mode, len,
    ts: Date.now(),
  });
  saveHistory(list);
  renderHistory();
}

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(entryKeyPrefix());
  renderHistory();
});

/*********** Auth (local placeholder) ***********/
function refreshUserUI() {
  if (currentUser) {
    userInfo.classList.remove('hidden');
    openAuth.classList.add('hidden');
    userNameEl.textContent = currentUser;
  } else {
    userInfo.classList.add('hidden');
    openAuth.classList.remove('hidden');
  }
  renderHistory();
}

openAuth.addEventListener('click', () => {
  authName.value = currentUser || '';
  authDialog.showModal();
});
loginLocal.addEventListener('click', (e) => {
  e.preventDefault();
  const name = (authName.value || '').trim();
  if (!name) return;
  currentUser = name;
  localStorage.setItem('tm_user', name);
  authDialog.close();
  refreshUserUI();
});
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('tm_user');
  refreshUserUI();
});

/*********** Boot ***********/
initGame();
renderHistory();
