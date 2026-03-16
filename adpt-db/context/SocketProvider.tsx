'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/nextjs';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { getToken, userId } = useAuth();

  useEffect(() => {
    let activeSocket: Socket | null = null;
    let isMounted = true;

    if (!userId) {
      setSocket(null);
      return;
    }

    const init = async () => {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000,
        auth: async (cb) => {
          const token = await getToken();
          cb({ token, userId });
        },
      });

      newSocket.on('connect_error', (error: any) => {
        if (!isMounted) return;
        const msg = String(error?.message || '').toLowerCase();
        if (msg.includes('timeout') || msg.includes('xhr') || msg.includes('websocket') || msg.includes('network')) {
          console.warn('Socket provider: server unreachable, retrying...');
          return;
        }
        console.error('Socket provider connect error:', error);
      });

      newSocket.io.on('reconnect_failed', () => {
        if (isMounted) {
          console.warn('Socket provider: reconnect failed after max attempts');
        }
      });

      activeSocket = newSocket;
      setSocket(newSocket);
    };

    init().catch((error) => {
      console.error('Failed to initialize socket provider:', error);
    });

    return () => {
      isMounted = false;
      if (activeSocket) {
        activeSocket.removeAllListeners();
        activeSocket.disconnect();
      }
    };
  }, [getToken, userId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);