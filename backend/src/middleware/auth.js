import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT secret is not configured' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.userId = userId;
    req.userRole = decoded.role || null;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authMiddleware;

export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme === 'Bearer' && token) {
      const jwtSecret = process.env.JWT_SECRET;

      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.id || decoded.userId;
        req.userRole = decoded.role || null;
      }
    }
  } catch (error) {
    // Intentionally ignore token parsing errors for optional auth.
  } finally {
    next();
  }
};

export const requireAuth = authMiddleware;
