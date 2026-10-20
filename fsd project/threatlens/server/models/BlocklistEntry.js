const mongoose = require('mongoose');

const blocklistEntrySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['domain', 'email', 'ip', 'url'],
    required: true
  },
  value: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  listType: {
    type: String,
    enum: ['blocklist', 'allowlist'],
    required: true,
    default: 'blocklist'
  },
  reason: { type: String, default: '' },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: { type: Boolean, default: true },
  hitCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Unique constraint: type + value + listType combination
blocklistEntrySchema.index({ type: 1, value: 1, listType: 1 }, { unique: true });

module.exports = mongoose.model('BlocklistEntry', blocklistEntrySchema);
