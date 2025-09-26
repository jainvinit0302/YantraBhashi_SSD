const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateYantrabhasha } = require('../yantra/validator');

// @route   POST api/run
// @desc    Run validation on code
// @access  Private
router.post('/', protect, (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ msg: 'Code is required' });
  }
  const result = validateYantrabhasha(code);
  res.json(result);
});

module.exports = router;
