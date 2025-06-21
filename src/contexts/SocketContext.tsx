import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Array<{ id: number; username: string; avatar?: string }>;
  typingUsers: Record<number, string[]>; // roomId -> usernames
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: number; username: string; avatar?: string }>>([]);
  const [typingUsers, setTypingUsers] = useState<Record<number, string[]>>({});

  useEffect(() => {
    if (token && user) {
      const newSocket = io('http://localhost:3001', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('user_online', (data) => {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.id === data.userId);
          if (!exists) {
            return [...prev, { id: data.userId, username: data.username }];
          }
          return prev;
        });
      });

      newSocket.on('user_offline', (data) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== data.userId));
      });

      newSocket.on('user_typing', ({ userId, username, isTyping }) => {
        // This would be handled by individual chat components
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  // Fetch initial online users
  useEffect(() => {
    if (token) {
      fetch('http://localhost:3001/api/users/online', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setOnlineUsers(data.users);
        }
      })
      .catch(console.error);
    }
  }, [token]);

  const value = {
    socket,
    onlineUsers,
    typingUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};