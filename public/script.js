// Sample texts for typing test
const sampleTexts = [
    "The quick brown fox jumps over the lazy dog.",
    "Programming is the process of creating a set of instructions that tell a computer how to perform a task.",
    "The Internet is a global network of billions of computers and other electronic devices.",
    "Artificial intelligence is intelligence demonstrated by machines, unlike natural intelligence displayed by humans.",
    "Cloud computing is the on-demand availability of computer system resources."
];

// Update API Base URL to use Vercel deployment
const API_URL = window.location.origin;

// Add this at the top of your script.js, after the API_URL declaration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Add theme-related code at the top after API_URL declaration
const themes = {
    kawaii: {
        emojis: ['🌸', '✨', '🎀', '🌟', '💖', '🦄', '🌈', '🍡'],
        completionMessages: [
            "Kawaii! ✨",
            "So cute! 🌸",
            "Perfect! 💖",
            "Amazing! 🦄"
        ]
    },
    cool: {
        emojis: ['⭐', '✨', '💫', '🌟', '⚡', '🔥', '💪', '🎯'],
        completionMessages: [
            "Awesome! 🔥",
            "Fantastic! ⚡",
            "Great job! 💫",
            "Keep it up! 💪"
        ]
    },
    pastel: {
        emojis: ['🍭', '🌸', '🌺', '🌷', '🎨', '🌅', '🌊', '🍡'],
        completionMessages: [
            "Lovely! 🌸",
            "Beautiful! 🌺",
            "Wonderful! 🎨",
            "Delightful! 🌷"
        ]
    }
};

let currentTheme = 'kawaii';

function setTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('theme-kawaii', 'theme-cool', 'theme-pastel');
    // Add new theme class
    document.body.classList.add(`theme-${theme}`);
    currentTheme = theme;
    
    // Update decorations
    updateDecorations();
    
    // Update gender button gradients
    const genderButtons = document.querySelectorAll('.gender-option');
    genderButtons.forEach(button => {
        button.style.transition = 'background 0.3s ease';
    });
    
    // Save theme preference
    localStorage.setItem('preferred-theme', theme);
}

function updateDecorations() {
    const decorations = document.querySelectorAll('.kawaii-decoration');
    const themeEmojis = themes[currentTheme].emojis;
    
    decorations.forEach((decoration, index) => {
        decoration.textContent = themeEmojis[index % themeEmojis.length];
    });
}

// Helper function for API calls with retry logic
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying... ${retries} attempts left`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}

// DOM Elements
const authContainer = document.getElementById('auth-container');
const typingContainer = document.getElementById('typing-container');
const leaderboardContainer = document.getElementById('leaderboard-container');
const textDisplay = document.getElementById('text-display');
const textInput = document.getElementById('text-input');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const timeDisplay = document.getElementById('time');
const usernameDisplay = document.getElementById('username-display');
const leaderboardList = document.getElementById('leaderboard-list');
const timeButtons = document.querySelectorAll('.time-btn');

// Variables
let currentUser = null;
let timer = null;
let timeLeft = 120; // Default to 2 minutes
let isTestActive = false;
let isPaused = false;
let startTime = null;
let pauseStartTime = null;
let totalPausedTime = 0;
let currentText = '';
let correctCharacters = 0;
let totalCharacters = 0;
let selectedTime = 120; // Default to 2 minutes

// Emojis for word completion
const completionEmojis = ['🎯', '⭐', '✨', '🌟', '💫', '🎨', '🎪', '🎭'];

// Dog Rescue Game Variables
const dogWords = [
    "puppy", "rescue", "treat", "leash", "fetch", "bark", "play", "friend",
    "loyal", "happy", "cuddle", "paw", "bone", "walk", "love", "care",
    "protect", "shelter", "home", "family", "safe", "warm", "gentle", "kind"
];

let dogGameActive = false;
let dogsRescued = 0;
let rescueTimer = null;
let currentDog = null;
let rescueTimeLeft = 60;
let missedDogs = 0;

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Form submission handlers
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await login();
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await register();
});

// Time option selection
timeButtons.forEach(button => {
    button.addEventListener('click', () => {
        timeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedTime = parseInt(button.dataset.time);
        timeLeft = selectedTime;
        timeDisplay.textContent = formatTime(timeLeft);
    });
});

// Mode selection handling
function selectMode(mode) {
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('typing-container').classList.add('hidden');
    document.getElementById('dog-rescue-container').classList.add('hidden');
    
    if (mode === 'dog-rescue') {
        document.getElementById('dog-rescue-container').classList.remove('hidden');
        setupDogGame();
    } else if (mode === 'practice') {
        document.getElementById('typing-container').classList.remove('hidden');
        enablePracticeMode();
    } else if (mode === 'game') {
        document.getElementById('typing-container').classList.remove('hidden');
        enableGameMode();
    }
}

function backToModes() {
    document.getElementById('typing-container').classList.add('hidden');
    document.getElementById('dog-rescue-container').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    resetTest();
    if (dogGameActive) {
        endDogGame();
    }
}

function enableGameMode() {
    // Add game-specific features
    currentText = getGameText();
    formatTextDisplay(currentText);
}

function enablePracticeMode() {
    // Use regular practice text
    currentText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    formatTextDisplay(currentText);
}

function getGameText() {
    // Game mode specific texts with increasing difficulty
    const gameTexts = [
        "The quick brown fox jumps over the lazy dog.",
        "Pack my box with five dozen liquor jugs.",
        "How vexingly quick daft zebras jump!",
        "The five boxing wizards jump quickly.",
        "Sphinx of black quartz, judge my vow."
    ];
    return gameTexts[Math.floor(Math.random() * gameTexts.length)];
}

// Add gender selection handling
document.querySelectorAll('.gender-option').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.gender-option').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

// Authentication Functions
async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const gender = document.querySelector('.gender-option.active').dataset.gender;

    try {
        const registerBtn = document.querySelector('#register-form button[type="submit"]');
        registerBtn.textContent = 'Creating Account...';
        registerBtn.disabled = true;

        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, gender })
        });

        console.log('Register response:', response.status);
        const data = await response.json();
        console.log('Register data:', data);

        if (response.ok) {
            alert('Registration successful! Please login.');
            document.querySelector('[data-tab="login"]').click();
        } else {
            alert(data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error during registration. Please try again.');
    } finally {
        const registerBtn = document.querySelector('#register-form button[type="submit"]');
        registerBtn.textContent = 'Register 🌟';
        registerBtn.disabled = false;
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    try {
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;

        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = {
                username: data.username,
                token: data.token
            };
            
            // Store token in localStorage for persistence
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            
            authContainer.classList.add('hidden');
            document.getElementById('mode-selection').classList.remove('hidden');
            usernameDisplay.textContent = `Welcome, ${currentUser.username}!`;
            loadLeaderboard();
        } else {
            throw new Error(data.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Error during login. Please try again.');
    } finally {
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        loginBtn.textContent = 'Login ✨';
        loginBtn.disabled = false;
    }
}

function logout() {
    currentUser = null;
    document.getElementById('mode-selection').classList.add('hidden');
    typingContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    resetTest();
}

// Typing Test Functions
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? 
            `${minutes}m ${remainingSeconds}s` : 
            `${minutes}m`;
    }
}

function startTest() {
    if (isTestActive) return;
    
    isTestActive = true;
    isPaused = false;
    startTime = Date.now();
    timeLeft = selectedTime;
    correctCharacters = 0;
    totalCharacters = 0;
    totalPausedTime = 0;
    
    // Select random text and format it
    currentText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    formatTextDisplay(currentText);
    
    textInput.value = '';
    textInput.disabled = false;
    textInput.focus();
    
    startBtn.textContent = 'Test in Progress...';
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    // Disable time selection during test
    timeButtons.forEach(btn => btn.disabled = true);
    
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="fill"></div>';
    textDisplay.after(progressBar);
    
    // Start timer
    timer = setInterval(updateTimer, 1000);
}

function formatTextDisplay(text) {
    textDisplay.innerHTML = text.split('').map((char, index) => 
        `<span data-index="${index}">${char}</span>`
    ).join('');
}

function togglePause() {
    if (!isTestActive) return;
    
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    pauseBtn.classList.toggle('paused');
    textInput.disabled = isPaused;
    
    if (isPaused) {
        clearInterval(timer);
        pauseStartTime = Date.now();
    } else {
        if (pauseStartTime) {
            totalPausedTime += Date.now() - pauseStartTime;
            pauseStartTime = null;
        }
        timer = setInterval(updateTimer, 1000);
        textInput.focus();
    }
}

function updateTimer() {
    timeLeft--;
    timeDisplay.textContent = formatTime(timeLeft);
    
    if (timeLeft <= 0) {
        endTest();
    }
}

function endTest() {
    isTestActive = false;
    clearInterval(timer);
    textInput.disabled = true;
    startBtn.textContent = 'Start Test';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    pauseBtn.classList.remove('paused');
    
    // Re-enable time selection
    timeButtons.forEach(btn => btn.disabled = false);
    
    // Calculate final WPM and accuracy
    const timeElapsed = ((Date.now() - startTime - totalPausedTime) / 1000) / 60; // in minutes
    const wpm = Math.round((correctCharacters / 5) / timeElapsed);
    const accuracy = Math.round((correctCharacters / totalCharacters) * 100);
    
    // Update score in database
    updateScore(wpm);
    
    // Show simple completion message
    alert(`Test Complete!\nWPM: ${wpm}\nAccuracy: ${accuracy}%`);
    
    // Update leaderboard
    loadLeaderboard();
}

// Add local leaderboard functions
function saveLocalScore(score) {
    const scoreEntry = {
        username: currentUser.username,
        score: score,
        date: new Date().toISOString()
    };
    
    localHighScores.push(scoreEntry);
    localHighScores.sort((a, b) => b.score - a.score);
    localHighScores = localHighScores.slice(0, 10); // Keep top 10
    
    localStorage.setItem('typingTestScores', JSON.stringify(localHighScores));
    loadLocalLeaderboard();
}

function loadLocalLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    localHighScores.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span>${index + 1}</span>
            <span>${entry.username}</span>
            <span>${entry.score} WPM</span>
        `;
        leaderboardList.appendChild(item);
    });
}

// Modify updateScore function
async function updateScore(wpm) {
    try {
        await fetch('/api/scores', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ 
                username: currentUser.username, 
                wpm,
                accuracy: Math.round((correctCharacters / totalCharacters) * 100)
            })
        });
        loadLeaderboard();
    } catch (error) {
        console.error('Error updating score:', error);
    }
}

// Modify loadLeaderboard function
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        
        data.forEach((user, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span>${index + 1}</span>
                <span>${user.username}</span>
                <span>${user.wpm} WPM</span>
            `;
            leaderboardList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Check backend availability on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token and auto-login
        fetch('/api/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                currentUser = {
                    username: data.username,
                    token: token
                };
                authContainer.classList.add('hidden');
                document.getElementById('mode-selection').classList.remove('hidden');
                usernameDisplay.textContent = `Welcome, ${currentUser.username}!`;
                loadLeaderboard();
            }
        })
        .catch(() => {
            localStorage.removeItem('token');
        });
    }
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }
});

// Handle input with error highlighting and word completion
textInput.addEventListener('input', () => {
    if (!isTestActive || isPaused) return;
    
    const inputText = textInput.value;
    totalCharacters = inputText.length;
    correctCharacters = 0;
    
    // Reset all spans
    textDisplay.querySelectorAll('span').forEach(span => {
        span.classList.remove('correct', 'error', 'current');
    });
    
    // Check each character
    for (let i = 0; i < inputText.length; i++) {
        const span = textDisplay.querySelector(`span[data-index="${i}"]`);
        if (!span) continue;
        
        if (inputText[i] === currentText[i]) {
            span.classList.add('correct');
            correctCharacters++;
            
            // Check for word completion (when space is typed or at the end)
            if (inputText[i] === ' ' || i === currentText.length - 1) {
                // Get the word that was just completed
                let wordEndIndex = i;
                let wordStartIndex = i;
                while (wordStartIndex > 0 && currentText[wordStartIndex - 1] !== ' ') {
                    wordStartIndex--;
                }
                
                // Check if the word was typed correctly
                const typedWord = inputText.slice(wordStartIndex, wordEndIndex);
                const correctWord = currentText.slice(wordStartIndex, wordEndIndex);
                
                if (typedWord === correctWord) {
                    showCompletionEmoji(span);
                }
            }
        } else {
            span.classList.add('error');
        }
    }
    
    // Show current position
    const currentSpan = textDisplay.querySelector(`span[data-index="${inputText.length}"]`);
    if (currentSpan) {
        currentSpan.classList.add('current');
    }
    
    // Calculate and update WPM and accuracy
    const timeElapsed = ((Date.now() - startTime - totalPausedTime) / 1000) / 60;
    const wpm = Math.round((correctCharacters / 5) / timeElapsed);
    const accuracy = Math.round((correctCharacters / totalCharacters) * 100);
    
    wpmDisplay.textContent = wpm;
    accuracyDisplay.textContent = `${accuracy}%`;
    
    // Update progress bar
    const progressPercentage = (inputText.length / currentText.length) * 100;
    const progressBar = document.querySelector('.progress-bar .fill');
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
    }
    
    // Check if test is complete
    if (inputText.length === currentText.length) {
        endTest();
    }
});

// Modify the showCompletionEmoji function to use theme-specific emojis
function showCompletionEmoji(span) {
    const emoji = document.createElement('div');
    emoji.className = 'word-complete-emoji';
    
    // Get random emoji from current theme
    const themeEmojis = themes[currentTheme].emojis;
    emoji.textContent = themeEmojis[Math.floor(Math.random() * themeEmojis.length)];
    
    // Get the position relative to the viewport
    const rect = span.getBoundingClientRect();
    
    // Calculate position to keep emoji within the typing container
    const typingContainer = document.querySelector('.typing-container');
    const containerRect = typingContainer.getBoundingClientRect();
    
    let left = Math.min(
        Math.max(rect.right, containerRect.left + 20),
        containerRect.right - 20
    );
    
    let top = Math.min(
        Math.max(rect.top, containerRect.top + 20),
        containerRect.bottom - 40
    );
    
    emoji.style.left = `${left}px`;
    emoji.style.top = `${top}px`;
    
    document.body.appendChild(emoji);
    
    // Remove emoji after animation
    setTimeout(() => emoji.remove(), 1000);
}

// Modify the showVictoryCelebration function to use theme-specific messages
function showVictoryCelebration(stats) {
    const celebration = document.createElement('div');
    celebration.className = 'victory-celebration';
    
    // Get random completion message from current theme
    const messages = themes[currentTheme].completionMessages;
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    celebration.innerHTML = `
        <div class="victory-content">
            <h1 class="victory-title">${message}</h1>
            <div class="victory-stats">
                <div class="victory-stat">
                    <span>WPM</span>
                    <span>${stats.wpm}</span>
                </div>
                <div class="victory-stat">
                    <span>Accuracy</span>
                    <span>${stats.accuracy}%</span>
                </div>
                <div class="victory-stat">
                    <span>Time</span>
                    <span>${formatTime(stats.time)}</span>
                </div>
            </div>
            <div class="victory-buttons">
                <button class="theme-btn" onclick="tryAgain()">Try Again ${themes[currentTheme].emojis[0]}</button>
                <button class="theme-btn" onclick="backToModes()">Change Mode ${themes[currentTheme].emojis[1]}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(celebration);
    
    // Add theme-specific confetti
    for (let i = 0; i < 50; i++) {
        createConfetti();
    }
    
    setTimeout(() => celebration.classList.add('show'), 10);
}

// Function to get a random typing tip
function getRandomTypingTip() {
    const tips = [
        "Keep your fingers on the home row keys (ASDF JKL;) for better accuracy.",
        "Focus on accuracy first, speed will come naturally with practice.",
        "Take short breaks every 20-30 minutes to prevent fatigue.",
        "Practice regularly, even if just for 10 minutes a day.",
        "Look at the screen, not your hands, while typing.",
        "Maintain good posture to prevent strain and improve performance.",
        "Use all your fingers, including your pinkies, for faster typing.",
        "Try to maintain a steady rhythm while typing."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}

// Function to try the test again
function tryAgain() {
    closeVictoryCelebration();
    resetTest();
    startTest();
}

function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Random position and color
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 3}s`;
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
    
    document.querySelector('.victory-celebration').appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => confetti.remove(), 3000);
}

function closeVictoryCelebration() {
    const celebration = document.querySelector('.victory-celebration');
    celebration.classList.remove('show');
    setTimeout(() => celebration.remove(), 500);
}

// Dog Rescue Game Functions
function setupDogGame() {
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '';
    dogsRescued = 0;
    missedDogs = 0;
    rescueTimeLeft = 60;
    dogGameActive = false;
    currentDog = null;
    
    // Clear any existing event listeners
    const startBtn = document.getElementById('rescue-start-btn');
    const input = document.getElementById('rescue-input');
    const newStartBtn = startBtn.cloneNode(true);
    const newInput = input.cloneNode(true);
    startBtn.parentNode.replaceChild(newStartBtn, startBtn);
    input.parentNode.replaceChild(newInput, input);
    
    // Add event listeners
    newStartBtn.addEventListener('click', startDogGame);
    newInput.addEventListener('input', handleDogGameInput);
    
    // Reset UI
    document.getElementById('dogs-rescued').textContent = '0';
    document.getElementById('rescue-time').textContent = '60s';
    document.querySelector('.rescue-progress .fill').style.width = '0%';
    
    // Enable/disable appropriate elements
    newInput.disabled = true;
    newStartBtn.disabled = false;
}

function startDogGame() {
    if (dogGameActive) return;
    
    dogGameActive = true;
    const input = document.getElementById('rescue-input');
    input.value = '';
    input.disabled = false;
    input.focus();
    
    document.getElementById('rescue-start-btn').disabled = true;
    
    spawnNewDog();
    
    if (rescueTimer) {
        clearInterval(rescueTimer);
    }
    
    rescueTimer = setInterval(() => {
        rescueTimeLeft--;
        document.getElementById('rescue-time').textContent = `${rescueTimeLeft}s`;
        
        if (rescueTimeLeft <= 0) {
            endDogGame();
        }
    }, 1000);
}

function spawnNewDog() {
    if (currentDog) {
        missedDogs++;
        currentDog.element.remove();
    }
    
    const gameArea = document.getElementById('game-area');
    const word = dogWords[Math.floor(Math.random() * dogWords.length)];
    
    const dogElement = document.createElement('div');
    dogElement.className = 'dog-character';
    dogElement.style.left = Math.random() * 80 + 10 + '%';
    dogElement.style.bottom = '20px';
    
    // Add dog emoji
    const dogEmoji = document.createElement('div');
    dogEmoji.className = 'dog-emoji';
    dogEmoji.textContent = '🐕';
    dogElement.appendChild(dogEmoji);
    
    const wordBubble = document.createElement('div');
    wordBubble.className = 'word-bubble';
    wordBubble.textContent = word;
    
    dogElement.appendChild(wordBubble);
    gameArea.appendChild(dogElement);
    
    currentDog = {
        element: dogElement,
        word: word,
        progress: 0
    };
}

function handleDogGameInput(e) {
    if (!dogGameActive || !currentDog) return;
    
    const input = e.target.value.toLowerCase();
    const targetWord = currentDog.word;
    
    let correctChars = 0;
    for (let i = 0; i < input.length && i < targetWord.length; i++) {
        if (input[i] === targetWord[i]) {
            correctChars++;
        }
    }
    
    const progress = (correctChars / targetWord.length) * 100;
    currentDog.progress = progress;
    
    // Update progress bar
    const progressBar = document.querySelector('.rescue-progress .fill');
    progressBar.style.width = `${progress}%`;
    
    // Move dog up based on progress
    currentDog.element.style.bottom = `${20 + (progress * 0.6)}px`;
    
    if (input === targetWord) {
        rescueDog();
    }
}

function rescueDog() {
    dogsRescued++;
    updateDogGameStats();
    
    // Show celebration emoji
    const celebration = document.createElement('div');
    celebration.className = 'rescue-celebration';
    celebration.textContent = '🐕✨';
    celebration.style.left = currentDog.element.style.left;
    celebration.style.top = currentDog.element.style.top;
    document.querySelector('.dog-game-container').appendChild(celebration);
    
    // Animate dog rescue
    currentDog.element.style.transform = 'translateY(-100px) scale(1.2)';
    currentDog.element.style.opacity = '0';
    
    // Play success sound
    const successSound = new Audio('data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=');
    successSound.play();
    
    setTimeout(() => {
        currentDog.element.remove();
        document.getElementById('rescue-input').value = '';
        spawnNewDog();
        
        // Remove celebration after animation
        setTimeout(() => celebration.remove(), 1000);
    }, 500);
}

function updateDogGameStats() {
    document.getElementById('dogs-rescued').textContent = dogsRescued;
    document.getElementById('rescue-time').textContent = `${rescueTimeLeft}s`;
}

function endDogGame() {
    dogGameActive = false;
    clearInterval(rescueTimer);
    
    if (currentDog) {
        currentDog.element.remove();
        currentDog = null;
    }
    
    document.getElementById('rescue-input').disabled = true;
    document.getElementById('rescue-start-btn').disabled = false;
    
    // Calculate accuracy (avoid division by zero)
    const totalAttempts = dogsRescued + missedDogs;
    const accuracy = totalAttempts > 0 ? Math.round((dogsRescued / totalAttempts) * 100) : 100;
    
    // Show victory celebration
    showVictoryCelebration({
        wpm: dogsRescued,
        accuracy: accuracy,
        time: 60
    });
    
    // Update high score
    const currentHighScore = parseInt(document.getElementById('rescue-high-score').textContent) || 0;
    if (dogsRescued > currentHighScore) {
        document.getElementById('rescue-high-score').textContent = dogsRescued;
        updateRescueLeaderboard(dogsRescued);
    }
    
    // Reset game variables
    dogsRescued = 0;
    missedDogs = 0;
    rescueTimeLeft = 60;
    updateDogGameStats();
}

async function updateRescueLeaderboard(score) {
    try {
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ 
                username: currentUser.username, 
                score: score,
                gameMode: 'dog-rescue'
            })
        });
        
        if (response.ok) {
            loadRescueLeaderboard();
        }
    } catch (error) {
        console.error('Error updating rescue leaderboard:', error);
    }
}

async function loadRescueLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard?mode=dog-rescue');
        const data = await response.json();
        
        const leaderboardList = document.getElementById('rescue-leaderboard-list');
        leaderboardList.innerHTML = '';
        
        data.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span>${index + 1}</span>
                <span>${entry.username}</span>
                <span>${entry.highScore} dogs</span>
            `;
            leaderboardList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading rescue leaderboard:', error);
    }
}

// Event Listeners
startBtn.addEventListener('click', startTest);
pauseBtn.disabled = true;

// Initialize
function resetTest() {
    isTestActive = false;
    isPaused = false;
    clearInterval(timer);
    timeLeft = selectedTime;
    timeDisplay.textContent = formatTime(timeLeft);
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '0%';
    textInput.value = '';
    textInput.disabled = true;
    textDisplay.textContent = '';
    startBtn.textContent = 'Start Test';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    pauseBtn.classList.remove('paused');
    
    // Remove progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.remove();
    }
    
    // Re-enable time selection
    timeButtons.forEach(btn => btn.disabled = false);
}

// About Modal Functions
function showAbout() {
    const modal = document.getElementById('about-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAbout();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAbout();
        }
    });
}

function closeAbout() {
    const modal = document.getElementById('about-modal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }, 300);
}

// Add these functions after API_URL declaration
async function checkServerStatus() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        return data.status === 'OK';
    } catch (error) {
        return false;
    }
}

async function waitForServer(maxAttempts = 5) {
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'server-loading';
    loadingMessage.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f0f0f0; padding: 10px; border-radius: 5px; z-index: 1000;';
    document.body.appendChild(loadingMessage);

    for (let i = 0; i < maxAttempts; i++) {
        loadingMessage.textContent = `Server is starting up... (Attempt ${i + 1}/${maxAttempts})`;
        const isReady = await checkServerStatus();
        if (isReady) {
            loadingMessage.textContent = 'Server is ready!';
            setTimeout(() => loadingMessage.remove(), 2000);
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    loadingMessage.textContent = 'Server seems to be taking longer than usual...';
    return false;
} 