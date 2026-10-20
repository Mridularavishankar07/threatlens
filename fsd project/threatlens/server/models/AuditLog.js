const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    // Auth
    // SCAN_CREATED, SCAN_DELETED, SCAN_QUARANTINED, SCAN_MARKED_SAFE
    // REPORT_SUBMITTED
    // TRAINING_COMPLETED
    // ADMIN_USER_TOGGLED, ADMIN_REPORT_REVIEWED, ADMIN_SIMULATION_CREATED
    // BLOCKLIST_ADDED, BLOCKLIST_REMOVED
  },
  category: {
    type: String,
    enum: ['auth', 'scan', 'report', 'training', 'admin', 'blocklist'],
    required: true
  },
  description: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  createdAt: { type: Date, default: Date.now, index: true }
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
