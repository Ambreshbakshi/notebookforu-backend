const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Atlas Connection
const mongoURI = process.env.MONGO_URI; // Ensure MONGO_URI is set in your .env file
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Define Schemas & Models
const EmailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
});

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
});

const Email = mongoose.model("Email", EmailSchema);
const Contact = mongoose.model("Contact", ContactSchema);

// API Routes

// Email Subscription API
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const newEmail = new Email({ email });
    await newEmail.save();
    res.status(200).json({ message: "Subscribed successfully!" });
  } catch (error) {
    console.error("Error saving email:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Contact Form API
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ message: "All fields are required" });

    const newContact = new Contact({ name, email, message });
    await newContact.save();
    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error saving contact form data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
