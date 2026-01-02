const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/equilife';
(async ()=>{
  await mongoose.connect(mongoUri);
  const docs = await Assessment.find().lean();
  console.log('Assessments count:', docs.length);
  docs.forEach(d=>console.log(JSON.stringify(d, null, 2)));
  await mongoose.connection.close();
})();