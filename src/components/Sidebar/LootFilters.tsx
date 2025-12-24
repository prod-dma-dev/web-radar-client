import { useRadarStore } from '../../store/radarStore';

interface LootFiltersProps {
  onOpenModal: () => void;
}

interface CategoryToggle {
  key: string;
  label: string;
  shortLabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color: string;
}

export function LootFilters({ onOpenModal }: LootFiltersProps) {
  const {
    lootFilter,
    lootColors,
    loot,
    customFilterEntries,
    setLootEnabled,
    setShowMeds,
    setShowFood,
    setShowBackpacks,
    setShowQuestItems,
    setShowWishlist,
    setShowCorpses,
    setShowContainers,
  } = useRadarStore();

  const formatK = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${Math.floor(value / 1000)}K`;
    return value.toString();
  };

  // Define all category toggles
  const categories: CategoryToggle[] = [
    { key: 'meds', label: 'Medical', shortLabel: 'Meds', checked: lootFilter.showMeds, onChange: setShowMeds, color: lootColors.meds },
    { key: 'food', label: 'Food & Drink', shortLabel: 'Food', checked: lootFilter.showFood, onChange: setShowFood, color: lootColors.food },
    { key: 'backpacks', label: 'Backpacks', shortLabel: 'Bags', checked: lootFilter.showBackpacks, onChange: setShowBackpacks, color: lootColors.backpack },
    { key: 'quest', label: 'Quest Items', shortLabel: 'Quest', checked: lootFilter.showQuestItems, onChange: setShowQuestItems, color: lootColors.questItem },
    { key: 'wishlist', label: 'Wishlist', shortLabel: 'Wishlist', checked: lootFilter.showWishlist, onChange: setShowWishlist, color: lootColors.wishlist },
    { key: 'corpses', label: 'Corpses', shortLabel: 'Corpses', checked: lootFilter.showCorpses, onChange: setShowCorpses, color: lootColors.corpse },
    { key: 'containers', label: 'Containers', shortLabel: 'Containers', checked: lootFilter.showContainers, onChange: setShowContainers, color: lootColors.container },
  ];

  return (
    <div className="space-y-3">
      {/* Master Toggle + Open Button */}
      <div className="bg-radar-panel-light rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLootEnabled(!lootFilter.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                lootFilter.enabled ? 'bg-radar-accent' : 'bg-radar-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                  lootFilter.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-white text-sm font-medium">
              {lootFilter.enabled ? 'Loot Visible' : 'Loot Hidden'}
            </span>
          </div>
          <button
            onClick={onOpenModal}
            className="p-2 text-gray-400 hover:text-white hover:bg-radar-bg rounded-lg transition-colors"
            title="Open Loot Filter Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {lootFilter.enabled && (
        <>
          {/* Quick Summary */}
          <div className="bg-radar-panel-light rounded-lg p-3 space-y-2">
            {/* Value Thresholds */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Min Value</span>
              <span className="text-white font-medium">{formatK(lootFilter.minValue)}+</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Important</span>
              <span className="text-radar-warning font-medium">{formatK(lootFilter.minValueImportant)}+</span>
            </div>

            {/* Search Filter Status */}
            {lootFilter.searchFilter && (
              <div className="flex items-center justify-between text-sm pt-1 border-t border-radar-border/50">
                <span className="text-gray-400">Search</span>
                <span className="text-radar-accent font-medium truncate ml-2">{lootFilter.searchFilter}</span>
              </div>
            )}

            {/* Loot Filter Config Status */}
            {customFilterEntries.size > 0 && (
              <div className="flex items-center justify-between text-sm pt-1 border-t border-radar-border/50">
                <span className="text-gray-400">Config Entries</span>
                <span className="text-radar-success font-medium">{customFilterEntries.size}</span>
              </div>
            )}
          </div>

          {/* Toggleable Categories */}
          <div className="bg-radar-panel-light rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Categories (click to toggle)</div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => cat.onChange(!cat.checked)}
                  title={`${cat.checked ? 'Hide' : 'Show'} ${cat.label}`}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    cat.checked
                      ? 'text-white/90 hover:opacity-80'
                      : 'bg-radar-bg/50 text-gray-500 hover:text-gray-300 border border-radar-border/50'
                  }`}
                  style={cat.checked ? {
                    backgroundColor: cat.color + '40',
                    borderWidth: 1,
                    borderColor: cat.color,
                  } : undefined}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${cat.checked ? '' : 'opacity-40'}`}
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Showing count */}
          <div className="text-center text-xs text-gray-500">
            Showing <span className="text-radar-success font-medium">{loot.length}</span> items on radar
          </div>

          {/* Full Settings Button */}
          <button
            onClick={onOpenModal}
            className="w-full py-2.5 text-sm font-medium text-white bg-radar-accent/20 border border-radar-accent/30 rounded-lg hover:bg-radar-accent/30 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Advanced Filter Settings
          </button>
        </>
      )}
    </div>
  );
}
