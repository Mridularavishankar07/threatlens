const mongoose = require('mongoose');

// Simulated email inbox model - emails arrive here and users can scan them
const emailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Inbox fields
  fromName: { type: String, default: '' },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, default: '' },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  htmlBody: { type: String, default: '' },
  urls: [String],
  attachments: [{
    name: String,
    size: Number,
    type: String
  }],
  // Inbox state
  isRead: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  folder: {
    type: String,
    enum: ['inbox', 'quarantine', 'trash'],
    default: 'inbox'
  },
  // Link to scan result (null until scanned)
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan',
    default: null
  },
  // Pre-computed classification shown as badge (set after scan)
  scanStatus: {
    type: String,
    enum: ['unscanned', 'safe', 'suspicious', 'phishing'],
    default: 'unscanned'
  },
  // Whether this is a seeded demo email or user-submitted
  isDemo: { type: Boolean, default: true },
  receivedAt: { type: Date, default: Date.now }
});

emailSchema.index({ userId: 1, receivedAt: -1 });

module.exports = mongoose.model('Email', emailSchema);
