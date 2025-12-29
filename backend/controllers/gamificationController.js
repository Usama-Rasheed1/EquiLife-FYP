const gamificationService = require('../services/gamificationService');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.init = async (req, res) => {
  try {
    console.log('[Gamification][init] req.user=', req.user && req.user.id);
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const profile = await gamificationService.getProfile(userId);
    return res.json({ ok: true, profile: profile.toObject(), userXP: profile.totalPoints || 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    console.log('[Gamification][getProfile] req.user=', req.user && req.user.id);
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const profile = await gamificationService.getProfile(userId);
    return res.json({ ok: true, profile: profile.toObject(), userXP: profile.totalPoints || 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listChallenges = async (req, res) => {
  try {
  console.log('[Gamification][listChallenges]');
    const list = await gamificationService.listChallenges();
    return res.json({ ok: true, challenges: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.startChallenge = async (req, res) => {
  try {
  console.log('[Gamification][startChallenge] req.user=', req.user && req.user.id, 'body=', req.body);
    const userId = req.user && req.user.id;
  // Accept either { challengeId: '<id>' } or { challenge: { id/_id, points, cooldownHours, title } }
  const { challengeId, challenge } = req.body || {};
  const payload = challenge || challengeId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
  if (!payload) return res.status(400).json({ error: 'challengeId or challenge payload required' });

  const profile = await gamificationService.startChallenge(userId, payload);
    return res.json({ ok: true, profile });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.completeChallenge = async (req, res) => {
  try {
  console.log('[Gamification][completeChallenge] req.user=', req.user && req.user.id, 'body=', req.body);
    const userId = req.user && req.user.id;
  const { challengeId, challenge } = req.body || {};
  const payload = challenge || challengeId;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
  if (!payload) return res.status(400).json({ error: 'challengeId or challenge payload required' });

  const result = await gamificationService.completeChallenge(userId, payload);
  // include current user XP in response
  const user = await User.findById(userId).select('totalPoints').lean();
  return res.json(Object.assign({}, result, { userXP: user ? (user.totalPoints || 0) : 0 }));
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
};

exports.leaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const list = await gamificationService.getLeaderboard(limit);
    return res.json({ ok: true, leaderboard: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.rank = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const r = await gamificationService.getRank(userId);
    return res.json({ ok: true, rank: r });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// lightweight diagnostic endpoint (not protected) to verify wiring
exports.debugStatus = async (req, res) => {
  try {
    const state = mongoose.connection.readyState; // 1 = connected
    let userCount = null;
    try { userCount = await User.estimatedDocumentCount(); } catch (e) { userCount = null; }
    return res.json({ ok: true, mongooseState: state, mongoConnected: state === 1, userCount });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
