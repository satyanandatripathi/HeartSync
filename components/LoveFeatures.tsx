'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Calendar, Clock, MessageSquare, Star } from 'lucide-react';
import { useWebRTCStore } from '@/store/webrtcStore';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

interface LoveNote {
  id: string;
  text: string;
  sender: 'me' | 'partner';
  timestamp: Date;
}

interface SharedMoment {
  id: string;
  title: string;
  description: string;
  date: Date;
}

export default function LoveFeatures() {
  const [loveNotes, setLoveNotes] = useState<LoveNote[]>([]);
  const [sharedMoments, setSharedMoments] = useState<SharedMoment[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const { dataChannel } = useWebRTCStore();

  useEffect(() => {
    if (!dataChannel) return;

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'love-note') {
          setLoveNotes(prev => [...prev, {
            id: Date.now().toString(),
            text: data.text,
            sender: 'partner',
            timestamp: new Date(),
          }]);
          triggerConfetti();
        } else if (data.type === 'shared-moment') {
          setSharedMoments(prev => [...prev, {
            id: Date.now().toString(),
            title: data.title,
            description: data.description,
            date: new Date(data.date),
          }]);
        }
      } catch (error) {
        console.error('Error parsing love feature data:', error);
      }
    };
  }, [dataChannel]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#a855f7', '#f472b6'],
    });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const sendLoveNote = () => {
    if (!newNote.trim() || !dataChannel || dataChannel.readyState !== 'open') {
      return;
    }

    const note: LoveNote = {
      id: Date.now().toString(),
      text: newNote,
      sender: 'me',
      timestamp: new Date(),
    };

    setLoveNotes(prev => [...prev, note]);

    try {
      dataChannel.send(JSON.stringify({
        type: 'love-note',
        text: newNote,
      }));
      triggerConfetti();
    } catch (error) {
      console.error('Error sending love note:', error);
    }

    setNewNote('');
  };

  const addSharedMoment = () => {
    const title = prompt('Enter moment title:');
    if (!title) return;

    const description = prompt('Enter description:');
    if (!description) return;

    const moment: SharedMoment = {
      id: Date.now().toString(),
      title,
      description,
      date: new Date(),
    };

    setSharedMoments(prev => [...prev, moment]);

    if (dataChannel && dataChannel.readyState === 'open') {
      try {
        dataChannel.send(JSON.stringify({
          type: 'shared-moment',
          title,
          description,
          date: moment.date.toISOString(),
        }));
      } catch (error) {
        console.error('Error sharing moment:', error);
      }
    }
  };

  const loveMessages = [
    '💕 Thinking of you!',
    '❤️ You mean everything to me!',
    '💖 I love you more each day!',
    '💗 You make my heart happy!',
    '💓 Missing you so much!',
    '💞 You are my sunshine!',
    '💝 Forever and always!',
    '🌹 You are beautiful!',
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="glass border-b border-white/10 p-4">
        <h2 className="text-2xl font-bold text-gradient">Love Features</h2>
        <p className="text-sm text-purple-200">Special moments for you two</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Love Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
              <h3 className="text-xl font-semibold">Love Notes</h3>
            </div>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {loveNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: note.sender === 'me' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3 rounded-lg ${
                      note.sender === 'me'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 ml-auto max-w-xs'
                        : 'glass max-w-xs'
                    }`}
                  >
                    <p className="text-white text-sm">{note.text}</p>
                    <p className="text-xs text-white/70 mt-1">
                      {format(note.timestamp, 'HH:mm')}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendLoveNote()}
                placeholder="Write a love note..."
                className="flex-1 bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendLoveNote}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-semibold"
              >
                <Heart className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {loveMessages.map((msg) => (
                <motion.button
                  key={msg}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setNewNote(msg);
                    setTimeout(sendLoveNote, 100);
                  }}
                  className="px-3 py-1 glass rounded-full text-sm hover:glass-strong"
                >
                  {msg}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Shared Moments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <h3 className="text-xl font-semibold">Shared Moments</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addSharedMoment}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
              >
                Add Moment
              </motion.button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {sharedMoments.map((moment) => (
                  <motion.div
                    key={moment.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-strong rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{moment.title}</h4>
                        <p className="text-sm text-purple-200 mb-2">{moment.description}</p>
                        <div className="flex items-center gap-2 text-xs text-purple-300">
                          <Calendar className="w-4 h-4" />
                          <span>{format(moment.date, 'MMM dd, yyyy')}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{format(moment.date, 'HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {sharedMoments.length === 0 && (
                <div className="text-center py-8 text-purple-200">
                  <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No shared moments yet</p>
                  <p className="text-sm">Create your first special moment together!</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Anniversary Counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-semibold">Together Since</h3>
            </div>
            <div className="text-center py-8">
              <p className="text-3xl font-bold text-gradient mb-2">
                Set your anniversary date
              </p>
              <p className="text-purple-200">
                Coming soon: Track your special dates together!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

