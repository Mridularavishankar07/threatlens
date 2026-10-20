const express = require('express');
const { body } = require('express-validator');
const { getInbox, getEmail, scanInboxEmail, emailAction, deleteEmail, submitEmail } = require('../controllers/emailController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.get('/', getInbox);
router.post('/', [
  body('fromAddress').isEmail().withMessage('Valid from address required'),
  body('subject').trim().notEmpty().withMessage('Subject required'),
  body('body').trim().notEmpty().withMessage('Body required')
], validate, submitEmail);
router.get('/:id', getEmail);
router.post('/:id/scan', scanInboxEmail);
router.patch('/:id/action', [
  body('action').notEmpty().withMessage('Action required')
], validate, emailAction);
router.delete('/:id', deleteEmail);

module.exports = router;
