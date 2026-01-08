const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    const room = rooms.get(roomId) || { peers: [] };
    room.peers.push(socket.id);
    rooms.set(roomId, room);

    socket.to(roomId).emit('peer-connected', socket.id);
    socket.emit('room-joined', { roomId, peers: room.peers.filter(id => id !== socket.id) });
  });

  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up rooms
    for (const [roomId, room] of rooms.entries()) {
      room.peers = room.peers.filter(id => id !== socket.id);
      if (room.peers.length === 0) {
        rooms.delete(roomId);
      } else {
        socket.to(roomId).emit('peer-disconnected', socket.id);
      }
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Use PORT from environment (for Railway, Render, Fly.io, etc.) or default to 3001
const PORT = process.env.PORT || process.env.SIGNALING_PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Signaling server running on http://${HOST}:${PORT}`);
  if (process.env.RENDER) {
    console.log(`✓ Deployed on Render - Service URL: ${process.env.RENDER_EXTERNAL_URL || 'Check Render dashboard'}`);
    console.log(`  Note: Free tier spins down after 15min inactivity (first request may take ~30s)`);
  } else if (process.env.RAILWAY_ENVIRONMENT) {
    console.log(`✓ Deployed on Railway - check your service URL`);
  } else {
    console.log(`Accessible at http://YOUR_IP:${PORT}`);
  }
});

