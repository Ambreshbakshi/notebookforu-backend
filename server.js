require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS Configuration
const allowedOrigins = [
  'https://notebookforu-gye1goi5p-notebookforus-projects.vercel.app',
  'https://notebookforu.vercel.app',
  'http://localhost:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schemas
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

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

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
      message: '⚠️ Subscription service unavailable'
    });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy blocked this request'
    });
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  mongoose.connection.close(false, () => {
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  });
});