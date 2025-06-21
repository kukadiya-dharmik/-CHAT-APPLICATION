import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's rooms
router.get('/rooms', authenticateToken, (req, res) => {
  const query = `
    SELECT r.*, u.username as created_by_username,
           (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count,
           (SELECT COUNT(*) FROM messages WHERE room_id = r.id) as message_count
    FROM rooms r
    JOIN room_members rm ON r.id = rm.room_id
    LEFT JOIN users u ON r.created_by = u.id
    WHERE rm.user_id = ?
    ORDER BY r.created_at DESC
  `;

  db.all(query, [req.user.id], (err, rooms) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ rooms });
  });
});

// Create a new room
router.post('/rooms', authenticateToken, (req, res) => {
  const { name, description, type = 'group' } = req.body;

  db.run('INSERT INTO rooms (name, description, type, created_by) VALUES (?, ?, ?, ?)', 
    [name, description, type, req.user.id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create room' });
      }

      const roomId = this.lastID;

      // Add creator as admin member
      db.run('INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, ?)', 
        [roomId, req.user.id, 'admin'], 
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to add user to room' });
          }

          res.json({ 
            room: { 
              id: roomId, 
              name, 
              description, 
              type, 
              created_by: req.user.id,
              member_count: 1,
              message_count: 0
            } 
          });
        }
      );
    }
  );
});

// Join a room
router.post('/rooms/:roomId/join', authenticateToken, (req, res) => {
  const { roomId } = req.params;

  // Check if room exists
  db.get('SELECT id FROM rooms WHERE id = ?', [roomId], (err, room) => {
    if (err || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is already a member
    db.get('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id], (err, membership) => {
      if (membership) {
        return res.json({ message: 'Already a member of this room' });
      }

      // Add user to room
      db.run('INSERT INTO room_members (room_id, user_id) VALUES (?, ?)', 
        [roomId, req.user.id], 
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to join room' });
          }
          res.json({ message: 'Joined room successfully' });
        }
      );
    });
  });
});

// Create or get direct chat room
router.post('/direct-chat', authenticateToken, (req, res) => {
  const { targetUserId } = req.body;
  const currentUserId = req.user.id;

  if (targetUserId === currentUserId) {
    return res.status(400).json({ error: 'Cannot start chat with yourself' });
  }

  // Check if target user exists
  db.get('SELECT id, username FROM users WHERE id = ?', [targetUserId], (err, targetUser) => {
    if (err || !targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Check if direct chat already exists
    const checkQuery = `
      SELECT r.* FROM rooms r
      JOIN room_members rm1 ON r.id = rm1.room_id
      JOIN room_members rm2 ON r.id = rm2.room_id
      WHERE r.type = 'direct'
      AND rm1.user_id = ?
      AND rm2.user_id = ?
      AND (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) = 2
    `;

    db.get(checkQuery, [currentUserId, targetUserId], (err, existingRoom) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingRoom) {
        // Return existing room
        res.json({
          room: {
            id: existingRoom.id,
            name: targetUser.username,
            type: 'direct',
            member_count: 2,
            message_count: 0
          }
        });
      } else {
        // Create new direct chat room
        db.run('INSERT INTO rooms (name, type, created_by) VALUES (?, ?, ?)', 
          [targetUser.username, 'direct', currentUserId], 
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create direct chat' });
            }

            const roomId = this.lastID;

            // Add both users to the room
            db.run('INSERT INTO room_members (room_id, user_id) VALUES (?, ?)', 
              [roomId, currentUserId], 
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to add users to room' });
                }

                db.run('INSERT INTO room_members (room_id, user_id) VALUES (?, ?)', 
                  [roomId, targetUserId], 
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: 'Failed to add users to room' });
                    }

                    res.json({
                      room: {
                        id: roomId,
                        name: targetUser.username,
                        type: 'direct',
                        member_count: 2,
                        message_count: 0
                      }
                    });
                  }
                );
              }
            );
          }
        );
      }
    });
  });
});

// Get online users
router.get('/online', authenticateToken, (req, res) => {
  db.all('SELECT id, username, avatar FROM users WHERE online = true AND id != ?', [req.user.id], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ users });
  });
});

// Search users
router.get('/search', authenticateToken, (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.json({ users: [] });
  }

  db.all('SELECT id, username, avatar, online FROM users WHERE username LIKE ? AND id != ? LIMIT 10', 
    [`%${q}%`, req.user.id], 
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ users });
    }
  );
});

export default router;