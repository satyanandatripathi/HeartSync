import { create } from 'zustand';
import { useConnectionStore } from './connectionStore';
import { useMediaStore } from './mediaStore';

interface WebRTCState {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  isCallActive: boolean;
  initializePeerConnection: () => void;
  createOffer: () => Promise<void>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<void>;
  setRemoteDescription: (description: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  endCall: () => void;
}

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTCStore = create<WebRTCState>((set, get) => ({
  peerConnection: null,
  dataChannel: null,
  isCallActive: false,
  initializePeerConnection: () => {
    const pc = new RTCPeerConnection(iceServers);
    const { localStream } = useMediaStore.getState();

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      useMediaStore.getState().setRemoteStream(remoteStream);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = useConnectionStore.getState().socket;
        if (socket) {
          socket.emit('ice-candidate', event.candidate);
        }
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        set({ isCallActive: true });
      } else if (state === 'disconnected' || state === 'failed') {
        set({ isCallActive: false });
      }
    };

    // Handle incoming data channel
    pc.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onopen = () => {
        console.log('Data channel opened (received)');
        set({ dataChannel: channel });
      };
      channel.onerror = (error) => {
        console.error('Data channel error:', error);
      };
      channel.onclose = () => {
        console.log('Data channel closed');
        set({ dataChannel: null });
      };
    };

    // Create data channel for chat and file sharing
    const dataChannel = pc.createDataChannel('messages', {
      ordered: true,
    });

    dataChannel.onopen = () => {
      console.log('Data channel opened (created)');
      set({ dataChannel });
    };

    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };

    dataChannel.onclose = () => {
      console.log('Data channel closed');
      set({ dataChannel: null });
    };

    set({ peerConnection: pc, dataChannel });
  },
  createOffer: async () => {
    const { peerConnection } = get();
    if (!peerConnection) return;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const socket = useConnectionStore.getState().socket;
      if (socket) {
        socket.emit('offer', offer);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  },
  createAnswer: async (offer: RTCSessionDescriptionInit) => {
    const { peerConnection } = get();
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const socket = useConnectionStore.getState().socket;
      if (socket) {
        socket.emit('answer', answer);
      }
    } catch (error) {
      console.error('Error creating answer:', error);
    }
  },
  setRemoteDescription: async (description: RTCSessionDescriptionInit) => {
    const { peerConnection } = get();
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(description);
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  },
  addIceCandidate: async (candidate: RTCIceCandidateInit) => {
    const { peerConnection } = get();
    if (!peerConnection) return;

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  },
  endCall: () => {
    const { peerConnection, dataChannel } = get();
    if (peerConnection) {
      peerConnection.close();
    }
    if (dataChannel) {
      dataChannel.close();
    }
    set({ peerConnection: null, dataChannel: null, isCallActive: false });
    useMediaStore.getState().setRemoteStream(null);
  },
}));

