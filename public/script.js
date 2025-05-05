// Sample texts for typing test
const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once.",
    "Programming is the process of creating a set of instructions that tell a computer how to perform a task. Programming can be done using a variety of computer programming languages.",
    "The Internet is a global network of billions of computers and other electronic devices. With the Internet, it's possible to access almost any information, communicate with anyone else in the world, and do much more.",
    "Artificial intelligence is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents.",
    "Cloud computing is the on-demand availability of computer system resources, especially data storage and computing power, without direct active management by the user."
];

// DOM Elements
const authContainer = document.getElementById('auth-container');
const typingContainer = document.getElementById('typing-container');
const leaderboardContainer = document.getElementById('leaderboard-container');
const textDisplay = document.getElementById('text-display');
const textInput = document.getElementById('text-input');
const startBtn = document.getElementById('start-btn');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const timeDisplay = document.getElementById('time');
const usernameDisplay = document.getElementById('username-display');
const leaderboardList = document.getElementById('leaderboard-list');

// Variables
let currentUser = null;
let timer = null;
let timeLeft = 60;
let isTestActive = false;
let startTime = null;
let currentText = '';
let correctCharacters = 0;
let totalCharacters = 0;

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Authentication Functions
async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('/api/register', {
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
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            currentUser = username;
            usernameDisplay.textContent = username;
            authContainer.classList.add('hidden');
            typingContainer.classList.remove('hidden');
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
    typingContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    resetTest();
}

// Typing Test Functions
function startTest() {
    if (isTestActive) return;
    
    isTestActive = true;
    startTime = Date.now();
    timeLeft = 60;
    correctCharacters = 0;
    totalCharacters = 0;
    
    // Select random text
    currentText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    textDisplay.textContent = currentText;
    textInput.value = '';
    textInput.disabled = false;
    textInput.focus();
    
    startBtn.textContent = 'Test in Progress...';
    startBtn.disabled = true;
    
    // Start timer
    timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    timeLeft--;
    timeDisplay.textContent = `${timeLeft}s`;
    
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
    
    // Calculate final WPM and accuracy
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const wpm = Math.round((correctCharacters / 5) / timeElapsed);
    const accuracy = Math.round((correctCharacters / totalCharacters) * 100);
    
    // Update score in database
    updateScore(wpm);
    
    // Update leaderboard
    loadLeaderboard();
}

function updateScore(wpm) {
    fetch('/api/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, score: wpm })
    });
}

// Input handling
textInput.addEventListener('input', () => {
    if (!isTestActive) return;
    
    const inputText = textInput.value;
    totalCharacters = inputText.length;
    
    // Calculate correct characters
    correctCharacters = 0;
    for (let i = 0; i < inputText.length; i++) {
        if (inputText[i] === currentText[i]) {
            correctCharacters++;
        }
    }
    
    // Calculate and update WPM and accuracy
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const wpm = Math.round((correctCharacters / 5) / timeElapsed);
    const accuracy = Math.round((correctCharacters / totalCharacters) * 100);
    
    wpmDisplay.textContent = wpm;
    accuracyDisplay.textContent = `${accuracy}%`;
    
    // Check if test is complete
    if (inputText.length === currentText.length) {
        endTest();
    }
});

// Leaderboard Functions
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
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

// Initialize
function resetTest() {
    isTestActive = false;
    clearInterval(timer);
    timeLeft = 60;
    timeDisplay.textContent = '60s';
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '0%';
    textInput.value = '';
    textInput.disabled = true;
    textDisplay.textContent = '';
    startBtn.textContent = 'Start Test';
    startBtn.disabled = false;
} 