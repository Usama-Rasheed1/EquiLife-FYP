import { useEffect, useRef, useState, useCallback } from 'react';
import socketService from '../services/socketService';
import axios from 'axios';


const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false); // socket connected
  const [connectionError, setConnectionError] = useState(null);
  const [currentGroupName, setCurrentGroupName] = useState(null);
  const [groupConnected, setGroupConnected] = useState(false); // joined group
  const isConnectedRef = useRef(false);
  const groupConnectedRef = useRef(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const userDataRef = useRef(null);
  const currentGroupRef = useRef(null);
  const lastRefetchRef = useRef(new Map()); // groupName -> timestamp ms

  // Initialize socket (run once)
  useEffect(() => {
  // handler references declared here so cleanup can access the same functions
  let handleConnect;
  let handleConnectError;
  let handleDisconnect;
  let handleReconnect;
  let handleReceiveMessage;
  let handleUserTyping;
  let handleUserStoppedTyping;

  const initializeSocket = async () => {
      try {
        const token = localStorage.getItem('authToken');

        // Fetch user profile if token available, otherwise use anonymous user
        if (token) {
          try {
            const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
            const response = await axios.get(`${backendUrl}/api/auth/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const user = response.data?.user;
            // Determine profile photo based on gender
            let avatarPhoto = '/user.jpg'; // default for male or no gender
            if (user?.gender && user.gender.toLowerCase() === 'female') {
              avatarPhoto = '/user2.png';
            }
            
            userDataRef.current = {
              userId: user?._id || user?.id || `anon_${Date.now()}`,
              sender: user?.fullName || 'Anonymous',
              avatar: user?.profilePhoto || avatarPhoto,
              phone: user?.phone || '',
            };
          } catch (err) {
            userDataRef.current = {
              userId: `anon_${Date.now()}`,
              sender: 'Anonymous',
              avatar: '/user.jpg',
              phone: '',
            };
          }
        } else {
          userDataRef.current = {
            userId: `anon_${Date.now()}`,
            sender: 'Anonymous',
            avatar: '/user.jpg',
            phone: '',
          };
        }

        // Connect socket (send token if present)
        socketService.connect(userDataRef.current.userId, token);

  // Native socket events
  // assign handler implementations to outer-scope variables so cleanup can remove them
        handleConnect = async () => {
          setIsConnected(true);
          isConnectedRef.current = true;
          setConnectionError(null);
          // if we were in a group before disconnect, rejoin it so server emits reach us
          const grp = currentGroupRef.current;
          if (grp && userDataRef.current) {
            try {
              console.log('Rejoining group after connect:', grp);
              const joined = await socketService.joinGroup({
                groupName: grp,
                userId: userDataRef.current.userId,
                sender: userDataRef.current.sender,
                avatar: userDataRef.current.avatar,
              });
              if (joined) {
            // set ref immediately so incoming emits are not ignored
            currentGroupRef.current = grp;
                groupConnectedRef.current = true;
                // re-fetch message history to catch any messages while disconnected
                try {
                  const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
                  const token = localStorage.getItem('authToken');
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                    const res = await fetch(`${backendUrl}/api/messages?groupName=${encodeURIComponent(grp)}`, {
                      headers,
                    });
                  if (res.ok) {
                      const data = await res.json();
                      setMessages((prev) => {
                        const incoming = data.map((m) => ({ ...m, isOwn: m.senderId === userDataRef.current.userId }));
                        const map = new Map();
                        // keep prev messages (including optimistic)
                        prev.forEach((p) => map.set(p.id || p._id, p));
                        // add/overwrite with incoming persisted messages
                        incoming.forEach((m) => map.set(m.id || m._id, m));
                        return Array.from(map.values());
                      });
                  }
                } catch (err) {
                  console.error('Failed to re-fetch messages after reconnect', err);
                }
              }
            } catch (err) {
              console.error('Error rejoining group after connect', err);
            }
          }
  };
  socketService.on('connect', handleConnect);

        // Reconnect occurs after an automatic reconnection; ensure we rejoin group and refresh history
        handleReconnect = async (attemptNumber) => {
          console.log('Socket reconnected, attempt:', attemptNumber);
          setIsConnected(true);
          isConnectedRef.current = true;
          setConnectionError(null);
          const grp = currentGroupRef.current;
          if (grp && userDataRef.current) {
            try {
              console.log('Rejoining group after reconnect:', grp);
              const joined = await socketService.joinGroup({
                groupName: grp,
                userId: userDataRef.current.userId,
                sender: userDataRef.current.sender,
                avatar: userDataRef.current.avatar,
              });
              if (joined) {
                currentGroupRef.current = grp;
                groupConnectedRef.current = true;
                // re-fetch messages to catch any missed while disconnected
                try {
                  const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
                  const token = localStorage.getItem('authToken');
                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                  const res = await fetch(`${backendUrl}/api/messages?groupName=${encodeURIComponent(grp)}`, {
                    headers,
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setMessages((prev) => {
                      const incoming = data.map((m) => ({ ...m, isOwn: m.senderId === userDataRef.current.userId }));
                      const map = new Map();
                      prev.forEach((p) => map.set(p.id || p._id, p));
                      incoming.forEach((m) => map.set(m.id || m._id, m));
                      return Array.from(map.values());
                    });
                  }
                } catch (err) {
                  console.error('Failed to re-fetch messages after reconnect', err);
                }
              }
            } catch (err) {
              console.error('Error rejoining group after reconnect', err);
            }
          }
        };
        socketService.on('reconnect', handleReconnect);

        handleConnectError = (err) => {
          setConnectionError(err.message);
          setIsConnected(false);
          isConnectedRef.current = false;
        };
  socketService.on('connect_error', handleConnectError);

        handleDisconnect = () => {
          setIsConnected(false);
          isConnectedRef.current = false;
          setGroupConnected(false);
          groupConnectedRef.current = false;
        };
  socketService.on('disconnect', handleDisconnect);

  // Socket events
  handleReceiveMessage = (messageData) => {
          const incomingGroup = messageData.groupName || messageData.group;
          // debug: log incoming group and current group refs to diagnose filtering
          try {
            console.debug('receive_message event:', { incomingGroup, currentGroupRef: currentGroupRef.current, currentGroupState: currentGroupName, messageData });
          } catch (e) {
            console.debug('receive_message debug error', e);
          }
          if (!incomingGroup || incomingGroup !== currentGroupRef.current) {
            console.debug('receive_message ignored (group mismatch)', { incomingGroup, currentGroupRef: currentGroupRef.current, currentGroupState: currentGroupName });
            return; // ignore messages for other groups
          }

          // normalize incoming id to a string for reliable comparison
          let incomingId = null;
          if (messageData.id !== undefined && messageData.id !== null) {
            incomingId = typeof messageData.id === 'object' && messageData.id?.toString ? messageData.id.toString() : messageData.id;
          } else if (messageData._id !== undefined && messageData._id !== null) {
            incomingId = typeof messageData._id === 'object' && messageData._id?.toString ? messageData._id.toString() : messageData._id;
          }
          const normalized = {
            id: incomingId,
            _id: incomingId,
            groupName: incomingGroup,
            message: messageData.message || messageData.content,
            senderId: messageData.senderId || messageData.sender?._id,
            sender: messageData.sender || messageData.senderName || (messageData.sender?._id ? undefined : messageData.sender),
            avatar: messageData.avatar || messageData.sender?.profilePhoto || '/user.jpg',
            phone: messageData.phone || messageData.sender?.phone || '',
            timestamp: messageData.timestamp || messageData.createdAt || new Date().toISOString(),
            isOwn: (messageData.senderId || messageData.sender?._id) === userDataRef.current?.userId,
          };

          setMessages((prev) => {
            // if server echoed a clientTempId, replace optimistic message
            const tempId = messageData.clientTempId;
            if (tempId) {
              return prev.map((m) => (m.id === tempId ? normalized : m));
            }

            const exists = prev.some((m) => (m.id && m.id.toString ? m.id.toString() : m.id) === incomingId || (m._id && m._id.toString ? m._id.toString() : m._id) === incomingId);
            if (exists) return prev;
            return [...prev, normalized];
          });

          // Debounced authoritative refetch: avoid frequent re-fetch storms
          (async () => {
            try {
              const grp = incomingGroup;
              const now = Date.now();
              const last = lastRefetchRef.current.get(grp) || 0;
              // only refetch if >3s since last refetch for this group
              if (now - last > 3000) {
                lastRefetchRef.current.set(grp, now);
                const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
                const token = localStorage.getItem('authToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${backendUrl}/api/messages?groupName=${encodeURIComponent(grp)}`, {
                  headers,
                });
                if (res.ok) {
                  const data = await res.json();
                  setMessages((prev) => {
                    const incoming = data.map((m) => ({ ...m, isOwn: m.senderId === userDataRef.current.userId }));
                    const map = new Map();
                    prev.forEach((p) => map.set(p.id || p._id, p));
                    incoming.forEach((m) => map.set(m.id || m._id, m));
                    return Array.from(map.values());
                  });
                }
              }
            } catch (err) {
              console.debug('Auto-refetch failed', err);
            }
          })();
  };
  socketService.on('receive_message', handleReceiveMessage);

  handleUserTyping = ({ sender, groupName }) => {
          if (groupName === currentGroupRef.current) {
            setTypingUsers((prev) => (prev.includes(sender) ? prev : [...prev, sender]));
          }
        };
  handleUserStoppedTyping = ({ sender, groupName }) => {
          if (groupName === currentGroupRef.current) {
            setTypingUsers((prev) => prev.filter((u) => u !== sender));
          }
        };
  socketService.on('user_typing', handleUserTyping);
  socketService.on('user_stopped_typing', handleUserStoppedTyping);
      } catch (err) {
        setConnectionError('Failed to initialize socket');
      }
    };

    initializeSocket();

    return () => {
      if (currentGroupName && userDataRef.current) {
        socketService.leaveGroup({ groupName: currentGroupName, userId: userDataRef.current.userId });
      }
      // remove exact handlers if they were created
      if (typeof handleConnect === 'function') socketService.off('connect', handleConnect);
      if (typeof handleConnectError === 'function') socketService.off('connect_error', handleConnectError);
      if (typeof handleReconnect === 'function') socketService.off('reconnect', handleReconnect);
      if (typeof handleDisconnect === 'function') socketService.off('disconnect', handleDisconnect);
      if (typeof handleReceiveMessage === 'function') socketService.off('receive_message', handleReceiveMessage);
      if (typeof handleUserTyping === 'function') socketService.off('user_typing', handleUserTyping);
      if (typeof handleUserStoppedTyping === 'function') socketService.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, []);

  // Join a group
  const joinGroup = useCallback(
    async (groupName) => {
      if (!groupName || !userDataRef.current) return false;

      if (currentGroupName && currentGroupName !== groupName) {
        leaveGroup();
      }

      // ask to join and wait for server ack to ensure socket is in the room before sending
  const joined = await socketService.rememberJoin({
        groupName,
        userId: userDataRef.current.userId,
        sender: userDataRef.current.sender,
        avatar: userDataRef.current.avatar,
      });

    if (joined) {
      // ensure ref reflects the joined room immediately so receive_message handlers work
      currentGroupRef.current = groupName;
      groupConnectedRef.current = true;
      setCurrentGroupName(groupName);
      setGroupConnected(true);
        setMessages([]);
        setTypingUsers([]);
        // Fetch message history for the group (only messages after user's signup date)
        (async () => {
          try {
            const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';
            const token = localStorage.getItem('authToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
              const res = await fetch(`${backendUrl}/api/messages?groupName=${encodeURIComponent(groupName)}`, {
              headers,
            });
            if (!res.ok) {
              const text = await res.text();
              console.error('Failed to fetch messages', res.status, text);
              setMessages([]);
              return;
            }
            const data = await res.json();
            // data is normalized by backend
                      setMessages((prev) => {
                        const incoming = data.map((m) => ({ ...m, isOwn: m.senderId === userDataRef.current.userId }));
                        const map = new Map();
                        prev.forEach((p) => map.set(p.id || p._id, p));
                        incoming.forEach((m) => map.set(m.id || m._id, m));
                        return Array.from(map.values());
                      });
          } catch (err) {
            console.error('Failed to fetch messages', err);
            setMessages([]);
          }
        })();
  }

  return joined;
    },
    [currentGroupName]
  );

  // Leave group
  const leaveGroup = useCallback(() => {
    if (!currentGroupName || !userDataRef.current) return;
    socketService.leaveGroup({
      groupName: currentGroupName,
      userId: userDataRef.current.userId,
    });
    setCurrentGroupName(null);
    setGroupConnected(false);
    setMessages([]);
    setTypingUsers([]);
  }, [currentGroupName]);

  // ensure ref always reflects latest joined group so single-mounted handlers can read it
  useEffect(() => {
    currentGroupRef.current = currentGroupName;
  }, [currentGroupName]);

  // Send message
  const sendMessage = useCallback(async (groupName, message) => {
    if (!userDataRef.current || !message?.trim()) return false;
    // ensure we're connected and joined to the current group before sending using refs
    if (!isConnectedRef.current || !groupConnectedRef.current || currentGroupRef.current !== groupName) return false;

    // create client temporary id for optimistic UI
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

    const optimistic = {
      id: tempId,
      _id: tempId,
      groupName,
      message,
      senderId: userDataRef.current.userId,
      sender: userDataRef.current.sender,
      avatar: userDataRef.current.avatar || '/user.jpg',
      phone: userDataRef.current.phone || '',
      timestamp: new Date().toISOString(),
      isOwn: true,
      optimistic: true,
    };

    // add optimistic message
    setMessages((prev) => [...prev, optimistic]);

    // send via socket including temp id so server can echo it back; wait for ack
    const ack = await socketService.sendMessage(
      groupName,
      message,
      {
        userId: userDataRef.current.userId,
        sender: userDataRef.current.sender,
        avatar: userDataRef.current.avatar,
      },
      tempId
    );

    if (!ack || !ack.ok) {
      // remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId && m._id !== tempId));
      return false;
    }

    // server returned saved message; merge/replace optimistic entry
    const saved = ack.message;
    const normalized = {
      id: saved.id || saved._id,
      _id: saved.id || saved._id,
      groupName: saved.groupName,
      message: saved.message || saved.content,
      senderId: saved.senderId || saved.sender?._id,
      sender: saved.sender || saved.senderName || (saved.sender?._id ? undefined : saved.sender),
      avatar: saved.avatar || '/user.jpg',
      phone: saved.phone || '',
      timestamp: saved.timestamp || saved.createdAt || new Date().toISOString(),
      isOwn: (saved.senderId || saved.sender?._id) === userDataRef.current.userId,
    };

    setMessages((prev) => {
      const map = new Map();
      prev.forEach((m) => map.set(m.id || m._id, m));
      // replace optimistic
      map.delete(tempId);
      map.set(normalized.id || normalized._id, normalized);
      return Array.from(map.values());
    });

    return true;
  }, []);

  // Typing indicators
  const startTyping = useCallback((groupName) => {
    if (!userDataRef.current) return;
    socketService.startTyping(groupName, {
      userId: userDataRef.current.userId,
      sender: userDataRef.current.sender,
    });
  }, []);

  const stopTyping = useCallback((groupName) => {
    if (!userDataRef.current) return;
    socketService.stopTyping(groupName, {
      userId: userDataRef.current.userId,
      sender: userDataRef.current.sender,
    });
  }, []);

  return {
    isConnected,       // socket connected
    groupConnected,     // joined group
    connectionError,
    messages,
    typingUsers,
    joinGroup,
    leaveGroup,
    sendMessage,
    startTyping,
    stopTyping,
  currentGroupName,
  };
};

export default useSocket;