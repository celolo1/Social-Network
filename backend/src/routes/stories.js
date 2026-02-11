import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  createStory,
  getActiveStories,
  getUserStories,
  markStoryViewed,
  deleteStory
} from '../controllers/storiesController.js';

const router = express.Router();

router.get('/', authMiddleware, getActiveStories);
router.post('/', authMiddleware, createStory);
router.get('/user/:id', authMiddleware, getUserStories);
router.post('/:id/view', authMiddleware, markStoryViewed);
router.delete('/:id', authMiddleware, deleteStory);

export default router;
