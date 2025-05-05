const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage
const users = new Map();
const scores = [];

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (users.has(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        users.set(username, { password, highScore: 0, testsCompleted: 0 });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users.get(username);
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ message: 'Login successful' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = Array.from(users.entries())
            .map(([username, data]) => ({
                username,
                highScore: data.highScore
            }))
            .sort((a, b) => b.highScore - a.highScore)
            .slice(0, 10);
        res.json(leaderboard);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/update-score', async (req, res) => {
    try {
        const { username, score } = req.body;
        const user = users.get(username);
        if (user && score > user.highScore) {
            user.highScore = score;
            user.testsCompleted += 1;
            users.set(username, user);
        }
        res.json({ message: 'Score updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 