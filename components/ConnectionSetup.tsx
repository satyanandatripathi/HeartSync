'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Copy, Check, Sparkles, Wifi } from 'lucide-react';
import { useConnectionStore } from '@/store/connectionStore';

export default function ConnectionSetup() {
  const [localIP, setLocalIP] = useState('');
  const [signalingServer, setSignalingServer] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { connect, peerId, isConnected, setLocalIP: setStoreIP } = useConnectionStore();

  useEffect(() => {
    // Check for production signaling server URL from environment
    // Next.js makes NEXT_PUBLIC_* vars available at build time
    const productionSignalingServer = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
    
    if (productionSignalingServer) {
      setSignalingServer(productionSignalingServer);
    }

    // First, check if we're already accessing via IP address
    if (typeof window !== 'undefined') {
      const currentHost = window.location.hostname;
      // If accessing via IP (not localhost), use that IP
      if (currentHost !== 'localhost' && currentHost !== '127.0.0.1' && currentHost.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        setLocalIP(currentHost);
        setStoreIP(currentHost);
        // Set signaling server immediately (unless production URL is set)
        if (!productionSignalingServer) {
          setSignalingServer(`http://${currentHost}:3001`);
        }
        return; // Skip WebRTC detection if we already have IP from URL
      }
    }

    // Get local IP address via WebRTC (fallback method)
    const getLocalIP = async () => {
      try {
        // Try to get IP from WebRTC
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        
        pc.createDataChannel('');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const ipMatch = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
            if (ipMatch && !ipMatch[0].startsWith('127.')) {
              setLocalIP(ipMatch[0]);
              setStoreIP(ipMatch[0]);
              // Set signaling server when IP is detected
              setSignalingServer(`http://${ipMatch[0]}:3001`);
            }
          }
        };
        
        setTimeout(() => pc.close(), 5000);
      } catch (error) {
        console.error('Error getting local IP:', error);
        // Fallback: use current hostname if available
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          const hostname = window.location.hostname;
          setLocalIP(hostname);
          setStoreIP(hostname);
          setSignalingServer(`http://${hostname}:3001`);
        } else {
          setLocalIP('Check your network settings');
        }
      }
    };
    
    getLocalIP();
  }, [setStoreIP]);

  // This effect is now handled in the main useEffect above

  const handleConnect = async () => {
    if (!signalingServer || !signalingServer.trim()) {
      alert('Please enter signaling server address (e.g., http://192.168.1.100:3001)');
      return;
    }

    // Validate URL format
    try {
      new URL(signalingServer);
    } catch (error) {
      alert('Invalid URL format. Please use format: http://your-ip:3001');
      return;
    }

    setConnecting(true);
    console.log('Connecting to signaling server:', signalingServer);
    
    try {
      connect(signalingServer.trim());
      // Reset connecting state after a short delay
      setTimeout(() => setConnecting(false), 3000);
    } catch (error) {
      setConnecting(false);
      console.error('Connection failed:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get the actual URL being used (from browser)
  const getFullURL = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port || '3000';
      // If we have a detected IP, prefer it, otherwise use current hostname
      return `http://${localIP || hostname}:${port}`;
    }
    return localIP ? `http://${localIP}:3000` : '';
  };

  const fullURL = getFullURL();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-8 md:p-12 w-full max-w-2xl"
    >
      <div className="text-center mb-8">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-block mb-4"
        >
          <Heart className="w-16 h-16 text-pink-500 fill-pink-500" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">
          HeartSync
        </h1>
        <p className="text-purple-200 text-lg">
          Connect with your loved one, securely and beautifully
        </p>
      </div>

      <div className="space-y-6">
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Your Connection Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-purple-200 mb-2">
                Your IP Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localIP}
                  readOnly
                  className="flex-1 bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => copyToClipboard(localIP)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-purple-200 mb-2">
                Full URL to Share
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fullURL}
                  readOnly
                  className="flex-1 bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => copyToClipboard(fullURL)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-purple-200 mb-2">
                Signaling Server (default: same as your IP on port 3001)
              </label>
              <input
                type="text"
                value={signalingServer}
                onChange={(e) => setSignalingServer(e.target.value)}
                placeholder="http://your-ip:3001"
                className="w-full bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConnect}
          disabled={connecting || isConnected}
          className={`w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all glow ${
            (connecting || isConnected) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {connecting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <Check className="w-5 h-5" />
                Connected!
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Start Connection
              </>
            )}
          </span>
        </motion.button>

        {!isConnected && !connecting && (
          <div className="text-center text-sm text-purple-300 mt-2 space-y-1">
            <p>Make sure the signaling server is running on port 3001</p>
            <p className="text-xs text-purple-400">
              Check terminal for: &quot;Signaling server running on http://0.0.0.0:3001&quot;
            </p>
          </div>
        )}

        {connecting && (
          <div className="text-center text-sm text-purple-300 mt-2 space-y-1">
            <p>Connecting to signaling server...</p>
            <p className="text-xs text-purple-400">
              If this takes too long, check that the server is running and the IP is correct
            </p>
          </div>
        )}

        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-green-400 mt-2"
          >
            ✓ Successfully connected to signaling server!
          </motion.div>
        )}

        {peerId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-strong rounded-2xl p-4"
          >
            <p className="text-sm text-purple-200 mb-2">Your Peer ID:</p>
            <code className="text-xs text-purple-300 break-all">{peerId}</code>
            <p className="text-xs text-purple-300 mt-2">
              Share this with your partner to connect
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

