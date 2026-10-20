const BlocklistEntry = require('../models/BlocklistEntry');
const { createAuditLog } = require('../utils/auditHelper');

// GET /api/admin/blocklist
const getBlocklist = async (req, res) => {
  try {
    const { listType, type, page = 1, limit = 50, search } = req.query;
    const query = { isActive: true };
    if (listType) query.listType = listType;
    if (type) query.type = type;
    if (search) query.value = { $regex: search, $options: 'i' };

    const total = await BlocklistEntry.countDocuments(query);
    const entries = await BlocklistEntry.find(query)
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ entries, pagination: { current: parseInt(page), total: Math.ceil(total / limit), count: total } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blocklist.' });
  }
};

// POST /api/admin/blocklist
const addEntry = async (req, res) => {
  try {
    const { type, value, listType, reason } = req.body;

    const existing = await BlocklistEntry.findOne({ type, value: value.toLowerCase(), listType });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.reason = reason || existing.reason;
        await existing.save();
        return res.json({ message: 'Entry re-activated.', entry: existing });
      }
      return res.status(400).json({ error: 'Entry already exists.' });
    }

    const entry = await BlocklistEntry.create({
      type,
      value: value.toLowerCase(),
      listType: listType || 'blocklist',
      reason: reason || '',
      addedBy: req.user._id
    });

    await createAuditLog({
      userId: req.user._id,
      action: 'BLOCKLIST_ADDED',
      category: 'blocklist',
      description: `Added to ${listType}: ${type} "${value}"`,
      metadata: { entryId: entry._id, type, value, listType },
      severity: 'warning',
      req
    });

    res.status(201).json({ message: 'Entry added.', entry });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Entry already exists.' });
    res.status(500).json({ error: 'Failed to add entry.' });
  }
};

// DELETE /api/admin/blocklist/:id
const removeEntry = async (req, res) => {
  try {
    const entry = await BlocklistEntry.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });

    await createAuditLog({
      userId: req.user._id,
      action: 'BLOCKLIST_REMOVED',
      category: 'blocklist',
      description: `Removed from ${entry.listType}: ${entry.type} "${entry.value}"`,
      metadata: { entryId: entry._id },
      severity: 'info',
      req
    });

    res.json({ message: 'Entry removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove entry.' });
  }
};

module.exports = { getBlocklist, addEntry, removeEntry };
