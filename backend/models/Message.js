const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // link message to a group using groupName (string)
  groupName: {
    type: String,
    required: true
  },
  abuseCount: {
    type: Number,
    default: 0
  },
  reportedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // isRead field removed per requirements
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);