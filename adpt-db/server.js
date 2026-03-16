const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { verifyToken } = require('@clerk/backend');
const { z } = require('zod');

const socketPort = parseInt(process.env.SOCKET_PORT || '4000', 10);
const userSockets = new Map();
const socketUsers = new Map();
const userStatus = new Map();
const rateLimitBySocket = new Map();
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.SOCKET_RATE_WINDOW_MS || '10000', 10);
const RATE_LIMIT_MAX_EVENTS = parseInt(process.env.SOCKET_RATE_MAX_EVENTS || '80', 10);
const REQUIRE_SOCKET_AUTH =
  process.env.REQUIRE_SOCKET_AUTH === 'true' || process.env.NODE_ENV === 'production';

const parseAllowedOrigins = () => {
  const raw = process.env.SOCKET_CORS_ORIGINS || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    if (typeof value.toString === 'function') return value.toString();
  }
  return String(value);
};

const shortText = (max = 5000) => z.string().trim().min(1).max(max);

const directMessageSchema = z.object({
  receiverId: shortText(128),
  content: shortText(10000),
  type: z.enum(['text', 'file', 'emoji']).optional().default('text'),
  senderName: z.string().trim().max(120).optional(),
});

const friendAcceptedSchema = z.object({
  accepterId: shortText(128),
  senderId: shortText(128),
  senderName: z.string().trim().max(120),
  accepterName: z.string().trim().max(120),
  senderImage: z.string().trim().max(2048).optional().nullable(),
  accepterImage: z.string().trim().max(2048).optional().nullable(),
});

const typingSchema = z.object({
  receiverId: shortText(128),
  senderName: z.string().trim().max(120).optional(),
});

const groupMessageSchema = z.object({
  id: z.string().trim().max(128).optional(),
  groupId: z.union([z.string(), z.number()]),
  senderName: z.string().trim().max(120).optional(),
  content: shortText(10000),
  type: z.enum(['text', 'file', 'emoji']).optional().default('text'),
  fileUrl: z.string().trim().max(2048).optional(),
  fileName: z.string().trim().max(255).optional(),
  fileSize: z.number().nonnegative().max(50 * 1024 * 1024).optional(),
});

const deleteMessageSchema = z.object({
  messageId: shortText(128),
  conversationId: shortText(128).optional(),
  targetUserId: shortText(128).optional(),
  type: z.enum(['direct', 'group']),
});

const allowEvent = (socket, eventName) => {
  const now = Date.now();
  const bucket = rateLimitBySocket.get(socket.id) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  rateLimitBySocket.set(socket.id, bucket);

  if (bucket.count > RATE_LIMIT_MAX_EVENTS) {
    socket.emit('error', { message: `Too many ${eventName} events. Slow down.` });
    return false;
  }
  return true;
};

const getUserRoom = (userId) => `user_${normalizeId(userId)}`;

const addSocketForUser = (userId, socketId) => {
  const normalizedUserId = normalizeId(userId);
  const sockets = userSockets.get(normalizedUserId) || new Set();
  sockets.add(socketId);
  userSockets.set(normalizedUserId, sockets);
  socketUsers.set(socketId, normalizedUserId);
  return normalizedUserId;
};

const removeSocketForUser = (socketId) => {
  const userId = socketUsers.get(socketId);
  if (!userId) return null;

  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
      userStatus.set(userId, 'offline');
      socketUsers.delete(socketId);
      return userId;
    }
    userSockets.set(userId, sockets);
  }

  socketUsers.delete(socketId);
  return null;
};

const verifySocketIdentity = async (socket) => {
  const auth = socket.handshake.auth || {};
  const claimedUserId = normalizeId(auth.userId || socket.handshake.query?.userId || '');
  const token = typeof auth.token === 'string' ? auth.token : '';

  if (!claimedUserId) {
    throw new Error('Missing user id in socket auth');
  }

  if (!REQUIRE_SOCKET_AUTH) {
    return claimedUserId;
  }

  if (!token) {
    throw new Error('Missing auth token');
  }

  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('Server missing CLERK_SECRET_KEY for socket auth');
  }

  const payload = await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  const tokenUserId = normalizeId(payload?.sub || '');
  if (!tokenUserId || tokenUserId !== claimedUserId) {
    throw new Error('Token user mismatch');
  }

  return tokenUserId;
};

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: parseInt(process.env.SOCKET_MAX_BUFFER_BYTES || '1048576', 10),
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT_MS || '20000', 10),
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL_MS || '25000', 10),
});

io.use(async (socket, next) => {
  try {
    const userId = await verifySocketIdentity(socket);
    socket.data.userId = userId;
    return next();
  } catch (error) {
    return next(new Error(`Unauthorized: ${error.message}`));
  }
});

io.on('connection', (socket) => {
  const userId = normalizeId(socket.data.userId);
  addSocketForUser(userId, socket.id);
  userStatus.set(userId, 'online');
  socket.join(getUserRoom(userId));

  console.log(`Socket connected: ${socket.id} (user ${userId})`);
  io.emit('user_online', {
    userId,
    status: 'online',
    timestamp: new Date(),
  });

  socket.on('user_connect', (userId) => {
    if (!allowEvent(socket, 'user_connect')) return;

    const normalized = normalizeId(userId);
    if (!normalized || normalized !== socket.data.userId) {
      socket.emit('error', { message: 'user_connect user mismatch' });
      return;
    }

    addSocketForUser(normalized, socket.id);
    socket.join(getUserRoom(normalized));
  });

  socket.on('send_message', (data) => {
    try {
      if (!allowEvent(socket, 'send_message')) return;

      const parsed = directMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid send_message payload' });
        return;
      }

      const { receiverId, content, type, senderName } = parsed.data;
      const senderId = normalizeId(socket.data.userId);
      const receiverNormalized = normalizeId(receiverId);
      const encryptedState = typeof content === 'string' && content.startsWith('ENC.') ? '[CHECK]' : '[ERROR]';
      console.log(`[MAIL] Message from ${senderId} to ${receiverNormalized} (encrypted: ${encryptedState})`);

      if (userSockets.has(receiverNormalized)) {
        io.to(getUserRoom(receiverNormalized)).emit('receive_message', {
          _id: Date.now().toString(),
          sender: { id: senderId, name: senderName },
          content,
          type,
          timestamp: new Date(),
        });
        console.log(`[ENVELOPE] Message delivered to ${receiverNormalized}`);
      } else {
        console.log(`[WARNING] Receiver ${receiverNormalized} not online`);
      }

      socket.emit('message_sent', { id: Date.now().toString() });
    } catch (error) {
      console.error('Error in send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('friend_request_accepted', async (data) => {
    try {
      if (!allowEvent(socket, 'friend_request_accepted')) return;

      const parsed = friendAcceptedSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid friend_request_accepted payload' });
        return;
      }

      const { accepterId, senderId, senderName, accepterName, senderImage, accepterImage } = parsed.data;
      if (normalizeId(accepterId) !== normalizeId(socket.data.userId)) {
        socket.emit('error', { message: 'Unauthorized friend acceptance event' });
        return;
      }

      console.log(`[HANDSHAKE] Friend request accepted: ${senderId} <-> ${accepterId}`);

      if (userSockets.has(normalizeId(senderId))) {
        io.to(getUserRoom(senderId)).emit('new_conversation', {
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
        console.log(`Sender ${senderId} notified`);
      }

      io.to(getUserRoom(accepterId)).emit('new_conversation', {
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

  socket.on('user_typing', (data) => {
    if (!allowEvent(socket, 'user_typing')) return;

    const parsed = typingSchema.safeParse(data);
    if (!parsed.success) {
      socket.emit('error', { message: 'Invalid user_typing payload' });
      return;
    }

    const senderId = normalizeId(socket.data.userId);
    const receiverId = normalizeId(parsed.data.receiverId);
    if (userSockets.has(receiverId)) {
      io.to(getUserRoom(receiverId)).emit('user_typing', { senderId, senderName: parsed.data.senderName });
    }
  });

  socket.on('user_stop_typing', (data) => {
    if (!allowEvent(socket, 'user_stop_typing')) return;

    const parsed = z.object({ receiverId: shortText(128) }).safeParse(data);
    if (!parsed.success) {
      socket.emit('error', { message: 'Invalid user_stop_typing payload' });
      return;
    }

    const senderId = normalizeId(socket.data.userId);
    const receiverId = normalizeId(parsed.data.receiverId);
    if (userSockets.has(receiverId)) {
      io.to(getUserRoom(receiverId)).emit('user_stop_typing', { senderId });
    }
  });

  socket.on('join_group', (groupId) => {
    if (!allowEvent(socket, 'join_group')) return;

    const normalizedGroupId = normalizeId(groupId);
    if (!normalizedGroupId) return;
    socket.join(`group_${normalizedGroupId}`);
    console.log(`User joined group: ${normalizedGroupId}`);
  });

  socket.on('leave_group', (groupId) => {
    if (!allowEvent(socket, 'leave_group')) return;

    const normalizedGroupId = normalizeId(groupId);
    if (!normalizedGroupId) return;
    socket.leave(`group_${normalizedGroupId}`);
    console.log(`User left group: ${normalizedGroupId}`);
  });

  socket.on('send_group_message', (data) => {
    try {
      if (!allowEvent(socket, 'send_group_message')) return;

      const parsed = groupMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid send_group_message payload' });
        return;
      }

      const { id, groupId, senderName, content, type, fileUrl, fileName, fileSize } = parsed.data;
      const senderId = normalizeId(socket.data.userId);
      const normalizedGroupId = normalizeId(groupId);
      console.log(`Group message to ${normalizedGroupId} from ${senderId}`);

      io.to(`group_${normalizedGroupId}`).emit('receive_group_message', {
        id: id || Date.now().toString(),
        groupId: normalizedGroupId,
        sender: { id: senderId, name: senderName },
        content,
        type,
        fileUrl,
        fileName,
        fileSize,
        timestamp: new Date().toISOString(),
      });
      console.log(`Group message delivered to ${normalizedGroupId}`);
    } catch (error) {
      console.error('Error in send_group_message:', error);
      socket.emit('error', { message: 'Failed to send group message' });
    }
  });

  socket.on('delete_message', (data) => {
    try {
      if (!allowEvent(socket, 'delete_message')) return;

      const parsed = deleteMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid delete_message payload' });
        return;
      }

      const { messageId, conversationId, targetUserId, type } = parsed.data;
      const requesterId = normalizeId(socket.data.userId);
      console.log(`Delete ${type} message: ${messageId}`);

      if (type === 'direct') {
        if (targetUserId) {
          io.to(getUserRoom(targetUserId)).emit('message_deleted', { messageId, type: 'direct' });
        }
        io.to(getUserRoom(requesterId)).emit('message_deleted', { messageId, type: 'direct' });
      } else if (type === 'group') {
        if (!conversationId) {
          socket.emit('error', { message: 'Missing conversationId for group delete' });
          return;
        }
        io.to(`group_${conversationId}`).emit('message_deleted', { messageId, type: 'group' });
      }
      console.log('Delete event broadcasted');
    } catch (error) {
      console.error('Error in delete_message:', error);
    }
  });

  socket.on('disconnect', () => {
    rateLimitBySocket.delete(socket.id);
    const disconnectedUserId = removeSocketForUser(socket.id);

    if (disconnectedUserId) {
      io.emit('user_offline', {
        userId: disconnectedUserId,
        status: 'offline',
        timestamp: new Date(),
      });
      console.log(`User ${disconnectedUserId} disconnected`);
      console.log(`Active users now: ${userSockets.size}`);
    }
  });
});

global.io = io;

httpServer.listen(socketPort, (err) => {
  if (err) throw err;
  console.log(`Socket server ready on http://localhost:${socketPort}`);
});