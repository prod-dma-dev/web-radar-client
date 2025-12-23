import { useState } from 'react';
import { useRadarStore } from '../../store/radarStore';
import type { LootColors } from '../../types';

// Color picker component
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-xs">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded cursor-pointer border border-radar-border bg-transparent"
      />
    </div>
  );
}

export function LootFilters() {
  const [showColors, setShowColors] = useState(false);

  const {
    lootFilter,
    lootColors,
    setLootEnabled,
    setLootMinValue,
    setLootMinValueImportant,
    setShowCorpses,
    setShowContainers,
    setShowMeds,
    setShowFood,
    setShowBackpacks,
    setShowQuestItems,
    setShowWishlist,
    setLootColor,
    resetLootColors,
  } = useRadarStore();

  // Format number for display (K = thousands)
  const formatK = (value: number) => {
    if (value >= 1000) return `${value / 1000}K`;
    return value.toString();
  };

  // Parse K format back to number
  const parseK = (value: string) => {
    const num = parseFloat(value.replace(/[kK]/g, ''));
    if (value.toLowerCase().includes('k')) return num * 1000;
    return num;
  };

  const toggles = [
    { label: 'Meds', checked: lootFilter.showMeds, onChange: setShowMeds },
    { label: 'Food', checked: lootFilter.showFood, onChange: setShowFood },
    { label: 'Backpacks', checked: lootFilter.showBackpacks, onChange: setShowBackpacks },
    { label: 'Quest Items', checked: lootFilter.showQuestItems, onChange: setShowQuestItems },
    { label: 'Wishlist', checked: lootFilter.showWishlist, onChange: setShowWishlist },
    { label: 'Corpses', checked: lootFilter.showCorpses, onChange: setShowCorpses },
    { label: 'Containers', checked: lootFilter.showContainers, onChange: setShowContainers },
  ];

  const colorOptions: Array<{ key: keyof LootColors; label: string }> = [
    { key: 'regular', label: 'Regular Loot' },
    { key: 'important', label: 'Important' },
    { key: 'meds', label: 'Meds' },
    { key: 'food', label: 'Food' },
    { key: 'backpack', label: 'Backpacks' },
    { key: 'questItem', label: 'Quest Items' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'corpse', label: 'Corpses' },
    { key: 'container', label: 'Containers' },
  ];

  return (
    <div className="space-y-3">
      {/* Master Enable */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lootFilter.enabled}
            onChange={(e) => setLootEnabled(e.target.checked)}
            className="w-4 h-4 rounded bg-radar-border border-radar-border accent-radar-accent cursor-pointer"
          />
          <span className="text-white text-sm font-medium">Show Loot</span>
        </label>
      </div>

      {lootFilter.enabled && (
        <>
          {/* Value Thresholds */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs w-20">Min Value</label>
              <input
                type="text"
                value={formatK(lootFilter.minValue)}
                onChange={(e) => {
                  const val = parseK(e.target.value);
                  if (!isNaN(val)) setLootMinValue(val);
                }}
                className="flex-1 px-2 py-1 text-xs bg-radar-bg border border-radar-border rounded text-white focus:outline-none focus:border-radar-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs w-20">Important</label>
              <input
                type="text"
                value={formatK(lootFilter.minValueImportant)}
                onChange={(e) => {
                  const val = parseK(e.target.value);
                  if (!isNaN(val)) setLootMinValueImportant(val);
                }}
                className="flex-1 px-2 py-1 text-xs bg-radar-bg border border-radar-border rounded text-white focus:outline-none focus:border-radar-accent"
              />
            </div>
          </div>

          {/* Category Toggles */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {toggles.map(({ label, checked, onChange }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  className="w-3 h-3 rounded bg-radar-border border-radar-border accent-radar-accent cursor-pointer"
                />
                <span className="text-gray-400 text-xs">{label}</span>
              </label>
            ))}
          </div>

          {/* Colors Section */}
          <div>
            <button
              onClick={() => setShowColors(!showColors)}
              className="flex items-center gap-2 text-gray-400 text-xs hover:text-white transition-colors"
            >
              <span>{showColors ? '▼' : '▶'}</span>
              <span>Colors</span>
            </button>

            {showColors && (
              <div className="mt-2 space-y-2 pl-4">
                {colorOptions.map(({ key, label }) => (
                  <ColorPicker
                    key={key}
                    label={label}
                    value={lootColors[key]}
                    onChange={(color) => setLootColor(key, color)}
                  />
                ))}
                <button
                  onClick={resetLootColors}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Reset to defaults
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
