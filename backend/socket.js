const { Server } = require('socket.io');
const Message = require('./models/Message');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173', // replace with your frontend URL
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket'], // force WebSocket
  });

  io.on('connection', (socket) => {
    console.log(`New socket connected: ${socket.id}`);

    // Join group by groupName
    socket.on('joinGroup', ({ groupName, userId, sender, avatar }, ack) => {
      if (!groupName || !userId) {
        socket.emit('socket_error', { error: 'Missing required fields' });
        if (typeof ack === 'function') ack({ ok: false, error: 'Missing required fields' });
        return;
      }

      socket.data.userId = userId;
      socket.join(groupName);

      console.log(`User ${userId} joined group ${groupName}`);

      // notify others in the room
      socket.to(groupName).emit('user_joined', { userId, sender, avatar });
      // acknowledge to joining socket that it has joined the group
      socket.emit('joined_group', { groupName, userId });
      if (typeof ack === 'function') ack({ ok: true, groupName, userId });
    });

    // Leave group
    socket.on('leaveGroup', ({ groupName, userId }) => {
      if (!groupName || !userId) return;
      socket.leave(groupName);
      console.log(`User ${userId} left group ${groupName}`);
      socket.to(groupName).emit('user_left', { userId });
    });

    // Send message - persist to DB then emit; support Socket.IO ack for sender
    socket.on('sendMessage', async ({ groupName, message, senderId, sender, avatar, clientTempId }, ack) => {
      try {
        if (!groupName || !message || !senderId) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Missing fields' });
          return;
        }

        // Create and save message to DB (map to schema fields)
        const msgDoc = new Message({
          sender: senderId,
          content: message,
          groupName: groupName,
        });

        const saved = await msgDoc.save();

        // Populate sender details for emission
        await saved.populate('sender', 'fullName profilePhoto phone');

        const senderObj = saved.sender || { _id: senderId, fullName: sender, profilePhoto: avatar };

        const messageData = {
          id: saved._id,
          _id: saved._id,
          groupName,
          message: saved.content,
          senderId: senderObj._id || senderId,
          sender: senderObj.fullName || sender,
          avatar: senderObj.profilePhoto || avatar || '/user.jpg',
          phone: senderObj.phone || '',
          timestamp: saved.createdAt,
          clientTempId: clientTempId || null,
        };

        // Emit to room (includes sender)
        io.to(groupName).emit('receive_message', messageData);

        // Acknowledge to the emitter with the saved message
        if (typeof ack === 'function') ack({ ok: true, message: messageData });
      } catch (err) {
        console.error('Error saving/sending message:', err);
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    // Typing indicators
    socket.on('startTyping', ({ groupName, userId, sender }) => {
      if (!groupName || !userId) return;
      socket.to(groupName).emit('user_typing', { groupName, sender });
    });

    socket.on('stopTyping', ({ groupName, userId, sender }) => {
      if (!groupName || !userId) return;
      socket.to(groupName).emit('user_stopped_typing', { groupName, sender });
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.data.userId || socket.id}, reason: ${reason}`);
    });
  });
};

module.exports = { initializeSocket };
