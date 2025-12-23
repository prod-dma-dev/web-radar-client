import { useRadarStore } from '../../store/radarStore';

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
    <div className="space-y-3">
      {/* Zoom */}
      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm w-24">Zoom</label>
        <input
          type="range"
          min="0.2"
          max="5"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-radar-border rounded-lg appearance-none cursor-pointer accent-radar-accent"
        />
        <span className="text-gray-400 text-xs w-10 text-right">
          {zoom.toFixed(1)}x
        </span>
      </div>

      {/* Show Map */}
      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm w-24">Show Map</label>
        <input
          type="checkbox"
          checked={showMap}
          onChange={(e) => setShowMap(e.target.checked)}
          className="w-4 h-4 rounded bg-radar-border border-radar-border accent-radar-accent cursor-pointer"
        />
      </div>

      {/* Map Opacity */}
      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm w-24">Map Opacity</label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={mapOpacity}
          onChange={(e) => setMapOpacity(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-radar-border rounded-lg appearance-none cursor-pointer accent-radar-accent"
        />
        <span className="text-gray-400 text-xs w-10 text-right">
          {Math.round(mapOpacity * 100)}%
        </span>
      </div>
    </div>
  );
}
