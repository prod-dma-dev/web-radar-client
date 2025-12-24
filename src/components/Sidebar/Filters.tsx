import { useRadarStore } from '../../store/radarStore';

// Toggle Switch component
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group py-1.5">
      <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`toggle-switch ${checked ? 'toggle-switch-checked' : 'toggle-switch-unchecked'}`}
      >
        <span className={`toggle-switch-dot ${checked ? 'toggle-switch-dot-checked' : 'toggle-switch-dot-unchecked'}`} />
      </button>
    </label>
  );
}

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
    { label: 'Show Dead Players', checked: showDeadPlayers, onChange: setShowDeadPlayers },
    { label: 'Player Names', checked: showPlayerNames, onChange: setShowPlayerNames },
    { label: 'Aim Lines', checked: showAimlines, onChange: setShowAimlines },
    { label: 'Height Difference', checked: showHeightDiff, onChange: setShowHeightDiff },
  ];

  return (
    <div className="bg-radar-panel-light rounded-lg p-3 space-y-0.5">
      {filters.map(({ label, checked, onChange }) => (
        <Toggle
          key={label}
          label={label}
          checked={checked}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
