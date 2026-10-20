const express = require('express');
const { body } = require('express-validator');
const { getSimulations, getSimulation, submitAttempt, getProgress } = require('../controllers/trainingController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/progress', getProgress);
router.get('/', getSimulations);
router.get('/:id', getSimulation);
router.post('/:id/attempt', [
  body('selectedAction').notEmpty().withMessage('Selected action is required'),
  body('timeSpent').optional().isNumeric()
], validate, submitAttempt);

module.exports = router;
