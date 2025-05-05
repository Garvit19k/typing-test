const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const users = [];
const scores = [];

// JWT Secret
const JWT_SECRET = 'typing-test-secret-key-2024';

// Helper function to verify token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    
    users.push({ username, password });
    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token, username });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token, username });
});

app.post('/api/scores', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { wpm, accuracy } = req.body;
    scores.push({
        username: decoded.username,
        wpm,
        accuracy,
        timestamp: new Date()
    });
    
    res.json({ message: 'Score saved successfully' });
});

app.get('/api/leaderboard', (req, res) => {
    const topScores = scores
        .sort((a, b) => b.wpm - a.wpm)
        .slice(0, 10);
    res.json(topScores);
});

// Export the Express API
module.exports = app; 