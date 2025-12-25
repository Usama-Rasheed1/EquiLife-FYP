require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO server initialized`);
    });
  })
  .catch(err => console.log('DB Error:', err));
