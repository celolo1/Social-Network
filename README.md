# Student Social Network

Full-stack social network for students and professionals.

## Current Features

- JWT authentication (`register`, `login`, `me`)
- Protected social feed (user + followed accounts)
- Dashboard after login
- Profile management (photo URL, status, bio, university, major)
- User search / discovery
- Follow / unfollow users
- Post creation with optional image URL
- Like / unlike posts
- Comments on posts
- Delete own posts
- Public user profile pages
- Direct messages between users (follow not required)
- Stories (24h lifecycle with view tracking)
- Icon-based navigation and actions in the UI
- Pagination with cursor-based feed loading

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose), JWT, bcrypt
- Frontend: React, Vite, React Router, Axios

## Project Structure

```text
social-network/
|- backend/
|  |- src/
|  |  |- config/
|  |  |- controllers/
|  |  |- middleware/
|  |  |- models/
|  |  |- routes/
|  |  `- app.js
|  `- .env.example
`- frontend/
   |- src/
   |  |- components/
   |  |- context/
   |  |- pages/
   |  `- services/
   `- .env.example
```

## Setup

## 1) Backend

```bash
cd backend
npm install
```

Create `.env` from example and set values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-social-network
JWT_SECRET=replace_with_a_long_random_secret_at_least_16_chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Run backend:

```bash
npm run dev
```

## 2) Frontend

```bash
cd frontend
npm install
```

Create `.env` from example:

```env
VITE_API_URL=http://localhost:5000/api
```

Run frontend:

```bash
npm run dev
```

## Quality Checks

### Backend tests

```bash
cd backend
npm test
```

The backend tests run with Vitest + Supertest against an in-memory MongoDB instance.

### Frontend quality

```bash
cd frontend
npm run lint
npm run build
```

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)

### Posts

- `GET /api/posts/feed?limit=10&cursor=<ISO_DATE>` (protected)
- `GET /api/posts/user/:id?limit=10&cursor=<ISO_DATE>` (protected)
- `POST /api/posts` (protected)
- `POST /api/posts/:id/like` (protected)
- `POST /api/posts/:id/comment` (protected)
- `DELETE /api/posts/:id` (protected)

### Users

- `GET /api/users/me` (protected)
- `PATCH /api/users/me` (protected)
- `POST /api/users/me/photo` (protected, multipart form-data field: `photo`)
- `GET /api/users/search?q=<query>&limit=<n>` (protected)
- `GET /api/users/:id` (protected)
- `POST /api/users/:id/follow` (protected toggle)

### Messages

- `GET /api/messages/conversations?limit=<n>` (protected)
- `GET /api/messages/:userId?limit=<n>&cursor=<ISO_DATE>` (protected)
- `POST /api/messages` (protected)

### Stories

- `GET /api/stories?limit=<n>` (protected)
- `POST /api/stories` (protected)
- `GET /api/stories/user/:id?limit=<n>` (protected)
- `POST /api/stories/:id/view` (protected)
- `DELETE /api/stories/:id` (protected)

## Notes

- `JWT_SECRET` is mandatory and must be at least 16 characters.
- Feed returns:
  - `items`: array of posts
  - `pageInfo`: `{ hasMore, nextCursor }`
- CI pipeline is configured in `.github/workflows/ci.yml`.
