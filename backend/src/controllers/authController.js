import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ALLOWED_ROLES = new Set(['student', 'professional']);

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeName = (value) => String(value || '').trim();

const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret is not configured');
  }

  return jwtSecret;
};

const createAuthToken = (user) => {
  const jwtSecret = getJwtSecret();
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
};

export const register = async (req, res) => {
  try {
    const firstName = normalizeName(req.body.firstName);
    const lastName = normalizeName(req.body.lastName);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const role = String(req.body.role || 'student').trim();

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({ message: 'Name is too long' });
    }

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ message: 'Password must be between 8 and 72 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = new User({ firstName, lastName, email, password, role });
    await user.save();

    const token = createAuthToken(user);
    const safeUser = user.toJSON();

    res.status(201).json({ user: safeUser, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = createAuthToken(user);
    const safeUser = user.toJSON();

    res.json({ user: safeUser, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { register, login };
