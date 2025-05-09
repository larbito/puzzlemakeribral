import express from 'express';
import { getAuth } from 'firebase-admin/auth';

const router = express.Router();

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current user
router.get('/user', verifyToken, async (req, res) => {
  try {
    const user = await getAuth().getUser(req.user.uid);
    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Verify token validity
router.post('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

export default router; 