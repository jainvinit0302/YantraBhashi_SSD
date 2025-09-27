const express = require('express');
const router = express.Router();
const { createSubmission, getSubmissions, addFeedback } = require('../controllers/submissionController');
const { protect, isInstructor } = require('../middleware/auth');

// @route   POST /api/submissions
// @desc    Validate and save a new submission
// @access  Private
router.post('/', protect, createSubmission);

// @route   GET /api/submissions
// @desc    Get all submissions (instructor only, can filter by user)
// @access  Private (Instructor)
router.get('/', [protect, isInstructor], getSubmissions);

// @route   PUT /api/submissions/:id/feedback
// @desc    Add feedback to a submission (instructor only)
// @access  Private (Instructor)
router.put('/:id/feedback', [protect, isInstructor], addFeedback);

module.exports = router;