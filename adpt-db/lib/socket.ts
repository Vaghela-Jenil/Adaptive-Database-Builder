import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { connectDB } from './mongodb';
import { Message } from '@/lib/models/Message';
import { User } from '@/lib/models/Users';

interface UserSocket {
  userId: string;
  socketId: string;
}

// Global store for connection state
const userSockets: Map<string, UserSocket> = new Map();
const userStatus: Map<string, 'online' | 'offline' | 'away'> = new Map();

export async function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Attach io to global object for access in API routes if needed
  (global as any).io = io;

  io.on('connection', (socket: Socket) => {
    
    // ============== USER CONNECTION ==============
    socket.on('user_connect', async (userId: string) => {
      if (!userId) return;
      
      userSockets.set(userId, { userId, socketId: socket.id });
      userStatus.set(userId, 'online');
      
      // Update database status
      await connectDB();
      await User.findByIdAndUpdate(userId, { chatStatus: 'online' });
      
      // Notify others
      socket.broadcast.emit('user_status_changed', { userId, status: 'online' });
    });

    // ============== REAL-TIME MESSAGING ==============
    socket.on('send_message', async (data: any) => {
      try {
        const { senderId, receiverId, content, type } = data;

        await connectDB();
        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          type: type || 'text',
        });

        const receiver = userSockets.get(receiverId);

        if (receiver) {
          io.to(receiver.socketId).emit('receive_message', {
            ...message.toObject(),
            timestamp: message.createdAt
          });
        }
        
        // Acknowledge to sender
        socket.emit('message_sent', message);
      } catch (error) {
        socket.emit('error', { message: 'Message delivery failed' });
      }
    });

    // ============== TYPING LOGIC ==============
    socket.on('typing_start', ({ receiverId, senderId }) => {
      const receiver = userSockets.get(receiverId);
      if (receiver) io.to(receiver.socketId).emit('user_typing', { senderId });
    });

    socket.on('typing_stop', ({ receiverId, senderId }) => {
      const receiver = userSockets.get(receiverId);
      if (receiver) io.to(receiver.socketId).emit('user_stop_typing', { senderId });
    });

    // ============== DISCONNECT ==============
    socket.on('disconnect', async () => {
      let disconnectedId: string | null = null;
      
      for (const [userId, uSocket] of userSockets.entries()) {
        if (uSocket.socketId === socket.id) {
          disconnectedId = userId;
          break;
        }
      }

      if (disconnectedId) {
        userSockets.delete(disconnectedId);
        userStatus.set(disconnectedId, 'offline');
        
        await connectDB();
        await User.findByIdAndUpdate(disconnectedId, { chatStatus: 'offline' });
        
        io.emit('user_status_changed', { userId: disconnectedId, status: 'offline' });
      }
    });
  });

  return io;
}