const express = require('express');
const { body } = require('express-validator');
const {
  getDashboard,
  getUsers,
  getAllScans,
  getAnalytics,
  createSimulation,
  updateSimulation,
  deleteSimulation,
  getAdminSimulations,
  getReports,
  toggleUser,
  updateReportStatus,
  updateIncidentStatus
} = require('../controllers/adminController');
const { getAuditLogs } = require('../controllers/auditController');
const { getBlocklist, addEntry, removeEntry } = require('../controllers/blocklistController');
const { getPolicy, updatePolicy } = require('../controllers/policyController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect, adminOnly);

// Dashboard & analytics
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUser);

// Scan/incident management
router.get('/scans', getAllScans);
router.patch('/scans/:id/incident', updateIncidentStatus);

// Reports
router.get('/reports', getReports);
router.patch('/reports/:id/status', updateReportStatus);

// Simulations
router.get('/simulations', getAdminSimulations);
router.post('/simulations', [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('category').notEmpty().withMessage('Category required'),
  body('correctAction').notEmpty().withMessage('Correct action required'),
  body('explanation').notEmpty().withMessage('Explanation required')
], validate, createSimulation);
router.put('/simulations/:id', updateSimulation);
router.delete('/simulations/:id', deleteSimulation);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Blocklist / Allowlist
router.get('/blocklist', getBlocklist);
router.post('/blocklist', [
  body('type').isIn(['domain', 'email', 'ip', 'url']).withMessage('Invalid type'),
  body('value').trim().notEmpty().withMessage('Value required'),
  body('listType').isIn(['blocklist', 'allowlist']).withMessage('Invalid list type')
], validate, addEntry);
router.delete('/blocklist/:id', removeEntry);

// Security policy
router.get('/policy', getPolicy);
router.put('/policy', updatePolicy);

module.exports = router;
