const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const PointHistory = require('../models/PointHistory');
const User = require('../models/User');

async function getProfile(userId) {
  if (!userId) throw new Error('userId required');
  // Get user with gamification data (activeChallenges, completedChallenges, totalPoints)
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  // Ensure arrays are initialized
  if (!user.activeChallenges) user.activeChallenges = [];
  if (!user.completedChallenges) user.completedChallenges = [];
  if (!user.badges) user.badges = [];
  if (user.totalPoints === undefined) user.totalPoints = 0;
  
  return user;
}

async function listChallenges() {
  // Return only active challenges, sorted by creation date
  return Challenge.find({ status: 'active' }).sort({ createdAt: 1 }).lean();
}

async function startChallenge(userId, challengeId) {
  if (!userId || !challengeId) throw new Error('userId and challengeId required');

  // Accept either a backend challenge _id or a frontend-provided id (string/number) or a full challenge payload
  let challengeDoc = null;
  let challengeKey = challengeId;
  if (typeof challengeId === 'object' && (challengeId._id || challengeId.id)) {
    // frontend passed challenge metadata
    challengeDoc = challengeId;
    challengeKey = challengeId._id || challengeId.id;
  } else {
    // try to find backend challenge by id
    try { challengeDoc = await Challenge.findById(challengeId).lean(); } catch (e) { challengeDoc = null; }
  }

  // If backend challenge exists and is inactive, reject. If no backend challenge, accept frontend metadata.
  if (challengeDoc && challengeDoc.status === 'inactive') throw new Error('challenge not found or inactive');

  // Get user and check if challenge is already active
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  // Initialize arrays if needed
  if (!user.activeChallenges) user.activeChallenges = [];
  if (!user.completedChallenges) user.completedChallenges = [];
  
  // Check if challenge is already active
  const alreadyActive = user.activeChallenges.some(ac => {
    const acId = ac.challengeId && ac.challengeId.toString ? ac.challengeId.toString() : ac.challengeId;
    return acId === challengeKey.toString();
  });
  
  if (!alreadyActive) {
    user.activeChallenges.push({ challengeId: challengeKey, startedAt: new Date() });
    await user.save();
  }

  return user;
}

async function completeChallenge(userId, challengeId) {
  if (!userId || !challengeId) throw new Error('userId and challengeId required');
  // NOTE: Transactions are not used here to avoid requiring a replica set.
  // Use atomic update pattern with User model directly.
  // allow challengeId to be either backend _id or frontend-provided payload (object)
  let challenge = null;
  let challengeKey = challengeId;
  if (typeof challengeId === 'object' && (challengeId._id || challengeId.id)) {
    challenge = challengeId; // metadata from frontend
    challengeKey = challengeId._id || challengeId.id;
  } else {
    challenge = await Challenge.findById(challengeId);
    challengeKey = challenge ? challenge._id : challengeId;
  }

  if (!challenge) {
    // proceed with frontend-only challenge metadata if provided; else fail
    if (typeof challengeId !== 'object') throw new Error('challenge not found or inactive');
  } else if (challenge && challenge.status === 'inactive') {
    throw new Error('challenge not found or inactive');
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  // Initialize arrays if needed
  if (!user.activeChallenges) user.activeChallenges = [];
  if (!user.completedChallenges) user.completedChallenges = [];

  // ensure user started the challenge (or allow frontend-provided challenges)
  const activeEntry = user.activeChallenges.find(ac => {
    const acId = ac.challengeId && ac.challengeId.toString ? ac.challengeId.toString() : ac.challengeId;
    return acId === challengeKey.toString();
  });
  
  // If challenge wasn't started in backend but is frontend-provided metadata, auto-start it
  if (!activeEntry && typeof challengeId === 'object' && challenge) {
    // Frontend-provided challenge - add to activeChallenges if not already there
    const alreadyActive = user.activeChallenges.some(ac => {
      const acId = ac.challengeId && ac.challengeId.toString ? ac.challengeId.toString() : ac.challengeId;
      return acId === challengeKey.toString();
    });
    if (!alreadyActive) {
      user.activeChallenges.push({ challengeId: challengeKey, startedAt: new Date() });
    }
  } else if (!activeEntry) {
    throw new Error('challenge not started by user');
  }

  // compute cooldown threshold
  const cooldownHours = (challenge && challenge.cooldownHours) ? challenge.cooldownHours : (challenge && challenge.cooldownHours === 0 ? 0 : (challenge && challenge.cooldownHours) || 0);
  const earliestAllowed = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);

  // check for recent completion as an early guard
  const recent = user.completedChallenges.find(cc => {
    const ccId = cc.challengeId && cc.challengeId.toString ? cc.challengeId.toString() : cc.challengeId;
    return ccId === challengeKey.toString() && new Date(cc.completedAt) > earliestAllowed;
  });
  if (recent) {
    const remainingMs = new Date(recent.completedAt).getTime() + cooldownHours * 60 * 60 * 1000 - Date.now();
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
    throw new Error(`challenge cooldown not passed. try again after ${remainingHours} hour(s)`);
  }

  // determine points (support backend `xp_points`, legacy `points`, or frontend `xp`) and coerce to Number
  const ptsRaw = (challenge && (
    challenge.xp_points !== undefined ? challenge.xp_points : 
    challenge.points !== undefined ? challenge.points : 
    challenge.xp !== undefined ? challenge.xp : 
    undefined
  ));
  const pts = Number(ptsRaw || 0);

  // Perform atomic update: add to completed, remove from active, increment points
  // Use filter to prevent double-completion within cooldown window
  const filter = {
    _id: userId,
    $nor: [
      { completedChallenges: { $elemMatch: { challengeId: challengeKey, completedAt: { $gt: earliestAllowed } } } }
    ]
  };

  const update = {
    $push: { completedChallenges: { challengeId: challengeKey, completedAt: new Date() } },
    $inc: { totalPoints: pts },
    $pull: { activeChallenges: { challengeId: challengeKey } }
  };

  const updated = await User.findOneAndUpdate(filter, update, { new: true });
  if (!updated) {
    // another process likely completed recently or cooldown prevented update
    throw new Error('Could not complete challenge due to cooldown or concurrent update');
  }
  console.debug('[gamification] awarded pts', { userId, challengeKey, pts, updatedTotal: updated.totalPoints });

  // write point history (best-effort). If this fails, points were still awarded; log the error.
  try {
    await PointHistory.create({ userId, challengeId: challengeKey, pointsAwarded: pts, reason: `Completed challenge ${challenge && challenge.title ? challenge.title : challengeKey}` });
  } catch (err) {
    console.error('PointHistory write failed', err);
  }

  return {
    ok: true,
    profile: updated.toObject(),
    awarded: challenge.xp_points || challenge.points || challenge.xp || 0
  };
}

async function getLeaderboard(limit = 20) {
  const rows = await User.find({})
    .select('_id fullName email totalPoints')
    .sort({ totalPoints: -1 })
    .limit(Number(limit || 20))
    .lean();

  return rows.map((r, idx) => ({
    rank: idx + 1,
    userId: r._id,
    name: r.fullName || r.email || 'Unknown',
    totalPoints: r.totalPoints || 0
  }));
}

async function getRank(userId) {
  const user = await User.findById(userId).select('totalPoints').lean();
  const points = user ? (user.totalPoints || 0) : 0;
  const higher = await User.countDocuments({ totalPoints: { $gt: points } });
  return { rank: higher + 1, totalPoints: points };
}

module.exports = {
  getProfile,
  listChallenges,
  startChallenge,
  completeChallenge,
  getLeaderboard,
  getRank
};
