const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'error'],
    required: true
  },
  output: {
    type: String,
    default: ''
  },
  errors: [{
    line: Number,
    message: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);