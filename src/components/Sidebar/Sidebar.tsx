import { useRadarStore } from '../../store/radarStore';
import { getMapName } from '../../config/maps';
import { Controls } from './Controls';
import { Filters } from './Filters';
import { LootFilters } from './LootFilters';
import { PlayerType } from '../../types';

export function Sidebar() {
  const { mapId, players, loot, inGame, lootFilter } = useRadarStore();

  const localPlayer = players.find(p => p.type === PlayerType.LocalPlayer);
  const playerCount = players.filter(p => p.isAlive).length;
  const lootCount = lootFilter.enabled ? loot.length : 0;

  return (
    <aside className="w-80 bg-radar-panel border-l border-radar-border flex flex-col overflow-hidden">
      {/* Status Section */}
      <div className="p-4 border-b border-radar-border">
        <h2 className="text-radar-accent text-xs font-semibold uppercase tracking-wider mb-3">
          Status
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Map</span>
            <span className="text-white">{inGame ? getMapName(mapId) : 'Not in raid'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">POV</span>
            <span className="text-blue-400">{localPlayer?.name ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Players</span>
            <span className="text-white">{playerCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Loot</span>
            <span className="text-white">{lootCount}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Player Filters */}
        <div className="p-4">
          <h2 className="text-radar-accent text-xs font-semibold uppercase tracking-wider mb-3">
            Player Filters
          </h2>
          <Filters />
        </div>

        {/* Loot Filters */}
        <div className="border-t border-radar-border p-4">
          <h2 className="text-radar-accent text-xs font-semibold uppercase tracking-wider mb-3">
            Loot
          </h2>
          <LootFilters />
        </div>

        {/* Controls */}
        <div className="border-t border-radar-border p-4">
          <h2 className="text-radar-accent text-xs font-semibold uppercase tracking-wider mb-3">
            Controls
          </h2>
          <Controls />
        </div>
      </div>
    </aside>
  );
}
