const Simulation = require('../models/Simulation');
const TrainingAttempt = require('../models/TrainingAttempt');
const User = require('../models/User');

// GET /api/training - Get all active simulations
const getSimulations = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;

    const simulations = await Simulation.find(query)
      .select('-emailContent.body') // Don't expose body on list
      .sort({ difficulty: 1, createdAt: -1 });

    // Get user attempts to mark completed ones
    const userId = req.user._id;
    const attempts = await TrainingAttempt.find({ userId }).select('simulationId correct');
    const attemptMap = {};
    attempts.forEach(a => {
      attemptMap[a.simulationId.toString()] = a.correct;
    });

    const enriched = simulations.map(sim => ({
      ...sim.toObject(),
      attempted: attemptMap.hasOwnProperty(sim._id.toString()),
      correct: attemptMap[sim._id.toString()]
    }));

    res.json({ simulations: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch training scenarios.' });
  }
};

// GET /api/training/:id - Get single simulation
const getSimulation = async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation || !simulation.isActive) {
      return res.status(404).json({ error: 'Training scenario not found.' });
    }
    res.json({ simulation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch training scenario.' });
  }
};

// POST /api/training/:id/attempt - Submit training attempt
const submitAttempt = async (req, res) => {
  try {
    const { selectedAction, timeSpent } = req.body;
    const userId = req.user._id;
    const simulationId = req.params.id;

    const simulation = await Simulation.findById(simulationId);
    if (!simulation) {
      return res.status(404).json({ error: 'Training scenario not found.' });
    }

    const correct = selectedAction === simulation.correctAction;
    const points = correct ? simulation.points : Math.floor(simulation.points * 0.2);

    // Save attempt (allow re-attempts)
    const attempt = await TrainingAttempt.create({
      userId,
      simulationId,
      selectedAction,
      correct,
      score: points,
      timeSpent: timeSpent || 0
    });

    // Update user's security score based on training
    const user = await User.findById(userId);
    if (correct && !user.trainingCompleted.includes(simulationId)) {
      // Award score points for first correct attempt
      const scoreBonus = Math.min(points * 0.5, 5);
      user.securityScore = Math.min(100, user.securityScore + scoreBonus);
      user.trainingCompleted.push(simulationId);
      await user.save({ validateBeforeSave: false });
    }

    res.json({
      correct,
      points,
      explanation: simulation.explanation,
      warningSigns: simulation.warningSigns,
      correctAction: simulation.correctAction,
      message: correct
        ? `Correct! You earned ${points} points. Great cyber awareness!`
        : `Incorrect. The correct action was to "${simulation.correctAction}". See the explanation below.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit training attempt.' });
  }
};

// GET /api/training/progress - Get user training progress
const getProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    const attempts = await TrainingAttempt.find({ userId })
      .populate('simulationId', 'title category difficulty points')
      .sort({ createdAt: -1 });

    const totalSimulations = await Simulation.countDocuments({ isActive: true });
    const correctAttempts = attempts.filter(a => a.correct).length;
    const totalPoints = attempts.reduce((sum, a) => sum + a.score, 0);

    // Category breakdown
    const categoryStats = {};
    attempts.forEach(a => {
      if (a.simulationId) {
        const cat = a.simulationId.category;
        if (!categoryStats[cat]) categoryStats[cat] = { total: 0, correct: 0 };
        categoryStats[cat].total++;
        if (a.correct) categoryStats[cat].correct++;
      }
    });

    res.json({
      totalSimulations,
      attempted: attempts.length,
      correct: correctAttempts,
      totalPoints,
      accuracy: attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0,
      categoryStats,
      recentAttempts: attempts.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch training progress.' });
  }
};

module.exports = { getSimulations, getSimulation, submitAttempt, getProgress };
