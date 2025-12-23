import { useRadarStore } from '../../store/radarStore';
import { getPlayerColor, getPlayerTypeName, PlayerType } from '../../types';
import clsx from 'clsx';

export function PlayerList() {
  const { players, selectedPlayerId, setSelectedPlayer, showBots, showDeadPlayers } = useRadarStore();

  // Filter and sort players
  const filteredPlayers = players
    .filter(player => {
      if (!showBots && player.type === PlayerType.Bot) return false;
      if (!showDeadPlayers && !player.isAlive) return false;
      return true;
    })
    .sort((a, b) => {
      // Local player first
      if (a.type === PlayerType.LocalPlayer) return -1;
      if (b.type === PlayerType.LocalPlayer) return 1;
      // Teammates second
      if (a.type === PlayerType.Teammate && b.type !== PlayerType.Teammate) return -1;
      if (b.type === PlayerType.Teammate && a.type !== PlayerType.Teammate) return 1;
      // Then by type
      return a.type - b.type;
    });

  if (filteredPlayers.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        No players to display
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredPlayers.map((player, index) => {
        const color = getPlayerColor(player);
        const isSelected = player.name === selectedPlayerId;
        const isLocal = player.type === PlayerType.LocalPlayer;

        return (
          <button
            key={`${player.name}-${index}`}
            onClick={() => setSelectedPlayer(isSelected ? null : player.name)}
            className={clsx(
              'w-full text-left p-2 rounded transition-colors',
              'hover:bg-white/5',
              isSelected && 'bg-white/10',
              !player.isAlive && 'opacity-50'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm truncate">
                    {player.name}
                  </span>
                  {isLocal && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded uppercase">
                      POV
                    </span>
                  )}
                  {!player.isAlive && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded uppercase">
                      Dead
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {getPlayerTypeName(player.type)}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
