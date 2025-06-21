import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get messages for a room
router.get('/room/:roomId', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  // Check if user is member of the room
  db.get('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id], (err, membership) => {
    if (err || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages with user details
    const query = `
      SELECT m.*, u.username, u.avatar
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [roomId, parseInt(limit), offset], (err, messages) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ messages: messages.reverse() });
    });
  });
});

// Send a message
router.post('/send', authenticateToken, (req, res) => {
  const { roomId, content, type = 'text', fileUrl, fileName, fileSize } = req.body;

  // Check if user is member of the room
  db.get('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id], (err, membership) => {
    if (err || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Insert message
    const query = `
      INSERT INTO messages (room_id, user_id, content, type, file_url, file_name, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [roomId, req.user.id, content, type, fileUrl, fileName, fileSize], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to send message' });
      }

      // Get the complete message with user details
      db.get(`
        SELECT m.*, u.username, u.avatar
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `, [this.lastID], (err, message) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message });
      });
    });
  });
});

export default router;