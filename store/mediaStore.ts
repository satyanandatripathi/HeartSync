import { create } from 'zustand';

interface MediaState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  localStream: null,
  remoteStream: null,
  isVideoEnabled: true,
  isAudioEnabled: true,
  setLocalStream: (stream: MediaStream | null) => set({ localStream: stream }),
  setRemoteStream: (stream: MediaStream | null) => set({ remoteStream: stream }),
  toggleVideo: () => {
    const { localStream, isVideoEnabled } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
    set({ isVideoEnabled: !isVideoEnabled });
  },
  toggleAudio: () => {
    const { localStream, isAudioEnabled } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
    }
    set({ isAudioEnabled: !isAudioEnabled });
  },
}));

