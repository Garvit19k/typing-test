// Sample texts for typing test
const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once.",
    "Programming is the process of creating a set of instructions that tell a computer how to perform a task. Programming can be done using a variety of computer programming languages.",
    "The Internet is a global network of billions of computers and other electronic devices. With the Internet, it's possible to access almost any information, communicate with anyone else in the world, and do much more.",
    "Artificial intelligence is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents.",
    "Cloud computing is the on-demand availability of computer system resources, especially data storage and computing power, without direct active management by the user."
];

// API Base URL
const API_URL = window.location.origin;

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
const completionEmojis = ['🎯', '⭐', '✨', '🌟', '💫', '🎨', '🎪', '��', '🎪', '🎯'];

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
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
    document.getElementById('typing-container').classList.remove('hidden');
    
    if (mode === 'game') {
        // Enable game mode specific features
        enableGameMode();
    } else {
        // Enable practice mode specific features
        enablePracticeMode();
    }
}

function backToModes() {
    document.getElementById('typing-container').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    resetTest();
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

// Authentication Functions
async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            document.querySelector('[data-tab="login"]').click();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error during registration');
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            currentUser = username;
            usernameDisplay.textContent = username;
            authContainer.classList.add('hidden');
            document.getElementById('mode-selection').classList.remove('hidden');
            loadLeaderboard();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error during login');
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
    
    // Update leaderboard
    loadLeaderboard();
}

function updateScore(wpm) {
    fetch(`${API_URL}/api/update-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, score: wpm })
    });
}

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
            
            // Check for word completion
            if (inputText[i] === ' ' || i === currentText.length - 1) {
                showCompletionEmoji(span);
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

function showCompletionEmoji(span) {
    const emoji = document.createElement('div');
    emoji.className = 'word-complete';
    emoji.textContent = completionEmojis[Math.floor(Math.random() * completionEmojis.length)];
    emoji.style.left = `${span.offsetLeft}px`;
    emoji.style.top = `${span.offsetTop}px`;
    textDisplay.appendChild(emoji);
    
    // Remove emoji after animation
    setTimeout(() => {
        emoji.remove();
    }, 1000);
}

// Leaderboard Functions
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/api/leaderboard`);
        const data = await response.json();
        
        leaderboardList.innerHTML = '';
        data.forEach((user, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span>${index + 1}</span>
                <span>${user.username}</span>
                <span>${user.highScore} WPM</span>
            `;
            leaderboardList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
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