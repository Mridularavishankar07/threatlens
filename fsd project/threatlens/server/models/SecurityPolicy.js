const mongoose = require('mongoose');

const securityPolicySchema = new mongoose.Schema({
  // Only one policy document should exist - singleton pattern
  autoQuarantineThreshold: {
    type: Number,
    default: 75,
    min: 0,
    max: 100
  },
  autoQuarantineEnabled: { type: Boolean, default: true },
  riskThresholds: {
    safe: { type: Number, default: 29 },
    suspicious: { type: Number, default: 59 }
  },
  analysisWeights: {
    sender: { type: Number, default: 20 },
    url: { type: Number, default: 25 },
    content: { type: Number, default: 25 },
    socialEngineering: { type: Number, default: 15 },
    credentialFinancial: { type: Number, default: 15 }
  },
  alertSettings: {
    emailAlertsEnabled: { type: Boolean, default: false },
    highRiskAlerts: { type: Boolean, default: true },
    weeklyReportEnabled: { type: Boolean, default: false }
  },
  retentionDays: { type: Number, default: 90 },
  maxScansPerUser: { type: Number, default: 500 },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SecurityPolicy', securityPolicySchema);
