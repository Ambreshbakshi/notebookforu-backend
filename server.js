require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000; // Render uses dynamic ports

// Enhanced CORS Configuration
const allowedOrigins = [
  'https://notebookforu-gye1goi5p-notebookforus-projects.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const msg = `CORS policy: ${origin} not allowed`;
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// MongoDB Connection with Retry
const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    setTimeout(connectWithRetry, 5000);
  });
};
connectWithRetry();

// Email Schema
const EmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} is not a valid email!`
    }
  },
  createdAt: { type: Date, default: Date.now }
});

const Email = mongoose.model('Email', EmailSchema);

// Fixed Subscription Endpoint
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const newEmail = new Email({ email: normalizedEmail });
      await newEmail.save();
      return res.status(201).json({
        success: true,
        message: '🎉 Subscribed successfully!'
      });
    } catch (saveError) {
      // Handle duplicate key error
      if (saveError.code === 11000) {
        return res.status(200).json({
          success: false,
          message: '📭 This email is already subscribed',
          code: 'DUPLICATE_EMAIL'
        });
      }
      throw saveError;
    }

  } catch (error) {
    console.error('🔥 Subscription Error:', error);
    return res.status(500).json({
      success: false,
      message: '⚠️ Subscription service unavailable',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('📦 MongoDB connection closed');
      process.exit(0);
    });
  });
});