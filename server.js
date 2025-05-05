const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/typing-test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Score Schema
const scoreSchema = new mongoose.Schema({
    username: String,
    wpm: Number,
    accuracy: Number,
    timestamp: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'typing-test-secret-key-2024';

// Helper function to verify token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Create new user
        const user = new User({ username, password });
        await user.save();
        
        // Generate token
        const token = jwt.sign({ username }, JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign({ username }, JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/scores', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        const { wpm, accuracy } = req.body;
        const score = new Score({
            username: decoded.username,
            wpm,
            accuracy
        });
        
        await score.save();
        res.json({ message: 'Score saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const scores = await Score.find()
            .sort({ wpm: -1 })
            .limit(10);
        res.json(scores);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 