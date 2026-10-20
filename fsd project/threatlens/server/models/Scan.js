const mongoose = require('mongoose');

const threatIndicatorSchema = new mongoose.Schema({
  name: String,
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  score: Number,
  description: String
}, { _id: false });

const phishingDNASchema = new mongoose.Schema({
  impersonation: { type: Number, default: 0 },
  credentialTheft: { type: Number, default: 0 },
  maliciousURL: { type: Number, default: 0 },
  urgency: { type: Number, default: 0 },
  financialBait: { type: Number, default: 0 },
  attachmentRisk: { type: Number, default: 0 },
  socialEngineering: { type: Number, default: 0 }
}, { _id: false });

const analysisDetailSchema = new mongoose.Schema({
  senderAnalysis: {
    score: Number,
    findings: [String],
    suspicious: Boolean
  },
  urlAnalysis: {
    score: Number,
    urls: [String],
    suspiciousUrls: [String],
    findings: [String],
    suspicious: Boolean
  },
  contentAnalysis: {
    score: Number,
    findings: [String],
    urgencyWords: [String],
    fearWords: [String],
    suspicious: Boolean
  },
  socialEngineering: {
    score: Number,
    findings: [String],
    suspicious: Boolean
  },
  credentialFinancial: {
    score: Number,
    findings: [String],
    suspicious: Boolean
  }
}, { _id: false });

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: String,
    default: 'unknown@unverified.email',
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  emailBody: {
    type: String,
    required: true
  },
  urls: [String],
  attachmentName: String,
  classification: {
    type: String,
    enum: ['safe', 'suspicious', 'phishing'],
    required: true,
    index: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  threatIndicators: [threatIndicatorSchema],
  phishingDNA: phishingDNASchema,
  explanation: String,
  detailedAnalysis: analysisDetailSchema,
  recommendations: [String],
  analysisMethod: {
    type: String,
    enum: ['rule-based', 'ai', 'hybrid'],
    default: 'rule-based'
  },
  analysisStatus: {
    type: String,
    enum: ['complete', 'degraded', 'failed'],
    default: 'complete'
  },
  heuristicScore: {
    type: Number,
    default: 0
  },
  aiAnalysis: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // User actions on this scan
  userAction: {
    type: String,
    enum: ['none', 'quarantined', 'marked_safe', 'reported'],
    default: 'none'
  },
  isQuarantined: { type: Boolean, default: false },
  // Incident tracking (admin-side)
  incidentStatus: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'false_positive'],
    default: 'open'
  },
  adminNotes: { type: String, default: '' },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for user scans sorted by date
scanSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Scan', scanSchema);
