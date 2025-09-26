const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('Yantrabhasha API Running'));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/run', require('./routes/run'));
app.use('/api/submissions', require('./routes/submissions'));
// app.use('/api/forums', require('./routes/forums')); // For later

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
