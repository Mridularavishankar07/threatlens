const mongoose = require('mongoose');

const trainingAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  simulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Simulation',
    required: true
  },
  selectedAction: {
    type: String,
    required: true
  },
  correct: {
    type: Boolean,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // seconds
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TrainingAttempt', trainingAttemptSchema);
