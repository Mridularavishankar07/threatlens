const AuditLog = require('../models/AuditLog');

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, severity, userId } = req.query;
    const query = {};
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (userId) query.userId = userId;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      logs,
      pagination: { current: parseInt(page), total: Math.ceil(total / limit), count: total }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
};

module.exports = { getAuditLogs };
