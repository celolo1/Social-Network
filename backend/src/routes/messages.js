import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  sendMessage,
  getConversations,
  getMessagesWithUser
} from '../controllers/messagesController.js';

const router = express.Router();

router.get('/conversations', authMiddleware, getConversations);
router.get('/:userId', authMiddleware, getMessagesWithUser);
router.post('/', authMiddleware, sendMessage);

export default router;
