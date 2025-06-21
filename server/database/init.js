import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar TEXT,
          online BOOLEAN DEFAULT false,
          last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Chat rooms table
      db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT DEFAULT 'group', -- 'group' or 'direct'
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Room members table
      db.run(`
        CREATE TABLE IF NOT EXISTS room_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          role TEXT DEFAULT 'member',
          FOREIGN KEY (room_id) REFERENCES rooms (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(room_id, user_id)
        )
      `);

      // Messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT,
          type TEXT DEFAULT 'text', -- 'text', 'file', 'image'
          file_url TEXT,
          file_name TEXT,
          file_size INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_id) REFERENCES rooms (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Typing indicators table
      db.run(`
        CREATE TABLE IF NOT EXISTS typing_indicators (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          is_typing BOOLEAN DEFAULT false,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_id) REFERENCES rooms (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(room_id, user_id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

export { db };