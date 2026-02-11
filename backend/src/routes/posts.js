import express from 'express';
import {
  createPost,
  getFeed,
  getUserPosts,
  toggleLike,
  addComment,
  deletePost
} from '../controllers/postsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createPost);
router.get('/feed', authMiddleware, getFeed);
router.get('/user/:id', authMiddleware, getUserPosts);
router.post('/:id/like', authMiddleware, toggleLike);
router.post('/:id/comment', authMiddleware, addComment);
router.delete('/:id', authMiddleware, deletePost);

export default router;
