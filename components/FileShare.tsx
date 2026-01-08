'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, Image, Video, FileText, Download, X, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useWebRTCStore } from '@/store/webrtcStore';
import { format } from 'date-fns';

interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer | string;
  sender: 'me' | 'partner';
  timestamp: Date;
  status: 'uploading' | 'completed' | 'error';
}

const CHUNK_SIZE = 16 * 1024; // 16KB chunks

export default function FileShare() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const { dataChannel } = useWebRTCStore();
  const fileChunksRef = useRef<Map<string, { chunks: Uint8Array[], totalSize: number, received: number }>>(new Map());

  useEffect(() => {
    if (!dataChannel) return;

    dataChannel.onmessage = async (event) => {
      try {
        if (event.data instanceof ArrayBuffer) {
          // Handle binary file data
          await handleFileChunk(event.data);
        } else {
          const data = JSON.parse(event.data);
          if (data.type === 'file-metadata') {
            handleFileMetadata(data);
          } else if (data.type === 'file-chunk') {
            await handleFileChunk(data.chunk);
          }
        }
      } catch (error) {
        console.error('Error handling file data:', error);
      }
    };
  }, [dataChannel]);

  const handleFileMetadata = (metadata: any) => {
    const file: SharedFile = {
      id: metadata.id,
      name: metadata.name,
      size: metadata.size,
      type: metadata.fileType || metadata.type,
      data: '',
      sender: 'partner',
      timestamp: new Date(),
      status: 'uploading',
    };
    setFiles(prev => [...prev, file]);
    fileChunksRef.current.set(metadata.id, {
      chunks: [],
      totalSize: metadata.size,
      received: 0,
    });
  };

  const handleFileChunk = async (chunk: ArrayBuffer | string) => {
    // Implementation for receiving file chunks
    // This would need to be more sophisticated in production
  };

  const sendFile = async (file: File) => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      alert('Connection not ready');
      return;
    }

    const fileId = Date.now().toString();
    const sharedFile: SharedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      data: '',
      sender: 'me',
      timestamp: new Date(),
      status: 'uploading',
    };

    setFiles(prev => [...prev, sharedFile]);

    try {
      // Send metadata
      dataChannel.send(JSON.stringify({
        type: 'file-metadata',
        id: fileId,
        name: file.name,
        size: file.size,
        fileType: file.type,
      }));

      // Read and send file in chunks
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const totalChunks = Math.ceil(arrayBuffer.byteLength / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, arrayBuffer.byteLength);
          const chunk = arrayBuffer.slice(start, end);

          // Send chunk info
          dataChannel.send(JSON.stringify({
            type: 'file-chunk',
            id: fileId,
            chunkIndex: i,
            totalChunks,
            isLast: i === totalChunks - 1,
          }));

          // Send chunk data
          dataChannel.send(chunk);

          // Small delay to prevent overwhelming the channel
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        setFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, status: 'completed' } : f)
        );
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error sending file:', error);
      setFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'error' } : f)
      );
    }
  };

  const downloadFile = (file: SharedFile) => {
    if (file.sender === 'me' || !file.data) return;

    const blob = new Blob([file.data as ArrayBuffer], { type: file.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('text/') || type.includes('pdf') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach(sendFile);
    },
    noClick: false,
  });

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="glass border-b border-white/10 p-4">
        <h2 className="text-2xl font-bold text-gradient">Share Files</h2>
        <p className="text-sm text-purple-200">Send photos, videos, and documents securely</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Upload Area */}
        <div {...getRootProps()}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`glass rounded-2xl p-12 mb-6 cursor-pointer border-2 border-dashed transition-all ${
              isDragActive
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-purple-500/30 hover:border-purple-500/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-purple-200 text-sm">
                or click to select files
              </p>
            </div>
          </motion.div>
        </div>

        {/* Files List */}
        <div className="space-y-3">
          <AnimatePresence>
            {files.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`glass rounded-xl p-4 flex items-center gap-4 ${
                    file.sender === 'me' ? 'bg-purple-600/20' : 'bg-pink-600/20'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${
                    file.type.startsWith('image/') ? 'bg-pink-500/20' :
                    file.type.startsWith('video/') ? 'bg-purple-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    <Icon className="w-6 h-6 text-purple-300" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-sm text-purple-200">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{format(file.timestamp, 'HH:mm')}</span>
                      {file.status === 'uploading' && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-400">Uploading...</span>
                        </>
                      )}
                      {file.status === 'completed' && (
                        <>
                          <span>•</span>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </>
                      )}
                    </div>
                  </div>

                  {file.sender === 'partner' && file.status === 'completed' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => downloadFile(file)}
                      className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {files.length === 0 && (
            <div className="text-center py-12 text-purple-200">
              <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No files shared yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

