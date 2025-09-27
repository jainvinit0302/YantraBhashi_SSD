const Submission = require('../models/Submission');
const { validateYantrabhasha } = require('../yantra/validator');

// @desc    Validate and save a new submission
// @route   POST /api/submissions
const createSubmission = async (req, res) => {
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
    res.status(201).json(submission);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all submissions (instructor only, can filter by user)
// @route   GET /api/submissions
const getSubmissions = async (req, res) => {
  try {
    const query = req.query.userId ? { user: req.query.userId } : {};
    const submissions = await Submission.find(query)
      .populate('user', ['name', 'email'])
      .sort({ timestamp: -1 });
    res.json(submissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add feedback to a submission (instructor only)
// @route   PUT /api/submissions/:id/feedback
const addFeedback = async (req, res) => {
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
};

module.exports = {
  createSubmission,
  getSubmissions,
  addFeedback,
};
