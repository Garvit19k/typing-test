# Typing Test Pro

A professional typing test application with user authentication, leaderboard, and real-time WPM tracking.

## Features

- User authentication (login/register)
- Real-time WPM (Words Per Minute) calculation
- Accuracy tracking
- Multiple time duration options (30s to 5m)
- Global leaderboard
- Modern and responsive UI
- Two modes: Practice Test and Typing Game
- Character-by-character feedback
- Word completion celebrations
- Progress tracking

## Technical Features

- Real-time error highlighting
- Word completion animations
- Progress bar
- Pause/Resume functionality
- Multiple time duration options
- Responsive design
- Modern UI with glassmorphism effects

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd typing-test
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3001`

## Deployment

### Vercel Deployment

1. Create a Vercel account if you don't have one
2. Install Vercel CLI:
```bash
npm i -g vercel
```

3. Deploy to Vercel:
```bash
vercel
```

## Project Structure

```
typing-test/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styles and animations
│   └── script.js       # Frontend JavaScript
├── server.js           # Express server with in-memory storage
├── package.json        # Project dependencies
└── vercel.json         # Vercel configuration
```

## Technologies Used

### Frontend
- HTML5
- CSS3 with modern features:
  - Flexbox and Grid
  - CSS Variables
  - Animations and Transitions
  - Glassmorphism effects
- Vanilla JavaScript with:
  - ES6+ features
  - DOM manipulation
  - Event handling
  - Async/Await

### Backend
- Node.js
- Express.js
- In-memory data storage
- RESTful API endpoints

### Deployment
- Vercel for hosting
- Express.js server
- Static file serving

## Features in Detail

### Practice Test Mode
- Multiple time duration options
- Real-time WPM and accuracy tracking
- Error highlighting
- Progress tracking

### Typing Game Mode
- Engaging gameplay
- Progressive difficulty
- Word completion celebrations
- Visual feedback

### User Interface
- Modern, clean design
- Responsive layout
- Interactive animations
- Professional color scheme
- Intuitive navigation

## Developers
- Garvit
- Karan 