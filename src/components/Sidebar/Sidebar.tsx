import { useState } from 'react';
import { useRadarStore } from '../../store/radarStore';
import { getMapName } from '../../config/maps';
import { Controls } from './Controls';
import { Filters } from './Filters';
import { LootFilters } from './LootFilters';
import { PlayerType } from '../../types';

function StatusItem({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`text-sm font-medium ${valueColor || 'text-white'}`}>{value}</span>
    </div>
  );
}

interface SidebarProps {
  onOpenLootFilterModal: () => void;
}

export function Sidebar({ onOpenLootFilterModal }: SidebarProps) {
  const { mapId, players, loot, inGame, lootFilter, povPlayerName, setPovPlayerName } = useRadarStore();
  const [povInput, setPovInput] = useState('');

  const localPlayer = players.find(p => p.type === PlayerType.LocalPlayer);
  const teammates = players.filter(p => p.type === PlayerType.Teammate);
  const playerCount = players.filter(p => p.isAlive).length;
  const lootCount = lootFilter.enabled ? loot.length : 0;

  const handleSwitchPov = () => {
    const trimmed = povInput.trim();
    if (!trimmed) {
      setPovPlayerName(null);
      return;
    }
    const found = players.find(p =>
      p.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (found) {
      setPovPlayerName(found.name);
      setPovInput('');
    } else {
      alert(`Player "${trimmed}" not found`);
    }
  };

  const handleResetPov = () => {
    setPovPlayerName(null);
    setPovInput('');
  };

  return (
    <aside className="w-80 h-full bg-radar-panel border-l border-radar-border flex flex-col overflow-hidden">
      {/* POV Switcher */}
      <div className="p-4 border-b border-radar-border">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-radar-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h2 className="text-white text-sm font-semibold">POV Switcher</h2>
        </div>
        <div className="bg-radar-panel-light rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Current:</span>
            <span className="text-radar-accent font-medium">{povPlayerName || localPlayer?.name || 'Local Player'}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={povInput}
              onChange={(e) => setPovInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSwitchPov()}
              placeholder="Enter player name..."
              className="flex-1 px-3 py-2 text-sm bg-radar-bg border border-radar-border rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-radar-accent transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSwitchPov}
              className="flex-1 px-3 py-2 text-xs font-medium bg-radar-accent text-white rounded-md hover:bg-radar-accent-hover transition-colors"
            >
              Switch POV
            </button>
            {povPlayerName && (
              <button
                onClick={handleResetPov}
                className="px-3 py-2 text-xs font-medium bg-radar-border text-gray-300 rounded-md hover:bg-radar-border-light hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Quick Switch Buttons */}
          {(localPlayer || teammates.length > 0) && (
            <div className="pt-2 border-t border-radar-border/50 mt-2">
              <div className="text-xs text-gray-500 mb-2">Quick Switch</div>
              <div className="flex flex-wrap gap-1.5">
                {/* You (Local Player) button */}
                {localPlayer && (
                  <button
                    onClick={() => setPovPlayerName(null)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                      !povPlayerName
                        ? 'bg-radar-success text-white ring-1 ring-radar-success/50'
                        : 'bg-radar-success/20 text-radar-success hover:bg-radar-success/30 border border-radar-success/30'
                    }`}
                    title="Switch to your POV"
                  >
                    You
                  </button>
                )}
                {/* Teammate buttons */}
                {teammates.map(teammate => (
                  <button
                    key={teammate.name}
                    onClick={() => setPovPlayerName(teammate.name)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                      povPlayerName === teammate.name
                        ? 'bg-radar-success text-white ring-1 ring-radar-success/50'
                        : teammate.isAlive
                          ? 'bg-radar-success/20 text-radar-success hover:bg-radar-success/30 border border-radar-success/30'
                          : 'bg-gray-700/50 text-gray-500 border border-gray-600/30'
                    }`}
                    title={teammate.isAlive ? 'Click to switch POV' : 'Dead'}
                  >
                    {teammate.name}
                    {!teammate.isAlive && <span className="ml-1 opacity-60">†</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Section */}
      <div className="p-4 border-b border-radar-border">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${inGame ? 'bg-radar-success' : 'bg-radar-muted'}`} />
          <h2 className="text-white text-sm font-semibold">
            {inGame ? 'In Raid' : 'Not in Raid'}
          </h2>
        </div>
        <div className="bg-radar-panel-light rounded-lg p-3 space-y-0.5">
          <StatusItem label="Map" value={inGame ? getMapName(mapId) : '-'} />
          <StatusItem label="Players" value={playerCount} valueColor="text-radar-warning" />
          <StatusItem label="Loot Items" value={lootCount} valueColor="text-radar-success" />
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Player Filters */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-radar-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-white text-sm font-semibold">Player Filters</h2>
          </div>
          <Filters />
        </div>

        {/* Loot Filters */}
        <div className="border-t border-radar-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-radar-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="text-white text-sm font-semibold">Loot</h2>
          </div>
          <LootFilters onOpenModal={onOpenLootFilterModal} />
        </div>

        {/* Controls */}
        <div className="border-t border-radar-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-radar-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <h2 className="text-white text-sm font-semibold">Map Controls</h2>
          </div>
          <Controls />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-radar-border">
        <p className="text-center text-gray-600 text-xs">
          prods-gamesense v2.0
        </p>
      </div>
    </aside>
  );
}
