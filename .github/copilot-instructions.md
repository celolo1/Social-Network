# Student Social Network - Project Instructions

## Project Overview
Full-stack student social network application with Node.js backend, React frontend, and MongoDB database.

## Key Features
- User authentication and profiles
- Feed with posts
- Messaging system
- Events management
- Real-time notifications

## Project Structure

```
social-network/
├── backend/                    # Express server
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Business logic
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Custom middleware
│   │   └── app.js             # Server entry point
│   └── package.json
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API calls
│   │   ├── context/           # Context providers
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

## Development Setup

### Prerequisites
- Node.js (v14 or higher) - Download from https://nodejs.org/
- MongoDB (local or Atlas connection)
- npm (comes with Node.js)

### Backend Setup
1. `cd backend` 
2. `cp .env.example .env` - Configure database and JWT
3. `npm install`
4. `npm run dev` - Starts on http://localhost:5000

### Frontend Setup
1. `cd frontend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev` - Starts on http://localhost:3000

## Next Steps
1. Install Node.js if not already installed
2. Run the commands above to set up and start both servers
3. See README.md for detailed API documentation and features
