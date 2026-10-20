const SecurityPolicy = require('../models/SecurityPolicy');

// GET /api/admin/policy
const getPolicy = async (req, res) => {
  try {
    let policy = await SecurityPolicy.findOne();
    if (!policy) {
      policy = await SecurityPolicy.create({ updatedBy: req.user._id });
    }
    res.json({ policy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch security policy.' });
  }
};

// PUT /api/admin/policy
const updatePolicy = async (req, res) => {
  try {
    const {
      autoQuarantineThreshold, autoQuarantineEnabled,
      riskThresholds, analysisWeights, alertSettings, retentionDays
    } = req.body;

    let policy = await SecurityPolicy.findOne();
    if (!policy) {
      policy = new SecurityPolicy({});
    }

    if (autoQuarantineThreshold !== undefined) policy.autoQuarantineThreshold = autoQuarantineThreshold;
    if (autoQuarantineEnabled !== undefined) policy.autoQuarantineEnabled = autoQuarantineEnabled;
    if (riskThresholds) policy.riskThresholds = { ...policy.riskThresholds, ...riskThresholds };
    if (analysisWeights) policy.analysisWeights = { ...policy.analysisWeights, ...analysisWeights };
    if (alertSettings) policy.alertSettings = { ...policy.alertSettings, ...alertSettings };
    if (retentionDays !== undefined) policy.retentionDays = retentionDays;
    policy.updatedBy = req.user._id;
    policy.updatedAt = new Date();

    await policy.save();
    res.json({ message: 'Security policy updated.', policy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update policy.' });
  }
};

module.exports = { getPolicy, updatePolicy };
