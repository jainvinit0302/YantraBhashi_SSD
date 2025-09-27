const express = require('express');
const router = express.Router();
const { runCode } = require('../controllers/runController');
const { protect } = require('../middleware/auth');

// @route   POST /api/run
// @desc    Run validation on code without saving it
// @access  Private
router.post('/', protect, runCode);

module.exports = router;