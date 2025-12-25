import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this._pending = {}; // event -> [callbacks]
    this._registered = {}; // event -> Set(callbacks) attached to socket
  }

  connect(userId, token) {
    const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';

    // If already connected, do not create a new socket
    if (this.socket && this.socket.connected) {
      // if socket exists but auth/user changed, we could reconnect; for now keep existing socket
      return;
    }

    this.socket = io(backendUrl, {
      auth: { token, userId },
      transports: ['websocket'], // force WebSocket
    });

    // when socket connects, attach any pending listeners
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      // flush pending listeners
      Object.keys(this._pending).forEach((event) => {
        (this._pending[event] || []).forEach((cb) => {
          this._registered[event] = this._registered[event] || new Set();
          if (!this._registered[event].has(cb)) {
            this.socket.on(event, cb);
            this._registered[event].add(cb);
          }
        });
        // clear pending listeners for event after attaching
        delete this._pending[event];
      });
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }

  joinGroup({ groupName, userId, sender, avatar }) {
    if (!this.socket || !groupName || !userId) return Promise.resolve(false);

    return new Promise((resolve) => {
      // Use socket.io acknowledgement callback
      try {
        this.socket.emit('joinGroup', { groupName, userId, sender, avatar }, (ack) => {
          if (ack && ack.ok) resolve(true);
          else resolve(false);
        });
      } catch (err) {
        // if emit fails or server doesn't support ack, fallback to a quick resolve
        setTimeout(() => resolve(true), 500);
      }
    });
  }

  leaveGroup({ groupName, userId }) {
    if (!this.socket || !groupName || !userId) return false;
    this.socket.emit('leaveGroup', { groupName, userId });
    return true;
  }

  sendMessage(groupName, message, { userId, sender, avatar }, clientTempId = null) {
    if (!this.socket || !groupName || !userId || !message) return Promise.resolve({ ok: false, error: 'Socket or fields missing' });

    return new Promise((resolve) => {
      try {
        this.socket.emit(
          'sendMessage',
          {
            groupName,
            message,
            senderId: userId,
            sender,
            avatar,
            clientTempId,
          },
          (ack) => {
            resolve(ack || { ok: false });
          }
        );
      } catch (err) {
        resolve({ ok: false, error: err.message });
      }
    });
  }

  startTyping(groupName, { userId, sender }) {
    if (!this.socket || !groupName || !userId) return;
    this.socket.emit('startTyping', { groupName, userId, sender });
  }

  stopTyping(groupName, { userId, sender }) {
    if (!this.socket || !groupName || !userId) return;
    this.socket.emit('stopTyping', { groupName, userId, sender });
  }

  on(event, callback) {
    if (this.socket) {
      this._registered[event] = this._registered[event] || new Set();
      if (!this._registered[event].has(callback)) {
        this.socket.on(event, callback);
        // if socket is already connected and listener is for 'connect', invoke immediately
        if (event === 'connect' && this.socket.connected) {
          try { callback(); } catch (e) { console.error('connect handler error', e); }
        }
        this._registered[event].add(callback);
      }
    } else {
      this._pending[event] = this._pending[event] || [];
      // avoid duplicate pending callbacks
      if (!this._pending[event].includes(callback)) this._pending[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
        if (this._registered[event]) this._registered[event].delete(callback);
      } else {
        // remove all registered callbacks for event
        if (this._registered[event]) {
          this._registered[event].forEach((cb) => this.socket.off(event, cb));
          delete this._registered[event];
        } else {
          this.socket.off(event);
        }
      }
    }

    // also remove from pending
    if (this._pending[event]) {
      if (callback) {
        this._pending[event] = this._pending[event].filter((cb) => cb !== callback);
      } else {
        delete this._pending[event];
      }
    }
  }
}

export default new SocketService();
