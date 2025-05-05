require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route for keep-alive
app.get('/health', (req, res) => {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
        res.status(200).json({ 
            status: 'OK',
            database: 'Connected',
            message: 'Server is fully operational'
        });
    } else {
        res.status(503).json({ 
            status: 'Starting',
            database: 'Connecting',
            message: 'Server is starting up, please try again in a few seconds'
        });
    }
});

// Add a startup status route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Typing Test API is running',
        databaseStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting',
        serverTime: new Date().toISOString()
    });
});

// Improved MongoDB Connection with retry logic and exponential backoff
const connectDB = async (retryCount = 0) => {
    const maxRetries = 5;
    const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 second delay

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            retryWrites: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`MongoDB connection attempt ${retryCount + 1} failed:`, error.message);
        
        if (retryCount < maxRetries) {
            console.log(`Retrying in ${backoffMs/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            return connectDB(retryCount + 1);
        } else {
            console.error('Max retry attempts reached. Please check your database configuration.');
            return false;
        }
    }
};

connectDB();

// Handle MongoDB disconnection events
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    highScore: { type: Number, default: 0 },
    dogRescues: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error during registration' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            username: user.username,
            highScore: user.highScore,
            dogRescues: user.dogRescues
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error during login' });
    }
});

app.post('/api/update-score', async (req, res) => {
    try {
        const { username, score, gameMode } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (gameMode === 'dog-rescue') {
            if (score > user.dogRescues) {
                user.dogRescues = score;
            }
        } else {
            if (score > user.highScore) {
                user.highScore = score;
            }
        }

        await user.save();
        res.json({ message: 'Score updated successfully' });
    } catch (error) {
        console.error('Score update error:', error);
        res.status(500).json({ error: 'Error updating score' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const { mode } = req.query;
        const sortField = mode === 'dog-rescue' ? 'dogRescues' : 'highScore';
        
        const leaderboard = await User.find()
            .sort({ [sortField]: -1 })
            .limit(10)
            .select('username highScore dogRescues -_id');
            
        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Error fetching leaderboard' });
    }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed. Database connections cleaned up.');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
}); 