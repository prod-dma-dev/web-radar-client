import { useState } from 'react';
import { useRadarStore } from '../../store/radarStore';
import clsx from 'clsx';

export function Header() {
  const { connection, povPlayerName, setPovPlayerName, players } = useRadarStore();
  const [povInput, setPovInput] = useState('');

  const statusText = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    waiting: 'Waiting for host',
    connected: 'Connected',
  }[connection.status];

  const statusColor = {
    disconnected: 'bg-red-500',
    connecting: 'bg-yellow-500',
    waiting: 'bg-yellow-500',
    connected: 'bg-green-500',
  }[connection.status];

  const handleSwitchPov = () => {
    const trimmed = povInput.trim();
    if (!trimmed) {
      // Empty input = reset to local player
      setPovPlayerName(null);
      return;
    }
    // Find player by name (case-insensitive partial match)
    const found = players.find(p =>
      p.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (found) {
      setPovPlayerName(found.name);
    } else {
      alert(`Player "${trimmed}" not found`);
    }
  };

  const handleResetPov = () => {
    setPovPlayerName(null);
    setPovInput('');
  };

  return (
    <header className="h-12 bg-radar-panel border-b border-radar-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <img src="/modal_branding.jpeg" alt="prods-gamesense" className="h-8 rounded" />
        <h1 className="text-radar-accent font-bold text-lg">prods-gamesense</h1>
      </div>

      {/* POV Switching */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">POV:</span>
        <input
          type="text"
          value={povInput}
          onChange={(e) => setPovInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSwitchPov()}
          placeholder={povPlayerName || 'Local Player'}
          className="w-32 px-2 py-1 text-sm bg-radar-bg border border-radar-border rounded text-white placeholder-gray-500 focus:outline-none focus:border-radar-accent"
        />
        <button
          onClick={handleSwitchPov}
          className="px-2 py-1 text-sm bg-radar-accent text-white rounded hover:bg-blue-600 transition-colors"
        >
          Switch
        </button>
        {povPlayerName && (
          <button
            onClick={handleResetPov}
            className="px-2 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className={clsx('w-2 h-2 rounded-full', statusColor, {
          'animate-pulse': connection.status === 'connecting' || connection.status === 'waiting',
        })} />
        <span className="text-gray-400">{statusText}</span>
      </div>
    </header>
  );
}
