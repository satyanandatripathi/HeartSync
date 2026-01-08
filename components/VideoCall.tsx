'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { useMediaStore } from '@/store/mediaStore';
import { useWebRTCStore } from '@/store/webrtcStore';

interface VideoCallProps {
  isOverlay?: boolean;
}

export default function VideoCall({ isOverlay = false }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { 
    localStream, 
    remoteStream, 
    isVideoEnabled, 
    isAudioEnabled,
    setLocalStream,
    toggleVideo,
    toggleAudio 
  } = useMediaStore();
  const { endCall, isCallActive } = useWebRTCStore();

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera/microphone. Please check permissions.');
      }
    };

    if (!localStream) {
      initializeMedia();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream, setLocalStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      remoteVideoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isOverlay) {
    return (
      <div className="relative w-full h-full">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <p className="text-purple-200">Waiting for partner...</p>
          </div>
        )}
        {localStream && (
          <div className="absolute bottom-2 right-2 w-24 h-18 rounded-lg overflow-hidden border-2 border-purple-500">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* Remote Video */}
        <div className="relative w-full h-full max-w-7xl mx-auto">
          {remoteStream ? (
            <motion.video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full object-contain rounded-2xl glass"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex items-center justify-center glass rounded-2xl"
            >
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Video className="w-16 h-16 text-white" />
                </div>
                <p className="text-xl text-purple-200">Waiting for your partner to join...</p>
              </div>
            </motion.div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {localStream && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute bottom-4 right-4 w-64 h-48 rounded-xl overflow-hidden glass border-2 border-purple-500"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="glass border-t border-white/10 p-6"
      >
        <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoEnabled
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all ${
              isAudioEnabled
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="p-4 rounded-full bg-purple-600 hover:bg-purple-700 transition-all"
          >
            {isFullscreen ? (
              <Minimize2 className="w-6 h-6 text-white" />
            ) : (
              <Maximize2 className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </motion.button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-purple-200">
            {isCallActive ? 'Connected' : 'Connecting...'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

