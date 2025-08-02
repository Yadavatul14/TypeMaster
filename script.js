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
    mode: 'time', // 'time' or 'words'
    timeLimit: 30,
    wordLimit: 50,
    currentTime: 30,
    currentWordIndex: 0,
    currentCharIndex: 0,
    isGameActive: false,
    isGameStarted: false,
    startTime: null,
    currentSentence: '',
    words: [],
    input: '',
    correctChars: 0,
    totalChars: 0,
    errors: 0,
    timer: null
};

// DOM elements
const textDisplay = document.getElementById('textDisplay');
const wordsContainer = document.getElementById('wordsContainer');
const timerElement = document.getElementById('timer');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const rawElement = document.getElementById('raw');
const resultsElement = document.getElementById('results');
const typingInput = document.getElementById('typingInput');

// Initialize game
function initGame() {
    gameState.isGameActive = false;
    gameState.isGameStarted = false;
    gameState.currentWordIndex = 0;
    gameState.currentCharIndex = 0;
    gameState.input = '';
    gameState.correctChars = 0;
    gameState.totalChars = 0;
    gameState.errors = 0;
    gameState.currentTime = gameState.timeLimit;
    
    generateWords();
    displayWords();
    updateTimer();
    updateStats();
    resultsElement.classList.remove('show');
    typingInput.value = '';
    typingInput.focus();
    
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
}

function generateWords() {
    if (gameState.mode === 'words') {
        // For word mode, create sentences until we have enough words
        gameState.words = [];
        let totalWords = 0;
        let sentenceIndex = 0;
        
        while (totalWords < gameState.wordLimit && sentenceIndex < sentences.length) {
            const sentence = sentences[sentenceIndex];
            const wordsInSentence = sentence.split(' ');
            
            for (let word of wordsInSentence) {
                if (totalWords < gameState.wordLimit) {
                    gameState.words.push(word);
                    totalWords++;
                }
            }
            sentenceIndex++;
        }
        
        gameState.currentSentence = gameState.words.join(' ');
    } else {
        // For time mode, use full sentences
        const randomSentences = [];
        for (let i = 0; i < 5; i++) {
            const randomIndex = Math.floor(Math.random() * sentences.length);
            randomSentences.push(sentences[randomIndex]);
        }
        gameState.currentSentence = randomSentences.join(' ');
        gameState.words = gameState.currentSentence.split(' ');
    }
}

function displayWords() {
    wordsContainer.innerHTML = '';
    
    // Create a single text element for the entire sentence
    const sentenceElement = document.createElement('div');
    sentenceElement.className = 'sentence';
    sentenceElement.style.fontSize = '1.5rem';
    sentenceElement.style.lineHeight = '1.8';
    sentenceElement.style.color = '#646669';
    
    // Split sentence into characters for individual highlighting
    const chars = gameState.currentSentence.split('');
    chars.forEach((char, index) => {
        const charElement = document.createElement('span');
        charElement.className = 'char';
        charElement.textContent = char;
        charElement.setAttribute('data-index', index);
        
        if (index === 0) {
            charElement.classList.add('current');
        }
        
        sentenceElement.appendChild(charElement);
    });
    
    wordsContainer.appendChild(sentenceElement);
}

function startGame() {
    if (!gameState.isGameStarted) {
        gameState.isGameStarted = true;
        gameState.isGameActive = true;
        gameState.startTime = Date.now();
        
        if (gameState.mode === 'time') {
            gameState.timer = setInterval(() => {
                gameState.currentTime--;
                updateTimer();
                
                if (gameState.currentTime <= 0) {
                    endGame();
                }
            }, 1000);
        }
    }
}

function endGame() {
    gameState.isGameActive = false;
    
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    calculateFinalStats();
    showResults();
}

function updateTimer() {
    if (gameState.mode === 'time') {
        timerElement.textContent = gameState.currentTime;
    } else {
        const remaining = Math.max(0, gameState.currentSentence.length - gameState.currentCharIndex);
        timerElement.textContent = remaining;
    }
}

function updateStats() {
    if (gameState.isGameStarted && gameState.startTime) {
        const timeElapsed = (Date.now() - gameState.startTime) / 1000 / 60; // in minutes
        const grossWPM = Math.round((gameState.totalChars / 5) / timeElapsed) || 0;
        const netWPM = Math.round(((gameState.totalChars / 5) - gameState.errors) / timeElapsed) || 0;
        const accuracy = gameState.totalChars > 0 ? Math.round((gameState.correctChars / gameState.totalChars) * 100) : 100;
        
        wpmElement.textContent = Math.max(0, netWPM);
        rawElement.textContent = grossWPM;
        accuracyElement.textContent = accuracy;
    }
}

function calculateFinalStats() {
    const timeElapsed = gameState.mode === 'time' ? 
        (gameState.timeLimit - gameState.currentTime) / 60 : 
        (Date.now() - gameState.startTime) / 1000 / 60;
    
    const grossWPM = Math.round((gameState.totalChars / 5) / timeElapsed) || 0;
    const netWPM = Math.round(((gameState.totalChars / 5) - gameState.errors) / timeElapsed) || 0;
    const accuracy = gameState.totalChars > 0 ? Math.round((gameState.correctChars / gameState.totalChars) * 100) : 100;
    
    document.getElementById('finalWpm').textContent = Math.max(0, netWPM);
    document.getElementById('finalRaw').textContent = grossWPM;
    document.getElementById('finalAccuracy').textContent = accuracy;
    document.getElementById('finalTime').textContent = gameState.mode === 'time' ? 
        (gameState.timeLimit - gameState.currentTime) : 
        Math.round((Date.now() - gameState.startTime) / 1000);
}

function showResults() {
    resultsElement.classList.add('show');
}

function restartTest() {
    initGame();
}

// Event listeners
typingInput.addEventListener('input', (e) => {
    if (!gameState.isGameStarted) {
        startGame();
    }
    
    if (!gameState.isGameActive) return;
    
    const inputValue = e.target.value;
    updateCharacterHighlighting(inputValue);
    
    // Check if sentence is complete
    if (inputValue.length >= gameState.currentSentence.length) {
        endGame();
    }
});

function updateCharacterHighlighting(inputValue) {
    const charElements = document.querySelectorAll('.char');
    
    // Reset all characters
    charElements.forEach((char, index) => {
        char.classList.remove('correct', 'incorrect', 'current');
        
        if (index < inputValue.length) {
            if (inputValue[index] === gameState.currentSentence[index]) {
                char.classList.add('correct');
                if (index === inputValue.length - 1) {
                    gameState.correctChars = inputValue.length;
                    gameState.totalChars = inputValue.length;
                    gameState.errors = 0;
                    
                    // Count errors up to current position
                    for (let i = 0; i < inputValue.length; i++) {
                        if (inputValue[i] !== gameState.currentSentence[i]) {
                            gameState.errors++;
                        }
                    }
                    gameState.correctChars = gameState.totalChars - gameState.errors;
                }
            } else {
                char.classList.add('incorrect');
            }
        } else if (index === inputValue.length) {
            char.classList.add('current');
        }
    });
    
    updateStats();
}

typingInput.addEventListener('keydown', (e) => {
    if (!gameState.isGameActive) return;
    
    // Prevent going beyond the sentence length
    if (e.key !== 'Backspace' && typingInput.value.length >= gameState.currentSentence.length) {
        e.preventDefault();
    }
});

function handleWordComplete(inputWord) {
    // This function is no longer needed with sentence-based typing
    // Keeping it for compatibility but it won't be called
}

function goToPreviousWord() {
    // This function is no longer needed with sentence-based typing
    // Keeping it for compatibility but it won't be called
}

// Control buttons
document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.word-btn').forEach(b => b.classList.remove('active'));
        
        gameState.mode = 'time';
        gameState.timeLimit = parseInt(btn.dataset.time);
        initGame();
    });
});

document.querySelectorAll('.word-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.word-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        
        gameState.mode = 'words';
        gameState.wordLimit = parseInt(btn.dataset.words);
        initGame();
    });
});

// Initialize the game
initGame();