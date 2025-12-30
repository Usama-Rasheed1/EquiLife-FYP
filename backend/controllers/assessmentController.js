const Assessment = require('../models/Assessment');
const goalController = require('./goalController');

// Submit an assessment
exports.submitAssessment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { assessmentType, score, severity, answers } = req.body;

    if (!assessmentType || !['gad7', 'phq9', 'ghq12'].includes(assessmentType)) {
      return res.status(400).json({ message: 'Invalid assessment type' });
    }

    if (score === undefined || score === null || score < 0) {
      return res.status(400).json({ message: 'Invalid score' });
    }

    const assessment = new Assessment({
      userId,
      assessmentType,
      score,
      severity,
      answers: answers || [],
      submittedAt: new Date()
    });

    await assessment.save();

    // Update progress for related goals
    await goalController.updateProgressForGoalType(userId, assessmentType);

    return res.status(201).json({ assessment });
  } catch (err) {
    console.error('Submit assessment error:', err);
    return res.status(500).json({ message: 'Error submitting assessment' });
  }
};

// Get latest assessments for a user
exports.getLatestAssessments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const assessments = await Assessment.aggregate([
      { $match: { userId: userId } },
      { $sort: { submittedAt: -1 } },
      {
        $group: {
          _id: '$assessmentType',
          latest: { $first: '$$ROOT' }
        }
      }
    ]);

    const result = {
      gad7: null,
      phq9: null,
      ghq12: null
    };

    assessments.forEach(item => {
      if (item._id === 'gad7') result.gad7 = item.latest.score;
      if (item._id === 'phq9') result.phq9 = item.latest.score;
      if (item._id === 'ghq12') result.ghq12 = item.latest.score;
    });

    return res.json({ assessments: result });
  } catch (err) {
    console.error('Get latest assessments error:', err);
    return res.status(500).json({ message: 'Error fetching assessments' });
  }
};

