import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import userRoutes from './routes/users.js';
import roomRoutes from './routes/rooms.js';
import fileRoutes from './routes/files.js';
import { initDatabase } from './database/init.js';
import { authenticateSocket } from './middleware/auth.js';
import { handleSocketConnection } from './socket/handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chat Application Server is running!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Initialize database
try {
  await initDatabase();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/files', fileRoutes);

// Socket.IO connection handling
io.use(authenticateSocket);
io.on('connection', (socket) => handleSocketConnection(socket, io));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to check server status`);
});