const Scan = require('../models/Scan');
const User = require('../models/User');
const { analyzeEmail } = require('../services/analysisEngine');
const { createAuditLog } = require('../utils/auditHelper');

// POST /api/scans - Create new scan
const createScan = async (req, res) => {
  try {
    const { sender, subject, emailBody, urls, attachmentName } = req.body;

    // Run analysis engine
    let analysisResult;
    try {
      analysisResult = await analyzeEmail({ sender, subject, emailBody, urls: urls || [], attachmentName: attachmentName || '' });
    } catch (engineErr) {
      console.error('Analysis engine error:', engineErr);
      return res.status(500).json({ error: 'Unable to analyze the email right now. Please try again.' });
    }

    // Save scan to database
    const scan = await Scan.create({
      userId: req.user._id,
      sender: sender?.trim() || 'unknown@unverified.email',
      subject,
      emailBody,
      urls: urls || [],
      attachmentName: attachmentName || '',
      classification: analysisResult.classification,
      riskScore: analysisResult.riskScore,
      riskLevel: analysisResult.riskLevel,
      threatIndicators: analysisResult.threatIndicators,
      phishingDNA: analysisResult.phishingDNA,
      explanation: analysisResult.explanation,
      detailedAnalysis: analysisResult.detailedAnalysis,
      recommendations: analysisResult.recommendations,
      analysisMethod: analysisResult.analysisMethod,
      analysisStatus: analysisResult.analysisStatus || 'complete',
      heuristicScore: analysisResult.heuristicScore || analysisResult.riskScore,
      aiAnalysis: analysisResult.aiAnalysis || null
    });

    await createAuditLog({
      userId: req.user._id,
      action: 'SCAN_CREATED',
      category: 'scan',
      description: `Scanned email: "${subject}" — ${analysisResult.classification.toUpperCase()} (${analysisResult.riskScore}/100)`,
      metadata: { scanId: scan._id, classification: analysisResult.classification, riskScore: analysisResult.riskScore },
      severity: analysisResult.classification === 'phishing' ? 'warning' : 'info',
      req
    });

    res.status(201).json({
      success: true,
      message: 'Email analyzed successfully',
      classification: analysisResult.classification.toUpperCase(),
      riskScore: analysisResult.riskScore,
      riskLevel: analysisResult.riskLevel,
      analysisStatus: analysisResult.analysisStatus || 'complete',
      heuristicScore: analysisResult.heuristicScore || analysisResult.riskScore,
      aiAnalysis: analysisResult.aiAnalysis || null,
      indicators: analysisResult.threatIndicators,
      threatIndicators: analysisResult.threatIndicators,
      explanation: analysisResult.explanation,
      recommendations: analysisResult.recommendations,
      phishingDna: analysisResult.phishingDna || analysisResult.phishingDNA,
      phishingDNA: analysisResult.phishingDNA,
      detailedAnalysis: analysisResult.detailedAnalysis,
      vectorBreakdown: analysisResult.vectorBreakdown,
      scan
    });
  } catch (err) {
    console.error('Scan creation error:', err);
    res.status(500).json({ error: 'Failed to process scan. Please try again.' });
  }
};

// PATCH /api/scans/:id/action - Quarantine or mark safe
const updateScanAction = async (req, res) => {
  try {
    const { action } = req.body;
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!scan) return res.status(404).json({ error: 'Scan not found.' });

    if (action === 'quarantine') {
      scan.isQuarantined = true;
      scan.userAction = 'quarantined';
    } else if (action === 'mark_safe') {
      scan.isQuarantined = false;
      scan.userAction = 'marked_safe';
    } else if (action === 'report') {
      scan.userAction = 'reported';
    } else {
      return res.status(400).json({ error: 'Invalid action. Use: quarantine, mark_safe, report' });
    }

    await scan.save();

    await createAuditLog({
      userId: req.user._id,
      action: action === 'quarantine' ? 'SCAN_QUARANTINED' : 'SCAN_MARKED_SAFE',
      category: 'scan',
      description: `User ${action === 'quarantine' ? 'quarantined' : 'marked safe'} scan: "${scan.subject}"`,
      metadata: { scanId: scan._id, action },
      req
    });

    res.json({ message: `Scan ${action} applied successfully.`, scan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update scan action.' });
  }
};

// GET /api/scans - Get user's scan history
const getScans = async (req, res) => {
  try {
    const { page = 1, limit = 10, classification, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = { userId: req.user._id };
    if (classification && ['safe', 'suspicious', 'phishing'].includes(classification)) {
      query.classification = classification;
    }
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { sender: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const validSortFields = ['createdAt', 'riskScore', 'classification'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const total = await Scan.countDocuments(query);
    const scans = await Scan.find(query)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-emailBody -detailedAnalysis');

    res.json({
      scans,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan history.' });
  }
};

// GET /api/scans/stats - Get user scan statistics
const getScanStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Scan.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$classification',
          count: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScore' }
        }
      }
    ]);

    const totalScans = await Scan.countDocuments({ userId });
    const recentThreats = await Scan.find({ userId, classification: 'phishing' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('sender subject riskScore createdAt');

    const distribution = { safe: 0, suspicious: 0, phishing: 0 };
    stats.forEach(s => { distribution[s._id] = s.count; });

    res.json({
      totalScans,
      distribution,
      recentThreats
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan statistics.' });
  }
};

// GET /api/scans/:id - Get single scan
const getScan = async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.user._id });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found.' });
    }

    res.json({ scan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan details.' });
  }
};

// DELETE /api/scans/:id - Delete a scan
const deleteScan = async (req, res) => {
  try {
    const scan = await Scan.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found.' });
    }

    res.json({ message: 'Scan deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete scan.' });
  }
};

module.exports = { createScan, getScans, getScanStats, getScan, deleteScan, updateScanAction };
