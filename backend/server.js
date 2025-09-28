const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB 
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname';
console.log('Using Mongo URI:', MONGO_URI.startsWith('mongodb+srv') ? '(Atlas) ' + MONGO_URI.slice(0,60) + '...' : MONGO_URI);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend server started at http://localhost:${PORT}`);
});


// Define User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'student' },
});

const User = mongoose.model('User', userSchema);

// Define Submission schema and model
const submissionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  code: String,
  status: String,
  output: String,
  errors: [{ line: Number, message: String }],
  timestamp: { type: Date, default: Date.now },
});


const Submission = mongoose.model('Submission', submissionSchema);

app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username already exists' });

    const user = new User({ username, password, role: 'student' });
    await user.save();

    res.json({ success: true, userId: user._id });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ message: 'Error during signup' });
  }
})

// Login route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ userId: user._id, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Error during login' });
  }
});

// Submit code route
app.post('/submit', async (req, res) => {
  try {
    const { userId, code, status, output, errors } = req.body;

    const submission = new Submission({ userId, code, status, output, errors });
    await submission.save();

    res.json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting code' });
  }
});

// Fetch submissions route - uses query param "userId"
app.get('/submissions', async (req, res) => {
  try {
    const { userId } = req.query;
    const submissions = userId
      ? await Submission.find({ userId }).sort('-timestamp')
      : await Submission.find().sort('-timestamp');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

// Start server
// const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend server started at http://localhost:${PORT}`);
});
