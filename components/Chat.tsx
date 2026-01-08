'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, Smile, Paperclip } from 'lucide-react';
import { useWebRTCStore } from '@/store/webrtcStore';
import { format } from 'date-fns';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'partner';
  timestamp: Date;
  type: 'text' | 'emoji' | 'love';
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { dataChannel } = useWebRTCStore();

  const emojis = ['😊', '❤️', '😍', '🥰', '😘', '💕', '💖', '💗', '💓', '💞', '💝', '🌹', '🎉', '✨', '🌟', '💫'];

  useEffect(() => {
    if (!dataChannel) return;

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: data.text,
            sender: 'partner',
            timestamp: new Date(),
            type: data.messageType || 'text',
          }]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }, [dataChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string, type: 'text' | 'emoji' | 'love' = 'text') => {
    if (!text.trim() || !dataChannel || dataChannel.readyState !== 'open') {
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      text,
      sender: 'me',
      timestamp: new Date(),
      type,
    };

    setMessages(prev => [...prev, message]);

    try {
      dataChannel.send(JSON.stringify({
        type: 'message',
        text,
        messageType: type,
      }));
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setInputText('');
  };

  const sendLoveNote = () => {
    const loveNotes = [
      '💕 Thinking of you!',
      '❤️ You mean the world to me!',
      '💖 I love you more than words can say!',
      '💗 You make my heart skip a beat!',
      '💓 Missing you so much!',
      '💞 You are my everything!',
    ];
    const randomNote = loveNotes[Math.floor(Math.random() * loveNotes.length)];
    sendMessage(randomNote, 'love');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="glass border-b border-white/10 p-4">
        <h2 className="text-2xl font-bold text-gradient">Chat</h2>
        <p className="text-sm text-purple-200">
          {dataChannel?.readyState === 'open' ? 'Connected' : 'Connecting...'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2 ${
                  message.sender === 'me'
                    ? message.type === 'love'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                      : 'bg-purple-600'
                    : 'glass'
                }`}
              >
                <p className="text-white text-sm md:text-base break-words">
                  {message.text}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  {format(message.timestamp, 'HH:mm')}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass border-t border-white/10 p-4">
        <div className="flex gap-2 items-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendLoveNote}
            className="p-2 rounded-lg bg-pink-600 hover:bg-pink-700 transition-colors"
            title="Send Love Note"
          >
            <Heart className="w-5 h-5 text-white fill-white" />
          </motion.button>

          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage(inputText);
                }
              }}
              placeholder="Type a message..."
              className="w-full bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full mb-2 left-0 glass rounded-xl p-3 grid grid-cols-8 gap-2"
              >
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      sendMessage(emoji, 'emoji');
                      setShowEmojiPicker(false);
                    }}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-lg glass hover:glass-strong transition-colors"
          >
            <Smile className="w-5 h-5 text-purple-400" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

