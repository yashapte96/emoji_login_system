const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Add this line
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  emojiPassword: { type: String, required: true },
  passwordHash: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('emojiPassword')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.emojiPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

// API Routes
// Register or authenticate user
app.post('/api/auth', async (req, res) => {
  try {
    const { username, emojiPassword } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ username });
    
    if (user) {
      // Existing user - verify password
      const isMatch = await bcrypt.compare(emojiPassword, user.passwordHash);
      if (isMatch) {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Create JWT token
        const token = jwt.sign(
          { userId: user._id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        return res.json({ 
          success: true, 
          message: 'Authentication successful',
          token,
          user: {
            username: user.username,
            createdAt: user.createdAt
          }
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }
    } else {
      // New user - create account
      user = new User({ username, emojiPassword });
      await user.save();
      
      // Create JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      return res.json({ 
        success: true, 
        message: 'Account created successfully',
        token,
        user: {
          username: user.username,
          createdAt: user.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify token endpoint
app.post('/api/verify', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// Add this before app.listen()
app.get('/api/test', (req, res) => {
  res.json({ message: 'Database connection is working!' });
});