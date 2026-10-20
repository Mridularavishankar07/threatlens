const express = require('express');
const { body } = require('express-validator');
const { createReport, getUserReports } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post('/', [
  body('scanId').notEmpty().withMessage('Scan ID required'),
  body('reason').trim().notEmpty().withMessage('Reason required').isLength({ max: 500 })
], validate, createReport);

router.get('/', getUserReports);

module.exports = router;
