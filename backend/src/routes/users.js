import express from 'express';
import authMiddleware from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getMyProfile,
  updateMyProfile,
  uploadMyPhoto,
  getUserProfile,
  searchUsers,
  toggleFollow
} from '../controllers/usersController.js';

const router = express.Router();

router.get('/me', authMiddleware, getMyProfile);
router.patch('/me', authMiddleware, updateMyProfile);
router.post('/me/photo', authMiddleware, (req, res, next) => {
  upload.single('photo')(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image must be less than 2MB' });
    }

    return res.status(400).json({ message: error.message || 'Invalid image upload' });
  });
}, uploadMyPhoto);
router.get('/search', authMiddleware, searchUsers);
router.post('/:id/follow', authMiddleware, toggleFollow);
router.get('/:id', authMiddleware, getUserProfile);

export default router;
