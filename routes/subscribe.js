const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Define Schema
const SubscribeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
});

const Subscriber = mongoose.model("Subscriber", SubscribeSchema);

// Handle subscription requests
router.post("/", async (req, res) => {
  console.log("Received request body:", req.body); // Debugging log

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ error: "Email already subscribed" });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    res.status(201).json({ message: "Subscription successful" });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
