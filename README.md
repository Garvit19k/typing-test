# Typing Test Pro

A professional typing test application with user authentication, leaderboard, and real-time WPM tracking.

## Features

- User authentication (login/register)
- Real-time WPM (Words Per Minute) calculation
- Accuracy tracking
- 60-second timed tests
- Global leaderboard
- Modern and responsive UI
- Multiple sample texts

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
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

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

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

### Railway Deployment

1. Create a Railway account
2. Install Railway CLI:
```bash
npm i -g @railway/cli
```

3. Login to Railway:
```bash
railway login
```

4. Initialize and deploy:
```bash
railway init
railway up
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3000)

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT
- Deployment: Vercel/Railway 