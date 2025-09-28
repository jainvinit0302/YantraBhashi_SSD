const Submission = require('../models/Submission');
const { validateCode } = require('../yantra/validator');
const { interpretCode } = require('../yantra/interpreter');

const createSubmission = async (req, res) => {
  const { code, inputs } = req.body; // Frontend can send inputs for CHEPPU
  if (!code) {
    return res.status(400).json({ msg: 'Code is required' });
  }

  // --- Step 1: Validate the code ---
  const validationResult = validateCode(code);

  let finalStatus = 'success';
  let finalMessage = [];
  
  if (!validationResult.isValid) {
    // --- If validation fails, store the validation errors ---
    finalStatus = 'error';
    finalMessage = validationResult.errors;

  } else {
    // --- If validation succeeds, run the interpreter ---
    const interpretationResult = interpretCode(code, inputs);
    
    if (!interpretationResult.success) {
      // It was valid code, but a runtime error occurred
      finalStatus = 'error';
      finalMessage = [interpretationResult.error]; // Store the runtime error
    } else {
      // Code was valid and ran successfully
      finalStatus = 'success';
      finalMessage = interpretationResult.output.map(String); // Store the program's output
    }
  }

  // --- Step 2: Save the result to the database ---
  try {
    const newSubmission = new Submission({
      code,
      status: finalStatus,
      message: finalMessage,
      user: req.user.id,
    });
    const submission = await newSubmission.save();
    res.status(201).json(submission); // Return the full submission record
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// getSubmissions and addFeedback functions remain the same
const getSubmissions = async (req, res) => { /* ... */ };
const addFeedback = async (req, res) => { /* ... */ };

module.exports = {
  createSubmission,
  getSubmissions,
  addFeedback,
};