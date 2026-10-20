const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry
 * @param {Object} params
 * @param {ObjectId} params.userId
 * @param {string} params.action
 * @param {string} params.category
 * @param {string} params.description
 * @param {Object} params.metadata
 * @param {string} params.severity
 * @param {Request} params.req - Express request (optional, for IP/UA)
 */
async function createAuditLog({ userId, action, category, description, metadata = {}, severity = 'info', req = null }) {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '')
      : '';
    const userAgent = req ? (req.headers['user-agent'] || '') : '';

    await AuditLog.create({
      userId,
      action,
      category,
      description,
      metadata,
      severity,
      ipAddress: ipAddress.toString().slice(0, 100),
      userAgent: userAgent.toString().slice(0, 200)
    });
  } catch (err) {
    // Audit log failures should not break main operations
    console.error('AuditLog creation failed:', err.message);
  }
}

module.exports = { createAuditLog };
