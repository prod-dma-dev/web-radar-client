import { useState } from 'react';
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
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative bg-radar-panel/90 backdrop-blur-sm border border-radar-border rounded-lg shadow-2xl w-full max-w-xl">
        <div className="p-10">
          {/* Branding */}
          <div className="flex justify-center mb-8">
            <img src="/modal_branding.jpeg" alt="prods-gamesense" className="h-32 rounded-lg" />
          </div>

          <h2 className="text-white text-2xl font-semibold mb-8 text-center">Connect to Radar</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Relay URL</label>
              <input
                type="text"
                value={relayUrl}
                onChange={(e) => setLocalRelayUrl(e.target.value)}
                placeholder="wss://your-relay-server.com"
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-radar-accent text-lg"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Room ID</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setLocalRoomId(e.target.value)}
                placeholder="Enter room ID from the radar app"
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-radar-accent text-lg"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-radar-border text-gray-300 rounded-lg hover:bg-opacity-80 transition-colors text-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!relayUrl || !roomId}
                className="flex-1 px-6 py-3 bg-radar-accent text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
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
