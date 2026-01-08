'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  MessageCircle, 
  Film, 
  Gamepad2, 
  Share2, 
  Heart,
  X,
  Settings
} from 'lucide-react';
import VideoCall from './VideoCall';
import Chat from './Chat';
import MovieStreamer from './MovieStreamer';
import Games from './Games';
import FileShare from './FileShare';
import LoveFeatures from './LoveFeatures';
import { useConnectionStore } from '@/store/connectionStore';
import { useWebRTCStore } from '@/store/webrtcStore';

type ActiveView = 'home' | 'video' | 'chat' | 'movies' | 'games' | 'files' | 'love';

export default function MainApp() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const { socket, peerId, remotePeerId } = useConnectionStore();
  const { initializePeerConnection, createOffer, isCallActive } = useWebRTCStore();

  useEffect(() => {
    if (!socket) return;

    // Initialize WebRTC when socket is ready
    initializePeerConnection();

    // Listen for WebRTC signaling
    socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
      const { createAnswer } = useWebRTCStore.getState();
      await createAnswer(offer);
    });

    socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
      const { setRemoteDescription } = useWebRTCStore.getState();
      await setRemoteDescription(answer);
    });

    socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      const { addIceCandidate } = useWebRTCStore.getState();
      await addIceCandidate(candidate);
    });

    // Auto-start call if both peers are connected
    if (peerId && remotePeerId && !isCallActive) {
      createOffer();
    }

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket, peerId, remotePeerId, isCallActive, initializePeerConnection, createOffer]);

  const navItems = [
    { id: 'home', icon: Heart, label: 'Home' },
    { id: 'video', icon: Video, label: 'Video Call' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'movies', icon: Film, label: 'Movies' },
    { id: 'games', icon: Gamepad2, label: 'Games' },
    { id: 'files', icon: Share2, label: 'Share Files' },
    { id: 'love', icon: Heart, label: 'Love Features' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass border-b border-white/10 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
              <span className="text-xl font-bold text-gradient">HeartSync</span>
            </motion.div>

            <div className="flex gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (item.id === 'video') {
                        setShowVideoOverlay(true);
                      } else {
                        setActiveView(item.id as ActiveView);
                      }
                    }}
                    className={`p-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white glow'
                        : 'glass hover:glass-strong text-purple-200'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {activeView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-4 py-12"
            >
              <HomeView onNavigate={setActiveView} />
            </motion.div>
          )}

          {activeView === 'video' && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <VideoCall />
            </motion.div>
          )}

          {activeView === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <Chat />
            </motion.div>
          )}

          {activeView === 'movies' && (
            <motion.div
              key="movies"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <MovieStreamer />
            </motion.div>
          )}

          {activeView === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, rotateY: -15 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 15 }}
              className="h-full"
            >
              <Games />
            </motion.div>
          )}

          {activeView === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <FileShare />
            </motion.div>
          )}

          {activeView === 'love' && (
            <motion.div
              key="love"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <LoveFeatures />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Overlay */}
        <AnimatePresence>
          {showVideoOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 pointer-events-none"
            >
              <div className="absolute bottom-4 right-4 w-80 h-60 glass rounded-2xl overflow-hidden pointer-events-auto">
                <button
                  onClick={() => setShowVideoOverlay(false)}
                  className="absolute top-2 right-2 z-10 p-2 bg-red-500 hover:bg-red-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
                <VideoCall isOverlay />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HomeView({ onNavigate }: { onNavigate: (view: ActiveView) => void }) {
  const features = [
    {
      icon: Video,
      title: 'Video Calls',
      description: 'See and hear each other with crystal clear quality',
      color: 'from-pink-500 to-rose-500',
      view: 'video' as ActiveView,
    },
    {
      icon: MessageCircle,
      title: 'Chat',
      description: 'Send messages, emojis, and express your feelings',
      color: 'from-purple-500 to-pink-500',
      view: 'chat' as ActiveView,
    },
    {
      icon: Film,
      title: 'Watch Together',
      description: 'Stream and watch movies from your device together',
      color: 'from-blue-500 to-purple-500',
      view: 'movies' as ActiveView,
    },
    {
      icon: Gamepad2,
      title: 'Play Games',
      description: 'Enjoy fun two-player games designed for couples',
      color: 'from-green-500 to-teal-500',
      view: 'games' as ActiveView,
    },
    {
      icon: Share2,
      title: 'Share Files',
      description: 'Send photos, videos, and documents securely',
      color: 'from-orange-500 to-red-500',
      view: 'files' as ActiveView,
    },
    {
      icon: Heart,
      title: 'Love Features',
      description: 'Special moments and features for couples',
      color: 'from-pink-500 to-purple-500',
      view: 'love' as ActiveView,
    },
  ];

  return (
    <div className="text-center">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-7xl font-bold mb-4 text-gradient"
      >
        Welcome to HeartSync
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-purple-200 mb-12"
      >
        Your connection is secure and ready
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => onNavigate(feature.view)}
              className="glass rounded-2xl p-6 cursor-pointer card-hover"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 mx-auto`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-purple-200 text-sm">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

