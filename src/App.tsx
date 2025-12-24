import { useState, useEffect } from 'react';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { RadarCanvas } from './components/Radar/RadarCanvas';
import { ConnectionModal } from './components/Modal/ConnectionModal';
import { LootFilterModal } from './components/Modal/LootFilterModal';
import { useRadarStore } from './store/radarStore';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showLootFilterModal, setShowLootFilterModal] = useState(false);
  const { connection, setRelayUrl, setRoomId, sidebarCollapsed, setSidebarCollapsed } = useRadarStore();
  const { connect, disconnect } = useWebSocket();

  // Parse URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const relay = params.get('relay');
    const room = params.get('room');

    // URL params take priority - pre-fill the store and show modal
    if (relay && room) {
      setRelayUrl(relay);
      setRoomId(room);
      // Show modal with pre-filled values, user must click connect
      setShowConnectionModal(true);
    }
    // No URL params but have saved settings - auto-reconnect
    else if (connection.relayUrl && connection.roomId) {
      connect(connection.relayUrl, connection.roomId);
    }
    // No settings at all, show modal
    else {
      setShowConnectionModal(true);
    }
  }, []);

  const handleDisconnect = () => {
    disconnect();
    setShowConnectionModal(true);
  };

  return (
    <div className="h-screen flex flex-col bg-radar-bg text-white">
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main radar area */}
        <main className="flex-1 relative">
          <RadarCanvas />

          {/* Connection button overlay */}
          {connection.status === 'disconnected' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto text-radar-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  <h3 className="text-white text-xl font-semibold mb-2">Not Connected</h3>
                  <p className="text-gray-400 text-sm">Connect to your radar relay server to begin</p>
                </div>
                <button
                  onClick={() => setShowConnectionModal(true)}
                  className="px-8 py-3.5 bg-radar-accent text-white rounded-lg hover:bg-radar-accent-hover transition-all font-semibold shadow-lg shadow-radar-accent/25"
                >
                  Connect to Radar
                </button>
              </div>
            </div>
          )}

          {/* Waiting overlay */}
          {connection.status === 'waiting' && (
            <div className="absolute bottom-4 left-4 bg-radar-panel-light border border-radar-border rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-radar-warning animate-pulse" />
              <span className="text-radar-warning text-sm font-medium">Waiting for host to connect...</span>
            </div>
          )}

          {/* Disconnect button */}
          {connection.status !== 'disconnected' && (
            <button
              onClick={handleDisconnect}
              className="absolute top-4 left-4 bg-radar-panel-light border border-radar-border rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-radar-danger hover:bg-radar-danger/10 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Disconnect
            </button>
          )}
        </main>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 z-20 bg-radar-panel-light border border-radar-border rounded-l-lg px-1.5 py-4 text-gray-400 hover:text-white hover:bg-radar-accent transition-all ${
            sidebarCollapsed ? 'right-0' : 'right-80'
          }`}
          title={sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Sidebar */}
        <div
          className={`h-full transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-80 opacity-100'
          }`}
        >
          <Sidebar onOpenLootFilterModal={() => setShowLootFilterModal(true)} />
        </div>
      </div>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
      />

      {/* Loot Filter Modal */}
      <LootFilterModal
        isOpen={showLootFilterModal}
        onClose={() => setShowLootFilterModal(false)}
      />
    </div>
  );
}
