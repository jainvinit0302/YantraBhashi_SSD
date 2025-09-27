const { validateYantrabhasha } = require('../yantra/validator');

// @desc    Run validation on code
// @route   POST /api/run
const runCode = (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ msg: 'Code is required' });
  }
  const result = validateYantrabhasha(code);
  res.json(result);
};

module.exports = {
  runCode,
};
