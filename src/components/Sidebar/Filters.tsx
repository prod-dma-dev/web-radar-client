import { useRadarStore } from '../../store/radarStore';

export function Filters() {
  const {
    showBots,
    setShowBots,
    showDeadPlayers,
    setShowDeadPlayers,
    showPlayerNames,
    setShowPlayerNames,
    showAimlines,
    setShowAimlines,
    showHeightDiff,
    setShowHeightDiff,
  } = useRadarStore();

  const filters = [
    { label: 'Show AI/Bots', checked: showBots, onChange: setShowBots },
    { label: 'Show Dead', checked: showDeadPlayers, onChange: setShowDeadPlayers },
    { label: 'Player Names', checked: showPlayerNames, onChange: setShowPlayerNames },
    { label: 'Aim Lines', checked: showAimlines, onChange: setShowAimlines },
    { label: 'Height Diff', checked: showHeightDiff, onChange: setShowHeightDiff },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {filters.map(({ label, checked, onChange }) => (
        <label key={label} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded bg-radar-border border-radar-border accent-radar-accent cursor-pointer"
          />
          <span className="text-gray-400 text-xs">{label}</span>
        </label>
      ))}
    </div>
  );
}
