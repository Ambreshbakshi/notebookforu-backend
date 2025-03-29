// backend/models/Subscriber.js
import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,  // Ensures MongoDB rejects duplicates
    trim: true,
    lowercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to prevent duplicates (extra safety)
subscriberSchema.pre('save', async function (next) {
  const existingSubscriber = await mongoose.models.Subscriber.findOne({ email: this.email });
  if (existingSubscriber) {
    throw new Error('Email already subscribed');
  }
  next();
});

export default mongoose.model('Subscriber', subscriberSchema);