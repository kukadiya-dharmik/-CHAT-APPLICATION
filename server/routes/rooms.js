import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get public rooms (rooms that users can browse and join)
router.get('/public', authenticateToken, (req, res) => {
  const query = `
    SELECT r.*, u.username as created_by_username,
           (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count,
           (SELECT COUNT(*) FROM messages WHERE room_id = r.id) as message_count,
           CASE WHEN rm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member
    FROM rooms r
    LEFT JOIN users u ON r.created_by = u.id
    LEFT JOIN room_members rm ON r.id = rm.room_id AND rm.user_id = ?
    WHERE r.type = 'group'
    ORDER BY r.created_at DESC
  `;

  db.all(query, [req.user.id], (err, rooms) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ rooms });
  });
});

// Get room details
router.get('/:roomId', authenticateToken, (req, res) => {
  const { roomId } = req.params;

  // Check if user is member of the room
  db.get('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id], (err, membership) => {
    if (err || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT r.*, u.username as created_by_username,
             (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count,
             (SELECT COUNT(*) FROM messages WHERE room_id = r.id) as message_count
      FROM rooms r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `;

    db.get(query, [roomId], (err, room) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json({ room });
    });
  });
});

// Get room members
router.get('/:roomId/members', authenticateToken, (req, res) => {
  const { roomId } = req.params;

  // Check if user is member of the room
  db.get('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id], (err, membership) => {
    if (err || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT u.id, u.username, u.avatar, u.online, rm.role, rm.joined_at
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ?
      ORDER BY rm.joined_at ASC
    `;

    db.all(query, [roomId], (err, members) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ members });
    });
  });
});

export default router;