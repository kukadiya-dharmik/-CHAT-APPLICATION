import { db } from '../database/init.js';

const userSockets = new Map(); // userId -> socketId
const typingUsers = new Map(); // roomId -> Set of userIds

export const handleSocketConnection = (socket, io) => {
  console.log(`User ${socket.user.username} connected`);
  
  // Store user socket mapping
  userSockets.set(socket.userId, socket.id);
  
  // Update user online status
  db.run('UPDATE users SET online = true WHERE id = ?', [socket.userId]);
  
  // Broadcast user online status
  socket.broadcast.emit('user_online', {
    userId: socket.userId,
    username: socket.user.username
  });

  // Join user to their rooms
  db.all('SELECT room_id FROM room_members WHERE user_id = ?', [socket.userId], (err, rooms) => {
    if (!err && rooms) {
      rooms.forEach(room => {
        socket.join(`room_${room.room_id}`);
      });
    }
  });

  // Handle joining a room
  socket.on('join_room', (roomId) => {
    socket.join(`room_${roomId}`);
  });

  // Handle leaving a room
  socket.on('leave_room', (roomId) => {
    socket.leave(`room_${roomId}`);
  });

  // Handle new message
  socket.on('send_message', (data) => {
    // Broadcast message to room members
    socket.to(`room_${data.roomId}`).emit('new_message', {
      ...data,
      user: socket.user
    });
  });

  // Handle typing indicators
  socket.on('typing_start', (roomId) => {
    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Set());
    }
    typingUsers.get(roomId).add(socket.userId);
    
    socket.to(`room_${roomId}`).emit('user_typing', {
      userId: socket.userId,
      username: socket.user.username,
      isTyping: true
    });
  });

  socket.on('typing_stop', (roomId) => {
    if (typingUsers.has(roomId)) {
      typingUsers.get(roomId).delete(socket.userId);
    }
    
    socket.to(`room_${roomId}`).emit('user_typing', {
      userId: socket.userId,
      username: socket.user.username,
      isTyping: false
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.username} disconnected`);
    
    // Remove user from socket mapping
    userSockets.delete(socket.userId);
    
    // Update user offline status
    db.run('UPDATE users SET online = false, last_seen = CURRENT_TIMESTAMP WHERE id = ?', [socket.userId]);
    
    // Remove from typing indicators
    typingUsers.forEach((users, roomId) => {
      if (users.has(socket.userId)) {
        users.delete(socket.userId);
        socket.to(`room_${roomId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          isTyping: false
        });
      }
    });
    
    // Broadcast user offline status
    socket.broadcast.emit('user_offline', {
      userId: socket.userId,
      username: socket.user.username
    });
  });
};