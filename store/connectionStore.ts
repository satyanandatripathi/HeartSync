import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface ConnectionState {
  isConnected: boolean;
  peerId: string | null;
  remotePeerId: string | null;
  socket: Socket | null;
  localIP: string;
  setLocalIP: (ip: string) => void;
  setPeerId: (id: string) => void;
  setRemotePeerId: (id: string) => void;
  connect: (signalingServer: string) => void;
  disconnect: () => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isConnected: false,
  peerId: null,
  remotePeerId: null,
  socket: null,
  localIP: '',
  setLocalIP: (ip: string) => set({ localIP: ip }),
  setPeerId: (id: string) => set({ peerId: id }),
  setRemotePeerId: (id: string) => set({ remotePeerId: id }),
  connect: async (signalingServer: string) => {
    try {
      // Disconnect existing socket if any
      const { socket: existingSocket } = get();
      if (existingSocket) {
        existingSocket.disconnect();
      }

      // Validate URL
      if (!signalingServer || !signalingServer.startsWith('http')) {
        console.error('Invalid signaling server URL:', signalingServer);
        alert('Please enter a valid signaling server URL (e.g., http://your-ip:3001)');
        return;
      }

      const socket = io(signalingServer, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
        timeout: 10000,
      });

      socket.on('connect', () => {
        const peerId = socket.id;
        console.log('Connected to signaling server:', signalingServer, 'Peer ID:', peerId);
        set({ socket, peerId, isConnected: true });
      });

      let connectionAttempts = 0;
      const maxAttempts = 3;

      socket.on('connect_error', (error) => {
        connectionAttempts++;
        console.error('Connection error:', error.message);
        set({ isConnected: false });
        
        // Show user-friendly error after first attempt fails
        if (connectionAttempts === 1) {
          const errorMsg = error.message.toLowerCase();
          let userMessage = 'Failed to connect to signaling server.\n\n';
          
          if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
            userMessage += 'Possible causes:\n';
            userMessage += '1. Signaling server is not running\n';
            userMessage += '2. Wrong IP address or port\n';
            userMessage += '3. Firewall blocking port 3001\n';
            userMessage += '4. Server not accessible from your network\n\n';
            userMessage += 'Please check:\n';
            userMessage += '- Is the server running? (Check terminal)\n';
            userMessage += '- Is the IP address correct?\n';
            userMessage += '- Can you access http://' + signalingServer.replace('http://', '').split(':')[0] + ':3001 in your browser?';
          } else if (errorMsg.includes('refused') || errorMsg.includes('econnrefused')) {
            userMessage += 'Connection refused. The signaling server is not running or not accessible.';
          } else {
            userMessage += 'Error: ' + error.message;
          }
          
          // Only show alert once, not on every retry
          setTimeout(() => {
            if (!get().isConnected) {
              alert(userMessage);
            }
          }, 2000);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from signaling server:', reason);
        set({ isConnected: false });
      });

      socket.on('peer-connected', (remoteId: string) => {
        console.log('Peer connected:', remoteId);
        set({ remotePeerId: remoteId });
      });

      socket.on('error', (error: string) => {
        console.error('Socket error:', error);
      });
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect to signaling server. Please check the URL and ensure the server is running.');
    }
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null, isConnected: false, peerId: null, remotePeerId: null });
  },
}));

