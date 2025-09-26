const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'error'],
    required: true,
  },
  message: {
    type: [String], // Array of strings to hold multiple errors
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  feedback: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Submission', SubmissionSchema);