import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const ALLOWED_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'profilePicture',
  'status',
  'bio',
  'university',
  'major'
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
};

const normalizeText = (value) => String(value ?? '').trim();

const sanitizeProfilePayload = (payload) => {
  const updates = {};

  ALLOWED_PROFILE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      updates[field] = normalizeText(payload[field]);
    }
  });

  if (updates.firstName && updates.firstName.length > 50) {
    throw new Error('First name is too long');
  }
  if (updates.lastName && updates.lastName.length > 50) {
    throw new Error('Last name is too long');
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'profilePicture') && updates.profilePicture.length > 2048) {
    throw new Error('Profile picture URL is too long');
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status.length > 160) {
    throw new Error('Status is too long');
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'bio') && updates.bio.length > 300) {
    throw new Error('Bio is too long');
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'university') && updates.university.length > 120) {
    throw new Error('University is too long');
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'major') && updates.major.length > 120) {
    throw new Error('Major is too long');
  }

  return updates;
};

const buildUserSummary = (viewerId, userDoc) => {
  const user = userDoc.toJSON();
  const followerIds = userDoc.followers || [];
  const followingIds = userDoc.following || [];
  const isFollowing = viewerId
    ? followerIds.some((id) => id.toString() === viewerId.toString())
    : false;

  return {
    ...user,
    followersCount: followerIds.length,
    followingCount: followingIds.length,
    isFollowing
  };
};

const extractUploadFilename = (value) => {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.pathname.startsWith('/uploads/')) {
      return path.basename(parsed.pathname);
    }
  } catch (error) {
    if (String(value).startsWith('/uploads/')) {
      return path.basename(String(value));
    }
  }

  return null;
};

const deleteFileIfExists = async (filename) => {
  if (!filename) return;

  const filePath = path.join(uploadsDir, filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error deleting previous profile photo:', error);
    }
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user: buildUserSummary(userId, user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const updates = sanitizeProfilePayload(req.body || {});
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid profile fields to update' });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, 'firstName') &&
      updates.firstName.length === 0
    ) {
      return res.status(400).json({ message: 'First name cannot be empty' });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, 'lastName') &&
      updates.lastName.length === 0
    ) {
      return res.status(400).json({ message: 'Last name cannot be empty' });
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user: buildUserSummary(userId, user) });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.ValidationError || error.message.includes('too long')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

export const uploadMyPhoto = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'Photo file is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const previousFilename = extractUploadFilename(user.profilePicture);
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    user.profilePicture = photoUrl;
    await user.save();
    await deleteFileIfExists(previousFilename);

    return res.json({ user: buildUserSummary(userId, user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const viewerId = req.userId;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user: buildUserSummary(viewerId, user) });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const viewerId = req.userId;
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });

    const limit = parseLimit(req.query.limit);
    const q = normalizeText(req.query.q || '');

    const viewer = await User.findById(viewerId).select('following');
    if (!viewer) return res.status(404).json({ message: 'User not found' });

    const filter = { _id: { $ne: viewerId } };
    if (q) {
      const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { firstName: pattern },
        { lastName: pattern },
        { email: pattern },
        { university: pattern },
        { major: pattern }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(limit);
    const followingSet = new Set(viewer.following.map((id) => id.toString()));

    const items = users.map((userDoc) => {
      const user = userDoc.toJSON();
      return {
        ...user,
        followersCount: userDoc.followers.length,
        followingCount: userDoc.following.length,
        isFollowing: followingSet.has(userDoc._id.toString())
      };
    });

    return res.json({ items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const viewerId = req.userId;
    const targetId = req.params.id;

    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });
    if (viewerId.toString() === targetId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const [viewer, target] = await Promise.all([
      User.findById(viewerId).select('following'),
      User.findById(targetId).select('followers')
    ]);

    if (!viewer || !target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyFollowing = viewer.following.some((id) => id.toString() === targetId.toString());

    if (alreadyFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(viewerId, { $pull: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $pull: { followers: viewerId } })
      ]);
    } else {
      await Promise.all([
        User.findByIdAndUpdate(viewerId, { $addToSet: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $addToSet: { followers: viewerId } })
      ]);
    }

    const refreshedTarget = await User.findById(targetId);
    return res.json({
      isFollowing: !alreadyFollowing,
      followersCount: refreshedTarget?.followers.length || 0
    });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};
