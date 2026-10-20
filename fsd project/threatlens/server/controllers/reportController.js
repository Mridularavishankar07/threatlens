const Report = require('../models/Report');
const Scan = require('../models/Scan');

// POST /api/reports
const createReport = async (req, res) => {
  try {
    const { scanId, reason } = req.body;

    const scan = await Scan.findOne({ _id: scanId, userId: req.user._id });
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found.' });
    }

    const existing = await Report.findOne({ userId: req.user._id, scanId });
    if (existing) {
      return res.status(400).json({ error: 'You have already reported this scan.' });
    }

    const report = await Report.create({
      userId: req.user._id,
      scanId,
      reason
    });

    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report.' });
  }
};

// GET /api/reports - User's reports
const getUserReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .populate('scanId', 'sender subject classification riskScore')
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

module.exports = { createReport, getUserReports };
