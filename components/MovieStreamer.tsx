'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Upload, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { useWebRTCStore } from '@/store/webrtcStore';

export default function MovieStreamer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { dataChannel } = useWebRTCStore();

  useEffect(() => {
    if (!dataChannel) return;

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'video-control') {
          handleRemoteControl(data.action, data.value);
        }
      } catch (error) {
        console.error('Error parsing video control:', error);
      }
    };
  }, [dataChannel]);

  const handleRemoteControl = (action: string, value?: any) => {
    if (!videoRef.current) return;

    switch (action) {
      case 'play':
        videoRef.current.play();
        setIsPlaying(true);
        break;
      case 'pause':
        videoRef.current.pause();
        setIsPlaying(false);
        break;
      case 'seek':
        if (value !== undefined) {
          videoRef.current.currentTime = value;
        }
        break;
      case 'volume':
        if (value !== undefined) {
          videoRef.current.volume = value;
        }
        break;
      case 'mute':
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
        break;
    }
  };

  const sendControl = (action: string, value?: any) => {
    if (dataChannel && dataChannel.readyState === 'open') {
      try {
        dataChannel.send(JSON.stringify({
          type: 'video-control',
          action,
          value,
        }));
      } catch (error) {
        console.error('Error sending control:', error);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } else {
      alert('Please select a video file');
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      sendControl('pause');
    } else {
      videoRef.current.play();
      sendControl('play');
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    sendControl('seek', time);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
    sendControl('mute');
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="glass border-b border-white/10 p-4">
        <h2 className="text-2xl font-bold text-gradient">Watch Together</h2>
        <p className="text-sm text-purple-200">Stream movies from your device</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {!videoUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <label className="cursor-pointer">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass rounded-3xl p-12 card-hover"
              >
                <Film className="w-20 h-20 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Select a Video File</h3>
                <p className="text-purple-200 mb-4">
                  Choose a video file from your device to stream
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors">
                  <Upload className="w-5 h-5" />
                  <span>Choose File</span>
                </div>
              </motion.div>
            </label>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl"
          >
            <div className="relative glass rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                src={videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full"
              />

              {/* Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-4 mb-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlayPause}
                    className="p-2 rounded-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </motion.button>

                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-purple-500/30 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 text-center">
                <p className="text-purple-200">
                  Streaming: <span className="font-semibold">{selectedFile.name}</span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

