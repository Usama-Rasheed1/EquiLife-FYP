const Group = require('../models/Group');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, admin, members } = req.body;
    const group = new Group({ name, admin, members });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate('members admin', 'fullName profilePhoto');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single group
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members admin', 'fullName profilePhoto');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};