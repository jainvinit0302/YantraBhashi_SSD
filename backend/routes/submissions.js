const express = require('express');
const router = express.Router();
const { protect, isInstructor } = require('../middleware/auth');
const Submission = require('../models/Submission');
const { validateYantrabhasha } = require('../yantra/validator');

// @route   POST api/submissions
// @desc    Validate and save a new submission
// @access  Private
router.post('/', protect, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ msg: 'Code is required' });
  }

  const result = validateYantrabhasha(code);

  try {
    const newSubmission = new Submission({
      code,
      status: result.status,
      message: result.message,
      user: req.user.id,
    });
    const submission = await newSubmission.save();
    res.json(submission);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/submissions
// @desc    Get all submissions (instructor only)
// @access  Private (Instructor)
router.get('/', [protect, isInstructor], async (req, res) => {
  try {
    // Allow filtering by user, e.g., /api/submissions?userId=...
    const query = req.query.userId ? { user: req.query.userId } : {};
    const submissions = await Submission.find(query)
      .populate('user', ['name', 'email'])
      .sort({ timestamp: -1 });
    res.json(submissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/submissions/:id/feedback
// @desc    Add feedback to a submission (instructor only)
// @access  Private (Instructor)
router.put('/:id/feedback', [protect, isInstructor], async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ msg: 'Submission not found' });
        }
        submission.feedback = req.body.feedback;
        await submission.save();
        res.json(submission);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
