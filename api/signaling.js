// Vercel Serverless Function for Socket.io signaling
// Note: This is a workaround - for production, use a dedicated WebSocket service
import { Server } from 'socket.io';

export default function handler(req, res) {
  // This won't work for WebSockets in serverless
  // We need a separate service for the signaling server
  res.status(501).json({ 
    error: 'Signaling server must be deployed separately',
    message: 'Use Railway, Render, or a VPS for the signaling server'
  });
}

