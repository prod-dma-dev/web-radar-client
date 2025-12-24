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

export function Controls() {
  const {
    zoom,
    setZoom,
    showMap,
    setShowMap,
    mapOpacity,
    setMapOpacity,
  } = useRadarStore();

  return (
    <div className="space-y-4">
      {/* Show Map Toggle */}
      <div className="bg-radar-panel-light rounded-lg p-3">
        <Toggle
          checked={showMap}
          onChange={setShowMap}
          label="Show Map Background"
        />
      </div>

      {/* Sliders */}
      <div className="bg-radar-panel-light rounded-lg p-4 space-y-5">
        {/* Zoom */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 text-sm">Zoom Level</label>
            <span className="text-radar-accent text-sm font-medium tabular-nums">
              {zoom.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="5"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.2x</span>
            <span>5x</span>
          </div>
        </div>

        {/* Map Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 text-sm">Map Opacity</label>
            <span className="text-radar-accent text-sm font-medium tabular-nums">
              {Math.round(mapOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={mapOpacity}
            onChange={(e) => setMapOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
