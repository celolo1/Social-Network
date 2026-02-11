import Post from '../models/Post.js';
import User from '../models/User.js';

const DEFAULT_FEED_LIMIT = 20;
const MAX_FEED_LIMIT = 50;

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return DEFAULT_FEED_LIMIT;
  return Math.min(parsed, MAX_FEED_LIMIT);
};

const parseCursor = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const sanitizeContent = (value) => String(value || '').trim();

export const createPost = async (req, res) => {
  try {
    const author = req.userId;
    const content = sanitizeContent(req.body.content);
    const image = req.body.image ? String(req.body.image).trim() : null;

    if (!author) return res.status(401).json({ message: 'Unauthorized' });
    if (!content) return res.status(400).json({ message: 'Post content is required' });
    if (content.length > 1000) {
      return res.status(400).json({ message: 'Post content is too long (max 1000 chars)' });
    }
    if (image && image.length > 2048) {
      return res.status(400).json({ message: 'Image URL is too long' });
    }

    const user = await User.findById(author);
    if (!user) return res.status(404).json({ message: 'Author not found' });

    const post = new Post({ author, content, image });
    await post.save();

    const populated = await post.populate('author', 'firstName lastName profilePicture status');
    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFeed = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('following');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const limit = parseLimit(req.query.limit);
    const cursor = parseCursor(req.query.cursor);
    const authors = [user._id, ...user.following];

    const filter = { author: { $in: authors } };
    if (cursor) {
      filter.createdAt = { $lt: cursor };
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('author', 'firstName lastName profilePicture status')
      .populate('comments.author', 'firstName lastName profilePicture status');

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    res.json({
      items,
      pageInfo: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const authorId = req.params.id;
    const limit = parseLimit(req.query.limit);
    const cursor = parseCursor(req.query.cursor);

    const filter = { author: authorId };
    if (cursor) {
      filter.createdAt = { $lt: cursor };
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('author', 'firstName lastName profilePicture status')
      .populate('comments.author', 'firstName lastName profilePicture status');

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return res.json({
      items,
      pageInfo: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const post = await Post.findById(postId).select('likes');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likes.findIndex(id => id.toString() === userId.toString());
    const update = idx === -1
      ? { $addToSet: { likes: userId } }
      : { $pull: { likes: userId } };

    const populated = await Post.findByIdAndUpdate(postId, update, { new: true })
      .populate('author', 'firstName lastName profilePicture status')
      .populate('comments.author', 'firstName lastName profilePicture status');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;
    const text = sanitizeContent(req.body.text);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
    if (text.length > 500) {
      return res.status(400).json({ message: 'Comment is too long (max 500 chars)' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ author: userId, text });
    await post.save();

    const populated = await Post.findById(postId)
      .populate('author', 'firstName lastName profilePicture status')
      .populate('comments.author', 'firstName lastName profilePicture status');
    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = req.params.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const post = await Post.findById(postId).select('author');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(postId);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default { createPost, getFeed };
