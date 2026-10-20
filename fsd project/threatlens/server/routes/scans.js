const express = require('express');
const { body } = require('express-validator');
const { createScan, getScans, getScan, getScanStats, deleteScan, updateScanAction } = require('../controllers/scanController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post('/', [
  body('sender').optional({ checkFalsy: true }).trim()
    .custom((val) => {
      if (!val) return true;
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      if (!emailPattern.test(val)) {
        throw new Error('Please enter a valid sender email address (e.g. sender@example.com)');
      }
      return true;
    }),
  body('subject').trim().notEmpty().withMessage('Subject is required')
    .isLength({ max: 500 }).withMessage('Subject too long'),
  body('emailBody').trim().notEmpty().withMessage('Email body is required')
    .isLength({ max: 50000 }).withMessage('Email body too large'),
  body('urls').optional().isArray().withMessage('URLs must be an array'),
  body('attachmentName').optional().trim().isLength({ max: 255 })
], validate, createScan);

router.get('/stats', getScanStats);
router.get('/', getScans);
router.get('/:id', getScan);
router.patch('/:id/action', [
  body('action').notEmpty().withMessage('Action is required')
], validate, updateScanAction);
router.delete('/:id', deleteScan);

module.exports = router;
