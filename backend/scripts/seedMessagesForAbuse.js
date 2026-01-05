const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
require('dotenv').config({ path: '.env' });

const seedMessages = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/equilife';
    await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Get or create test users
    let user1 = await User.findOne({ email: 'abuser1@test.com' });
    if (!user1) {
      user1 = await User.create({
        fullName: 'Spammy User',
        email: 'abuser1@test.com',
        phone: '123-456-7890',
        password: 'hashed_password',
        isVerified: true,
      });
      console.log('Created user1:', user1._id);
    }

    let user2 = await User.findOne({ email: 'abuser2@test.com' });
    if (!user2) {
      user2 = await User.create({
        fullName: 'Toxic User',
        email: 'abuser2@test.com',
        phone: '234-567-8901',
        password: 'hashed_password',
        isVerified: true,
      });
      console.log('Created user2:', user2._id);
    }

    let user3 = await User.findOne({ email: 'abuser3@test.com' });
    if (!user3) {
      user3 = await User.create({
        fullName: 'Problem User',
        email: 'abuser3@test.com',
        phone: '345-678-9012',
        password: 'hashed_password',
        isVerified: true,
      });
      console.log('Created user3:', user3._id);
    }

    let reporter1 = await User.findOne({ email: 'reporter1@test.com' });
    if (!reporter1) {
      reporter1 = await User.create({
        fullName: 'Reporter One',
        email: 'reporter1@test.com',
        phone: '456-789-0123',
        password: 'hashed_password',
        isVerified: true,
      });
    }

    let reporter2 = await User.findOne({ email: 'reporter2@test.com' });
    if (!reporter2) {
      reporter2 = await User.create({
        fullName: 'Reporter Two',
        email: 'reporter2@test.com',
        phone: '567-890-1234',
        password: 'hashed_password',
        isVerified: true,
      });
    }

    // Clear existing test messages
    await Message.deleteMany({ groupName: { $in: ['Community', 'General Chat', 'Random Discussions'] } });
    console.log('Cleared existing test messages');

    // Create test messages with varying abuse counts
    const testMessages = [
      {
        content: 'This is a mild complaint about the community',
        sender: user1._id,
        groupName: 'Community',
        abuseCount: 1,
        reportedBy: [reporter1._id],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
      {
        content: 'Slightly inappropriate language used here',
        sender: user1._id,
        groupName: 'Community',
        abuseCount: 2,
        reportedBy: [reporter1._id, reporter2._id],
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        content: 'This message contains offensive content and needs moderation',
        sender: user2._id,
        groupName: 'General Chat',
        abuseCount: 4,
        reportedBy: [reporter1._id, reporter2._id, user1._id],
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        content: 'Highly inappropriate and disruptive message that violates community guidelines',
        sender: user2._id,
        groupName: 'General Chat',
        abuseCount: 7,
        reportedBy: [reporter1._id, reporter2._id, user1._id, user3._id],
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        content: 'SPAM SPAM SPAM - this is clearly abusive content',
        sender: user3._id,
        groupName: 'Random Discussions',
        abuseCount: 9,
        reportedBy: [reporter1._id, reporter2._id, user1._id, user2._id, user3._id],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        content: 'Extremely offensive, toxic, and divisive message that needs immediate removal',
        sender: user3._id,
        groupName: 'Random Discussions',
        abuseCount: 12,
        reportedBy: [reporter1._id, reporter2._id, user1._id, user2._id, user3._id],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        content: 'Another mild issue in the community',
        sender: user1._id,
        groupName: 'Community',
        abuseCount: 3,
        reportedBy: [reporter1._id, reporter2._id],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    const created = await Message.insertMany(testMessages);
    console.log(`✅ Created ${created.length} test messages with varying abuse counts`);

    console.log('\nMessage summary:');
    created.forEach((msg) => {
      console.log(`  - "${msg.content.substring(0, 50)}..." - Abuse: ${msg.abuseCount}, Reported by: ${msg.reportedBy.length}`);
    });

    console.log('\n✅ Seed completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedMessages();
