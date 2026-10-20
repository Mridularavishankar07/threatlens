const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'banking-scam',
      'fake-job-offer',
      'password-reset',
      'delivery-scam',
      'college-notice',
      'scholarship-scam',
      'account-suspension',
      'payment-request'
    ]
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  emailContent: {
    sender: String,
    subject: String,
    body: String,
    hasAttachment: { type: Boolean, default: false },
    attachmentName: String
  },
  correctAction: {
    type: String,
    enum: ['report', 'ignore', 'open-link', 'reply'],
    required: true
  },
  options: [{
    key: String,
    label: String,
    action: String
  }],
  warningSigns: [String],
  explanation: String,
  points: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Simulation', simulationSchema);
