import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import usersRoutes from './routes/users.js';
import messagesRoutes from './routes/messages.js';
import storiesRoutes from './routes/stories.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const validateRuntimeConfig = () => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length < 16) {
    throw new Error('JWT_SECRET is required and must be at least 16 characters long.');
  }
};

export const createApp = () => {
  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow non-browser clients and local tooling without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    }
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // Routes
  app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/stories', storiesRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.use((error, req, res, next) => {
    if (error?.message === 'Not allowed by CORS') {
      return res.status(403).json({ message: 'Origin not allowed' });
    }

    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  });

  return app;
};

const app = createApp();

export default app;
