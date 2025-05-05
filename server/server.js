require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

// User Model
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    highScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dogRescues: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

// Health check route
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({ 
            status: 'OK',
            database: 'Connected',
            message: 'Server is fully operational'
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'Error',
            database: 'Disconnected',
            message: 'Database connection issue'
        });
    }
});

// Add a startup status route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Typing Test API is running',
        databaseStatus: sequelize.connectionManager.connection.isAuthenticated ? 'Connected' : 'Disconnected',
        serverTime: new Date().toISOString()
    });
});

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        await User.create({
            username,
            password: hashedPassword
        });

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
        const user = await User.findOne({ where: { username } });
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
            { userId: user.id },
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
        
        const user = await User.findOne({ where: { username } });
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
        
        const leaderboard = await User.findAll({
            attributes: ['username', 'highScore', 'dogRescues'],
            order: [[sortField, 'DESC']],
            limit: 10
        });
            
        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Error fetching leaderboard' });
    }
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Sync database
        await sequelize.sync();
        console.log('Database synced successfully');

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    sequelize.connectionManager.connection.end().then(() => {
        console.log('Database connections cleaned up.');
        process.exit(0);
    });
}); 