import { useState, useEffect } from 'react';
import { useRadarStore } from '../../store/radarStore';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionModal({ isOpen, onClose }: Props) {
  const { connection, setRelayUrl, setRoomId } = useRadarStore();
  const { connect } = useWebSocket();

  const [relayUrl, setLocalRelayUrl] = useState(connection.relayUrl);
  const [roomId, setLocalRoomId] = useState(connection.roomId);

  // Sync local state with store when modal opens (for URL param pre-fill)
  useEffect(() => {
    if (isOpen) {
      setLocalRelayUrl(connection.relayUrl);
      setLocalRoomId(connection.roomId);
    }
  }, [isOpen, connection.relayUrl, connection.roomId]);

  if (!isOpen) return null;

  const handleConnect = () => {
    setRelayUrl(relayUrl);
    setRoomId(roomId);
    connect(relayUrl, roomId);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConnect();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-start z-50 pl-12 bg-black overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={`${import.meta.env.BASE_URL}bg-video.mp4`} type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />

      <div className="relative bg-radar-panel/95 backdrop-blur-md border border-radar-border rounded-xl shadow-2xl shadow-black/50 w-full max-w-xl">
        <div className="p-10">
          {/* Branding */}
          <div className="flex justify-center mb-8">
            <img
              src={`${import.meta.env.BASE_URL}modal_branding.jpeg`}
              alt="prods-gamesense"
              className="h-28 rounded-xl shadow-lg"
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-white text-2xl font-bold mb-2">Connect to Radar</h2>
            <p className="text-gray-400 text-sm">Enter your relay server details to connect</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Relay URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={relayUrl}
                  onChange={(e) => setLocalRelayUrl(e.target.value)}
                  placeholder="wss://your-relay-server.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-radar-bg border border-radar-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-radar-accent focus:ring-1 focus:ring-radar-accent/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Room ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setLocalRoomId(e.target.value)}
                  placeholder="Enter room ID from the radar app"
                  className="w-full pl-12 pr-4 py-3.5 bg-radar-bg border border-radar-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-radar-accent focus:ring-1 focus:ring-radar-accent/50 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 bg-radar-border text-gray-300 rounded-lg hover:bg-radar-border-light hover:text-white transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!relayUrl || !roomId}
                className="flex-1 px-6 py-3.5 bg-radar-accent text-white rounded-lg hover:bg-radar-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-radar-accent/25"
              >
                Connect
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
