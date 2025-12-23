import { useState, useEffect } from 'react';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { RadarCanvas } from './components/Radar/RadarCanvas';
import { ConnectionModal } from './components/Modal/ConnectionModal';
import { useRadarStore } from './store/radarStore';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { connection, setRelayUrl, setRoomId } = useRadarStore();
  const { connect, disconnect } = useWebSocket();

  // Parse URL parameters on mount, or use saved settings
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const relay = params.get('relay');
    const room = params.get('room');

    // URL params take priority
    if (relay && room) {
      setRelayUrl(relay);
      setRoomId(room);
      connect(relay, room);
    }
    // Otherwise use saved settings if available
    else if (connection.relayUrl && connection.roomId) {
      connect(connection.relayUrl, connection.roomId);
    }
    // No settings, show modal
    else {
      setShowConnectionModal(true);
    }
  }, []);

  const handleHeaderClick = () => {
    if (connection.status === 'disconnected') {
      setShowConnectionModal(true);
    } else {
      disconnect();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-radar-bg text-white">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Main radar area */}
        <main className="flex-1 relative">
          <RadarCanvas />

          {/* Connection button overlay */}
          {connection.status === 'disconnected' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <button
                onClick={() => setShowConnectionModal(true)}
                className="px-6 py-3 bg-radar-accent text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                Connect to Radar
              </button>
            </div>
          )}

          {/* Waiting overlay */}
          {connection.status === 'waiting' && (
            <div className="absolute bottom-4 left-4 bg-radar-panel border border-radar-border rounded-lg px-4 py-2 text-sm text-yellow-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Waiting for host to connect...
            </div>
          )}

          {/* Connection status button */}
          {connection.status !== 'disconnected' && (
            <button
              onClick={handleHeaderClick}
              className="absolute top-4 left-4 bg-radar-panel border border-radar-border rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Disconnect
            </button>
          )}
        </main>

        {/* Sidebar */}
        <Sidebar />
      </div>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
      />
    </div>
  );
}
