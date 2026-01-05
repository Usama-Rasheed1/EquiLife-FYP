const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdminUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Admin users with hardcoded roles
    const adminUsers = [
      { 
        fullName: 'System Admin', 
        email: 'admin@equilife.com', 
        password: 'admin123',
        role: 'admin',
        isVerified: true
      },
      { 
        fullName: 'Super Admin', 
        email: 'superadmin@equilife.com', 
        password: 'superadmin123',
        role: 'super admin',
        isVerified: true
      }
    ];

    for (const userData of adminUsers) {
      // Check if user already exists
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        // Create new admin user
        user = new User(userData);
        await user.save();
        console.log(`Created ${userData.role}: ${userData.fullName} (${userData.email})`);
      } else {
        // Update existing user's role
        user.role = userData.role;
        user.isVerified = userData.isVerified;
        await user.save();
        console.log(`Updated ${userData.role}: ${userData.fullName} (${userData.email})`);
      }
    }

    console.log('Admin users seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin users:', error);
    process.exit(1);
  }
};

seedAdminUsers();