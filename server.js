require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS Configuration
const allowedOrigins = [
  'https://notebookforu.vercel.app',
  'https://www.notebookforu.vercel.app',
  'https://notebookforu-gye1goi5p-notebookforus-projects.vercel.app',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Allow all Vercel preview deployments
    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked Origin:', origin); // Debug logging
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
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

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} is not a valid email!`
    }
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: { type: Date, default: Date.now }
});

const Email = mongoose.model('Email', EmailSchema);
const Contact = mongoose.model('Contact', ContactSchema);

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date(),
    allowedOrigins // Helpful for debugging
  });
});

// Subscription Endpoint
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

// Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const newContact = new Contact({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim()
    });

    await newContact.save();
    
    return res.status(201).json({
      success: true,
      message: '📩 Message sent successfully!'
    });

  } catch (error) {
    console.error('🔥 Contact Form Error:', error);
    return res.status(500).json({
      success: false,
      message: '⚠️ Failed to send message'
    });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false,
      message: 'CORS policy blocked this request',
      allowedOrigins: allowedOrigins
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