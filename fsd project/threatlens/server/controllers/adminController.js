const User = require('../models/User');
const Scan = require('../models/Scan');
const Simulation = require('../models/Simulation');
const TrainingAttempt = require('../models/TrainingAttempt');
const Report = require('../models/Report');

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalScans,
      phishingCount,
      suspiciousCount,
      safeCount,
      avgRiskData,
      recentScans,
      threatTrend,
      categoryDist
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Scan.countDocuments(),
      Scan.countDocuments({ classification: 'phishing' }),
      Scan.countDocuments({ classification: 'suspicious' }),
      Scan.countDocuments({ classification: 'safe' }),
      Scan.aggregate([{ $group: { _id: null, avg: { $avg: '$riskScore' } } }]),
      Scan.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('sender subject classification riskScore createdAt userId'),
      // Threat trend - last 7 days
      Scan.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              classification: '$classification'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      // Training category distribution
      TrainingAttempt.aggregate([
        {
          $lookup: {
            from: 'simulations',
            localField: 'simulationId',
            foreignField: '_id',
            as: 'simulation'
          }
        },
        { $unwind: '$simulation' },
        {
          $group: {
            _id: '$simulation.category',
            total: { $sum: 1 },
            correct: { $sum: { $cond: ['$correct', 1, 0] } }
          }
        }
      ])
    ]);

    const trainingCompletion = await User.aggregate([
      { $project: { count: { $size: '$trainingCompleted' } } },
      { $group: { _id: null, avg: { $avg: '$count' } } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalScans,
        phishingCount,
        suspiciousCount,
        safeCount,
        avgRiskScore: avgRiskData[0]?.avg ? Math.round(avgRiskData[0].avg) : 0,
        trainingCompletion: trainingCompletion[0]?.avg ? Math.round(trainingCompletion[0].avg) : 0
      },
      recentScans,
      threatTrend,
      categoryDist
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch admin dashboard.' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Enrich with scan counts
    const userIds = users.map(u => u._id);
    const scanCounts = await Scan.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', total: { $sum: 1 }, phishing: { $sum: { $cond: [{ $eq: ['$classification', 'phishing'] }, 1, 0] } } } }
    ]);

    const scanMap = {};
    scanCounts.forEach(s => { scanMap[s._id.toString()] = s; });

    const enrichedUsers = users.map(u => ({
      ...u.toObject(),
      scanCount: scanMap[u._id.toString()]?.total || 0,
      phishingFound: scanMap[u._id.toString()]?.phishing || 0
    }));

    res.json({
      users: enrichedUsers,
      pagination: { current: parseInt(page), total: Math.ceil(total / limit), count: total }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

// GET /api/admin/scans
const getAllScans = async (req, res) => {
  try {
    const { page = 1, limit = 20, classification, search } = req.query;
    const query = {};

    if (classification) query.classification = classification;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { sender: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Scan.countDocuments(query);
    const scans = await Scan.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-emailBody -detailedAnalysis');

    res.json({
      scans,
      pagination: { current: parseInt(page), total: Math.ceil(total / limit), count: total }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scans.' });
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const [
      threatDistribution,
      dailyTrend,
      topThreats,
      userScoreDistribution
    ] = await Promise.all([
      Scan.aggregate([
        { $group: { _id: '$classification', count: { $sum: 1 }, avgScore: { $avg: '$riskScore' } } }
      ]),
      Scan.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            phishing: { $sum: { $cond: [{ $eq: ['$classification', 'phishing'] }, 1, 0] } },
            suspicious: { $sum: { $cond: [{ $eq: ['$classification', 'suspicious'] }, 1, 0] } },
            safe: { $sum: { $cond: [{ $eq: ['$classification', 'safe'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Scan.find({ classification: 'phishing' })
        .sort({ riskScore: -1 })
        .limit(5)
        .populate('userId', 'name')
        .select('sender subject riskScore createdAt'),
      User.aggregate([
        { $bucket: { groupBy: '$securityScore', boundaries: [0, 25, 50, 75, 100], default: '100+', output: { count: { $sum: 1 } } } }
      ])
    ]);

    res.json({ threatDistribution, dailyTrend, topThreats, userScoreDistribution });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
};

// Simulation management
const createSimulation = async (req, res) => {
  try {
    const simulation = await Simulation.create({
      ...req.body,
      createdBy: req.user._id
    });
    res.status(201).json({ message: 'Simulation created', simulation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create simulation.' });
  }
};

const updateSimulation = async (req, res) => {
  try {
    const simulation = await Simulation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!simulation) return res.status(404).json({ error: 'Simulation not found.' });
    res.json({ message: 'Simulation updated', simulation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update simulation.' });
  }
};

const deleteSimulation = async (req, res) => {
  try {
    const simulation = await Simulation.findByIdAndDelete(req.params.id);
    if (!simulation) return res.status(404).json({ error: 'Simulation not found.' });
    res.json({ message: 'Simulation deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete simulation.' });
  }
};

const getAdminSimulations = async (req, res) => {
  try {
    const simulations = await Simulation.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ simulations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch simulations.' });
  }
};

// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('userId', 'name email')
      .populate('scanId', 'sender subject classification riskScore')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

// PATCH /api/admin/users/:id/toggle
const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot deactivate admin accounts.' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle user status.' });
  }
};

// PATCH /api/admin/reports/:id/status
const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes: adminNotes || '' },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json({ message: 'Report status updated.', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report.' });
  }
};

// PATCH /api/admin/scans/:id/incident
const updateIncidentStatus = async (req, res) => {
  try {
    const { incidentStatus, adminNotes } = req.body;
    const scan = await Scan.findByIdAndUpdate(
      req.params.id,
      { incidentStatus, adminNotes: adminNotes || '' },
      { new: true }
    );
    if (!scan) return res.status(404).json({ error: 'Scan not found.' });
    res.json({ message: 'Incident status updated.', scan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update incident.' });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getAllScans,
  getAnalytics,
  createSimulation,
  updateSimulation,
  deleteSimulation,
  getAdminSimulations,
  getReports,
  toggleUser,
  updateReportStatus,
  updateIncidentStatus
};
