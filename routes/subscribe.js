// backend/routes/subscribe.js
import express from 'express';
import { subscribeEmail } from '../controllers/subscribe.js';

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const result = await subscribeEmail(email);
    res.status(200).json(result);
  } catch (error) {
    // Custom error (from controller)
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    // Generic server error
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;