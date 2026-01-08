'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Video, MessageCircle, Film, Gamepad2, Share2, Sparkles } from 'lucide-react';
import ConnectionSetup from '@/components/ConnectionSetup';
import MainApp from '@/components/MainApp';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useConnectionStore } from '@/store/connectionStore';

export default function Home() {
  const { isConnected, peerId } = useConnectionStore();
  const [showCreds, setShowCreds] = useState(false);

  useEffect(() => {
    // Get local IP address
    const getLocalIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        // This is public IP, but we'll show local IP in connection setup
      } catch (error) {
        console.error('Error fetching IP:', error);
      }
    };
    getLocalIP();
  }, []);

  if (!isConnected) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <ConnectionSetup />
          </motion.div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

