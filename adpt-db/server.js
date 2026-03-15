const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const userSockets = new Map();
const userStatus = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ============== USER CONNECTION ==============
    socket.on('user_connect', (userId) => {
      if (!userId) {
        console.error('No userId in user_connect');
        return;
      }

      userSockets.set(userId, socket.id);
      userStatus.set(userId, 'online');

      console.log(`User ${userId} connected with socket ${socket.id}`);
      console.log(`Active users: ${userSockets.size}`);

      io.emit('user_online', {
        userId,
        status: 'online',
        timestamp: new Date()
      });
    });

    // ============== REAL-TIME MESSAGING ==============
    socket.on('send_message', (data) => {
      try {
        const { senderId, receiverId, content, type, senderName } = data;
        console.log(`[MAIL] Message from ${senderId} to ${receiverId} (encrypted: ${content.startsWith('ENC.') ? '[CHECK]' : '[ERROR]'})`);

        const receiverSocketId = userSockets.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', {
            _id: Date.now().toString(),
            sender: { id: senderId, name: senderName },
            content, // Pass encrypted content directly
            type,
            timestamp: new Date(),
          });
          console.log(`[ENVELOPE] Message delivered to ${receiverId}`);
        } else {
          console.log(`[WARNING] Receiver ${receiverId} not online`);
        }

        socket.emit('message_sent', { id: Date.now().toString() });
      } catch (error) {
        console.error('Error in send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ============== FRIEND REQUEST ACCEPTANCE ==============
    socket.on('friend_request_accepted', async (data) => {
      try {
        const { accepterId, senderId, senderName, accepterName, senderImage, accepterImage } = data;
        console.log(`[HANDSHAKE] Friend request accepted: ${senderId} <-> ${accepterId}`);

        const senderSocketId = userSockets.get(senderId);

        if (senderSocketId) {
          io.to(senderSocketId).emit('new_conversation', {
            id: accepterId,
            friend: {
              id: accepterId,
              name: accepterName,
              avatar: accepterImage,
              status: userStatus.get(accepterId) || 'offline',
            },
            lastMessage: null,
            unreadCount: 0,
          });
          console.log(`📲 Sender ${senderId} notified`);
        }

        socket.emit('new_conversation', {
          id: senderId,
          friend: {
            id: senderId,
            name: senderName,
            avatar: senderImage,
            status: userStatus.get(senderId) || 'offline',
          },
          lastMessage: null,
          unreadCount: 0,
        });
        console.log(`Accepter ${accepterId} notified`);
      } catch (error) {
        console.error('Error in friend_request_accepted:', error);
        socket.emit('error', { message: 'Failed to process friend request' });
      }
    });

    // ============== TYPING INDICATORS ==============
    socket.on('user_typing', (data) => {
      const { receiverId, senderId, senderName } = data;
      const receiverSocketId = userSockets.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { senderId, senderName });
      }
    });

    socket.on('user_stop_typing', (data) => {
      const { receiverId, senderId } = data;
      const receiverSocketId = userSockets.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_stop_typing', { senderId });
      }
    });

    // ============== GROUP MESSAGING ==============
    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`User joined group: ${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
      console.log(`User left group: ${groupId}`);
    });

    socket.on('send_group_message', (data) => {
      try {
        const { id, groupId, senderId, senderName, content, type } = data;
        console.log(`Group message to ${groupId} from ${senderId}`);

        // Broadcast to all users in group with SAME ID from client
        io.to(`group_${groupId}`).emit('receive_group_message', {
          id: id || Date.now().toString(), // Use client ID if provided
          groupId,
          sender: { id: senderId, name: senderName },
          content, // Encrypted content
          type,
          timestamp: new Date().toISOString(),
        });
        console.log(`Group message delivered to ${groupId}`);
      } catch (error) {
        console.error('Error in send_group_message:', error);
        socket.emit('error', { message: 'Failed to send group message' });
      }
    });

    // ============== MESSAGE DELETION ==============
    socket.on('delete_message', (data) => {
      try {
        const { messageId, conversationId, type } = data; // type: 'direct' or 'group'
        console.log(`Delete ${type} message: ${messageId}`);

        if (type === 'direct') {
          // Broadcast to conversation partner
          io.emit('message_deleted', { messageId, type: 'direct' });
        } else if (type === 'group') {
          // Broadcast to group room
          io.to(`group_${conversationId}`).emit('message_deleted', { messageId, type: 'group' });
        }
        console.log(`Delete event broadcasted`);
      } catch (error) {
        console.error('Error in delete_message:', error);
      }
    });

    // ============== DISCONNECT ==============
    socket.on('disconnect', () => {
      let disconnectedUserId = '';

      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          userSockets.delete(userId);
          userStatus.set(userId, 'offline');
          break;
        }
      }

      if (disconnectedUserId) {
        io.emit('user_offline', {
          userId: disconnectedUserId,
          status: 'offline',
          timestamp: new Date()
        });
        console.log(`User ${disconnectedUserId} disconnected`);
        console.log(`Active users now: ${userSockets.size}`);
      }
    });
  });

  global.io = io; // Optional: access io in route handlers

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});