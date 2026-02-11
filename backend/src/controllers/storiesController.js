import mongoose from 'mongoose';
import Story from '../models/Story.js';
import User from '../models/User.js';

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 100;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const safeUserFields = 'firstName lastName profilePicture status';

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
};

const sanitizeText = (value) => String(value || '').trim();

const storyToResponse = (storyDoc, viewerId) => {
  const story = storyDoc.toJSON();
  const viewers = storyDoc.viewers || [];
  const viewed = viewerId
    ? viewers.some((id) => id.toString() === viewerId.toString())
    : false;

  return {
    ...story,
    viewed,
    viewersCount: viewers.length
  };
};

export const createStory = async (req, res) => {
  try {
    const authorId = req.userId;
    const content = sanitizeText(req.body.content);
    const image = req.body.image ? sanitizeText(req.body.image) : null;

    if (!authorId) return res.status(401).json({ message: 'Unauthorized' });
    if (!content && !image) {
      return res.status(400).json({ message: 'Story must contain text or image' });
    }
    if (content.length > 220) {
      return res.status(400).json({ message: 'Story text is too long (max 220 chars)' });
    }
    if (image && image.length > 2048) {
      return res.status(400).json({ message: 'Image URL is too long' });
    }

    const author = await User.findById(authorId).select('_id');
    if (!author) return res.status(404).json({ message: 'Author not found' });

    const story = await Story.create({
      author: authorId,
      content,
      image,
      expiresAt: new Date(Date.now() + ONE_DAY_MS)
    });

    const populated = await Story.findById(story._id).populate('author', safeUserFields);
    return res.status(201).json({ story: storyToResponse(populated, authorId) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getActiveStories = async (req, res) => {
  try {
    const viewerId = req.userId;
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });

    const limit = parseLimit(req.query.limit);
    const now = new Date();

    const stories = await Story.find({
      expiresAt: { $gt: now }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', safeUserFields);

    const items = stories.map((storyDoc) => storyToResponse(storyDoc, viewerId));
    return res.json({ items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUserStories = async (req, res) => {
  try {
    const viewerId = req.userId;
    const userId = req.params.id;

    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const now = new Date();
    const stories = await Story.find({
      author: userId,
      expiresAt: { $gt: now }
    })
      .sort({ createdAt: -1 })
      .populate('author', safeUserFields);

    const items = stories.map((storyDoc) => storyToResponse(storyDoc, viewerId));
    return res.json({ items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const markStoryViewed = async (req, res) => {
  try {
    const viewerId = req.userId;
    const storyId = req.params.id;

    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });
    if (!storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ message: 'Invalid story id' });
    }

    const story = await Story.findOneAndUpdate(
      { _id: storyId, expiresAt: { $gt: new Date() } },
      { $addToSet: { viewers: viewerId } },
      { new: true }
    ).populate('author', safeUserFields);

    if (!story) return res.status(404).json({ message: 'Story not found or expired' });

    return res.json({ story: storyToResponse(story, viewerId) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const userId = req.userId;
    const storyId = req.params.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ message: 'Invalid story id' });
    }

    const story = await Story.findById(storyId).select('author');
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own stories' });
    }

    await Story.findByIdAndDelete(storyId);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
