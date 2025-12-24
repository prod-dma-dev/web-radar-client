import { useState, useRef, useMemo, useEffect } from 'react';
import { useRadarStore } from '../../store/radarStore';
import type { LootColors, UserLootFilterConfig } from '../../types';

interface LootFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Tab type
type TabId = 'filters' | 'colors' | 'config';

// Toggle Switch component
function Toggle({
  checked,
  onChange,
  label,
  description,
  color,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  color?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 p-3 rounded-lg bg-radar-bg/50 hover:bg-radar-bg transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        {color && (
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/10"
            style={{ backgroundColor: color }}
          />
        )}
        <div>
          <span className="text-white text-sm font-medium group-hover:text-white transition-colors">
            {label}
          </span>
          {description && (
            <p className="text-gray-500 text-xs mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-radar-accent' : 'bg-radar-border'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

// Color picker with preview
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
    <div className="flex items-center justify-between p-3 rounded-lg bg-radar-bg/50">
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full ring-2 ring-white/10"
          style={{ backgroundColor: value }}
        />
        <span className="text-gray-300 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs font-mono">{value}</span>
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="w-8 h-8 rounded-lg border-2 border-radar-border hover:border-radar-accent transition-colors shadow-inner cursor-pointer"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>
    </div>
  );
}

// Value input with slider
function ValueInput({
  label,
  value,
  onChange,
  min = 0,
  max = 1000000,
  description,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  description?: string;
}) {
  const formatK = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${Math.floor(val / 1000)}K`;
    return val.toString();
  };

  const parseK = (str: string) => {
    const cleaned = str.replace(/[^0-9.kmKM]/g, '');
    const num = parseFloat(cleaned.replace(/[kmKM]/g, ''));
    if (isNaN(num)) return 0;
    if (cleaned.toLowerCase().includes('m')) return num * 1000000;
    if (cleaned.toLowerCase().includes('k')) return num * 1000;
    return num;
  };

  return (
    <div className="p-3 rounded-lg bg-radar-bg/50 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white text-sm font-medium">{label}</span>
          {description && (
            <p className="text-gray-500 text-xs mt-0.5">{description}</p>
          )}
        </div>
        <input
          type="text"
          value={formatK(value)}
          onChange={(e) => onChange(parseK(e.target.value))}
          className="w-24 px-3 py-1.5 text-sm text-right bg-radar-panel border border-radar-border rounded-md text-white focus:outline-none focus:border-radar-accent transition-colors"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1000}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-radar-border rounded-lg appearance-none cursor-pointer accent-radar-accent"
      />
    </div>
  );
}

// Fuzzy search scoring - matches any part of the text containing query characters
function fuzzyMatch(text: string, query: string): { match: boolean; score: number } {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match at start - highest score
  if (textLower.startsWith(queryLower)) {
    return { match: true, score: 1000 + (queryLower.length / textLower.length) * 100 };
  }

  // Contains exact substring - high score
  if (textLower.includes(queryLower)) {
    const index = textLower.indexOf(queryLower);
    const atWordBoundary = index === 0 || /\s/.test(textLower[index - 1]);
    return { match: true, score: 500 + (atWordBoundary ? 200 : 0) + (queryLower.length / textLower.length) * 50 };
  }

  // Check if text starts with query (ignoring extra chars in query) - handles "ledex" matching "ledx"
  // This catches typos where user added extra characters
  if (queryLower.length > 2) {
    // Check if removing one char from query makes it match
    for (let i = 0; i < queryLower.length; i++) {
      const queryWithoutChar = queryLower.slice(0, i) + queryLower.slice(i + 1);
      if (textLower.startsWith(queryWithoutChar) || textLower.includes(queryWithoutChar)) {
        return { match: true, score: 400 + (queryWithoutChar.length / textLower.length) * 50 };
      }
    }
  }

  // Check if query starts with text (text is abbreviation) - handles "ledx" when searching "ledex"
  if (textLower.length >= 3 && queryLower.startsWith(textLower)) {
    return { match: true, score: 350 };
  }

  // Split query into words and check if all words are present
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  if (queryWords.length > 1) {
    const allWordsPresent = queryWords.every(word => textLower.includes(word));
    if (allWordsPresent) {
      return { match: true, score: 300 + queryWords.length * 20 };
    }
  }

  // Levenshtein-like: check if text and query are very similar (edit distance)
  if (Math.abs(textLower.length - queryLower.length) <= 2 && queryLower.length >= 3) {
    let differences = 0;
    const shorter = textLower.length < queryLower.length ? textLower : queryLower;
    const longer = textLower.length < queryLower.length ? queryLower : textLower;

    let j = 0;
    for (let i = 0; i < longer.length && differences <= 2; i++) {
      if (j < shorter.length && shorter[j] === longer[i]) {
        j++;
      } else {
        differences++;
      }
    }

    if (differences <= 2 && j >= shorter.length - 1) {
      return { match: true, score: 250 - differences * 50 };
    }
  }

  // Fuzzy match - all query characters appear in order
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  let totalMatches = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
      totalMatches++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }

  if (queryIndex === queryLower.length) {
    return { match: true, score: 50 + maxConsecutive * 10 + totalMatches * 2 };
  }

  // Partial match - at least 50% of query chars found in order (lowered from 60%)
  if (queryIndex >= queryLower.length * 0.5 && queryLower.length >= 2) {
    return { match: true, score: 20 + (queryIndex / queryLower.length) * 30 };
  }

  return { match: false, score: 0 };
}

export function LootFilterModal({ isOpen, onClose }: LootFilterModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('filters');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [itemToAdd, setItemToAdd] = useState<{ id: string; name: string } | null>(null);
  const [addItemColor, setAddItemColor] = useState('#ff6b6b');
  const [addItemType, setAddItemType] = useState<0 | 1>(0); // 0 = Important, 1 = Blacklist
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lootFilterInputRef = useRef<HTMLInputElement>(null);

  const {
    itemDatabase,
    loot,
    customFilterEntries,
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
    setSearchFilter,
    setLootColor,
    resetLootColors,
    exportSettings,
    importSettings,
    importLootFilterConfig,
    clearLootFilterConfig,
    addCustomFilterEntry,
    removeCustomFilterEntry,
  } = useRadarStore();

  // Fuzzy search suggestions - uses itemDatabase, custom entries, and current loot
  const suggestions = useMemo(() => {
    if (!lootFilter.searchFilter || lootFilter.searchFilter.length < 1) {
      return [];
    }

    const query = lootFilter.searchFilter;
    const matches: Array<{ id: string; name: string; shortName: string; score: number; isCustom?: boolean }> = [];
    const seenNames = new Set<string>();

    // First, search custom filter entries (prioritize these)
    for (const [itemId, entry] of customFilterEntries.entries()) {
      const searchText = entry.comment || itemId;
      const match = fuzzyMatch(searchText, query);
      if (match.match && !seenNames.has(searchText)) {
        seenNames.add(searchText);
        matches.push({ id: itemId, name: searchText, shortName: searchText, score: match.score + 100, isCustom: true });
      }
    }

    // Use itemDatabase if available
    if (itemDatabase.length > 0) {
      for (const item of itemDatabase) {
        const nameMatch = fuzzyMatch(item.name, query);
        const shortNameMatch = fuzzyMatch(item.shortName, query);
        const bestMatch = nameMatch.score >= shortNameMatch.score ? nameMatch : shortNameMatch;

        if (bestMatch.match && !seenNames.has(item.shortName)) {
          seenNames.add(item.shortName);
          matches.push({ id: item.id, name: item.name, shortName: item.shortName, score: bestMatch.score });
        }
      }
    } else {
      // Fallback to current loot items
      for (const item of loot) {
        const nameMatch = fuzzyMatch(item.name, query);
        if (nameMatch.match && !seenNames.has(item.name)) {
          seenNames.add(item.name);
          matches.push({ id: item.id, name: item.name, shortName: item.name, score: nameMatch.score });
        }
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [itemDatabase, loot, customFilterEntries, lootFilter.searchFilter]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelectItem(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const handleSelectItem = (item: { id: string; name: string; shortName: string; isCustom?: boolean }) => {
    if (item.isCustom) {
      // Already in filter list, just set as search
      setSearchFilter(item.shortName);
    } else {
      // Select for adding
      setItemToAdd({ id: item.id, name: item.shortName });
      setSearchFilter('');
    }
    setShowDropdown(false);
  };

  const handleAddItem = () => {
    if (!itemToAdd) return;
    addCustomFilterEntry(itemToAdd.id, itemToAdd.name, addItemColor, addItemType);
    setItemToAdd(null);
    setSearchFilter('');
  };

  const handleCancelAdd = () => {
    setItemToAdd(null);
  };

  const handleExport = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'radar-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const success = importSettings(json);
      if (!success) {
        alert('Failed to import settings. Invalid file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportLootFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const config = JSON.parse(json) as UserLootFilterConfig;
        if (config.entries && Array.isArray(config.entries)) {
          importLootFilterConfig(config);
          alert(`Loaded ${config.entries.filter(e => e.enabled).length} filter entries.`);
        } else {
          alert('Invalid loot filter config format.');
        }
      } catch {
        alert('Failed to parse loot filter config.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="text-radar-accent font-semibold">{text.slice(index, index + query.length)}</span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const colorOptions: Array<{ key: keyof LootColors; label: string }> = [
    { key: 'regular', label: 'Regular Loot' },
    { key: 'important', label: 'Important / Valuable' },
    { key: 'meds', label: 'Medical Items' },
    { key: 'food', label: 'Food & Drink' },
    { key: 'backpack', label: 'Backpacks' },
    { key: 'questItem', label: 'Quest Items' },
    { key: 'wishlist', label: 'Wishlist Items' },
    { key: 'corpse', label: 'Player Corpses' },
    { key: 'container', label: 'Containers' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-radar-panel rounded-2xl shadow-2xl border border-radar-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-radar-border bg-radar-panel-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-radar-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-radar-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-white text-lg font-semibold">Loot Filters</h2>
              <p className="text-gray-500 text-sm">Customize what loot appears on your radar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-radar-border/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Master Toggle */}
        <div className="px-6 py-4 border-b border-radar-border bg-gradient-to-r from-radar-accent/10 to-transparent">
          <Toggle
            checked={lootFilter.enabled}
            onChange={setLootEnabled}
            label="Show Loot on Radar"
            description="Toggle all loot visibility on the map"
          />
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-1 border-b border-radar-border">
          {[
            { id: 'filters' as TabId, label: 'Filters', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
            { id: 'colors' as TabId, label: 'Colors', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
            { id: 'config' as TabId, label: 'Import / Export', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-radar-bg text-white border-t border-x border-radar-border -mb-px'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-radar-bg">
          {activeTab === 'filters' && (
            <div className="space-y-6">
              {/* Add Custom Item Section */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Add Item to Filter</label>

                {/* Selected Item to Add */}
                {itemToAdd ? (
                  <div className="bg-radar-panel border border-radar-accent/50 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full ring-2 ring-white/20"
                          style={{ backgroundColor: addItemColor }}
                        />
                        <span className="text-white font-medium">{itemToAdd.name}</span>
                      </div>
                      <button
                        onClick={handleCancelAdd}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Color & Type Selection */}
                    <div className="flex items-center gap-4">
                      {/* Color Picker */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Color:</span>
                        <div className="relative">
                          <input
                            type="color"
                            value={addItemColor}
                            onChange={(e) => setAddItemColor(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div
                            className="w-8 h-8 rounded-lg border-2 border-radar-border hover:border-radar-accent transition-colors cursor-pointer"
                            style={{ backgroundColor: addItemColor }}
                          />
                        </div>
                      </div>

                      {/* Type Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Type:</span>
                        <div className="flex rounded-lg overflow-hidden border border-radar-border">
                          <button
                            onClick={() => setAddItemType(0)}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                              addItemType === 0
                                ? 'bg-radar-warning/30 text-radar-warning'
                                : 'bg-radar-panel text-gray-400 hover:text-white'
                            }`}
                          >
                            Important
                          </button>
                          <button
                            onClick={() => setAddItemType(1)}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                              addItemType === 1
                                ? 'bg-gray-600/50 text-white'
                                : 'bg-radar-panel text-gray-400 hover:text-white'
                            }`}
                          >
                            Blacklist
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={handleAddItem}
                      className="w-full py-2.5 text-sm font-medium bg-radar-accent text-white rounded-lg hover:bg-radar-accent-hover transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add to Filter List
                    </button>
                  </div>
                ) : (
                  /* Search Input */
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={lootFilter.searchFilter}
                      onChange={(e) => {
                        setSearchFilter(e.target.value);
                        setShowDropdown(e.target.value.length > 0);
                      }}
                      onFocus={() => lootFilter.searchFilter && setShowDropdown(true)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search for items to add..."
                      className="w-full pl-12 pr-10 py-3 text-sm bg-radar-panel border border-radar-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-radar-accent focus:ring-2 focus:ring-radar-accent/20 transition-all"
                    />
                    {lootFilter.searchFilter && (
                      <button
                        onClick={() => {
                          setSearchFilter('');
                          setShowDropdown(false);
                        }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    {/* Dropdown */}
                    {showDropdown && suggestions.length > 0 && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-50 top-full left-0 right-0 mt-2 bg-radar-panel border border-radar-border rounded-xl shadow-2xl overflow-hidden"
                      >
                        <div className="py-2 max-h-64 overflow-y-auto">
                          {suggestions.map((item, index) => (
                            <button
                              key={item.id}
                              onClick={() => handleSelectItem(item)}
                              className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                                index === selectedIndex
                                  ? 'bg-radar-accent/20 text-white'
                                  : 'text-gray-300 hover:bg-radar-panel-light'
                              }`}
                            >
                              <span>{highlightMatch(item.shortName, lootFilter.searchFilter)}</span>
                              {item.isCustom ? (
                                <span className="text-xs text-radar-success">Already added</span>
                              ) : (
                                <span className="text-xs text-gray-500">Click to add</span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="px-4 py-2 border-t border-radar-border bg-radar-panel-light">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <kbd className="px-1.5 py-0.5 bg-radar-border rounded text-gray-400">↑↓</kbd>
                              navigate
                            </span>
                            <span className="flex items-center gap-1">
                              <kbd className="px-1.5 py-0.5 bg-radar-border rounded text-gray-400">Enter</kbd>
                              select
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  {itemDatabase.length > 0
                    ? `${itemDatabase.length} items in database`
                    : loot.length > 0
                      ? `Searching ${loot.length} items in current raid`
                      : 'Type to search items'}
                </p>
              </div>

              {/* Custom Items List */}
              {customFilterEntries.size > 0 && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Your Custom Items</label>
                  <div className="space-y-1.5">
                    {Array.from(customFilterEntries.entries()).map(([itemId, entry]) => (
                      <div
                        key={itemId}
                        className="flex items-center justify-between px-3 py-2 bg-radar-panel rounded-lg group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.color || '#888' }}
                          />
                          <span className="text-white text-sm truncate">
                            {entry.comment || itemId}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            entry.type === 0
                              ? 'bg-radar-warning/20 text-radar-warning'
                              : 'bg-gray-600/30 text-gray-400'
                          }`}>
                            {entry.type === 0 ? 'Important' : 'Blacklist'}
                          </span>
                        </div>
                        <button
                          onClick={() => removeCustomFilterEntry(itemId)}
                          className="p-1 text-gray-500 hover:text-radar-danger transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Value Thresholds */}
              <div>
                <label className="block text-white text-sm font-medium mb-3">Value Thresholds</label>
                <div className="space-y-3">
                  <ValueInput
                    label="Minimum Value"
                    description="Show items worth at least this amount"
                    value={lootFilter.minValue}
                    onChange={setLootMinValue}
                    max={500000}
                  />
                  <ValueInput
                    label="Important Value"
                    description="Highlight items worth at least this amount"
                    value={lootFilter.minValueImportant}
                    onChange={setLootMinValueImportant}
                    max={1000000}
                  />
                </div>
              </div>

              {/* Category Toggles */}
              <div>
                <label className="block text-white text-sm font-medium mb-3">Item Categories</label>
                <div className="space-y-2">
                  <Toggle
                    checked={lootFilter.showMeds}
                    onChange={setShowMeds}
                    label="Medical Items"
                    color={lootColors.meds}
                  />
                  <Toggle
                    checked={lootFilter.showFood}
                    onChange={setShowFood}
                    label="Food & Drink"
                    color={lootColors.food}
                  />
                  <Toggle
                    checked={lootFilter.showBackpacks}
                    onChange={setShowBackpacks}
                    label="Backpacks"
                    color={lootColors.backpack}
                  />
                  <Toggle
                    checked={lootFilter.showQuestItems}
                    onChange={setShowQuestItems}
                    label="Quest Items"
                    color={lootColors.questItem}
                  />
                  <Toggle
                    checked={lootFilter.showWishlist}
                    onChange={setShowWishlist}
                    label="Wishlist Items"
                    color={lootColors.wishlist}
                  />
                  <Toggle
                    checked={lootFilter.showCorpses}
                    onChange={setShowCorpses}
                    label="Player Corpses"
                    color={lootColors.corpse}
                  />
                  <Toggle
                    checked={lootFilter.showContainers}
                    onChange={setShowContainers}
                    label="Containers"
                    color={lootColors.container}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-3">Loot Colors</label>
                <div className="space-y-2">
                  {colorOptions.map(({ key, label }) => (
                    <ColorPicker
                      key={key}
                      label={label}
                      value={lootColors[key]}
                      onChange={(color) => setLootColor(key, color)}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={resetLootColors}
                className="w-full py-3 text-sm text-gray-400 border border-radar-border hover:border-radar-accent hover:text-white rounded-xl transition-all"
              >
                Reset to Default Colors
              </button>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Radar Settings Export/Import */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Radar Settings</label>
                <p className="text-gray-500 text-sm mb-4">
                  Export your filter settings to share or backup, or import settings from a file.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-radar-accent/20 text-radar-accent border border-radar-accent/30 rounded-xl hover:bg-radar-accent/30 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Settings
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-radar-panel-light text-gray-300 border border-radar-border rounded-xl hover:bg-radar-border hover:text-white transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import Settings
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Loot Filter Config */}
              <div className="pt-6 border-t border-radar-border">
                <label className="block text-white text-sm font-medium mb-2">Loot Filter Config</label>
                <p className="text-gray-500 text-sm mb-4">
                  Import your loot filter config file to automatically mark items as important or blacklisted.
                  This uses the same format as the desktop radar app.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => lootFilterInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-radar-success/20 text-radar-success border border-radar-success/30 rounded-xl hover:bg-radar-success/30 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Load Filter Config
                  </button>
                  {customFilterEntries.size > 0 && (
                    <button
                      onClick={clearLootFilterConfig}
                      className="px-6 py-3 text-sm font-medium text-gray-400 border border-radar-border rounded-xl hover:bg-radar-danger/20 hover:text-radar-danger hover:border-radar-danger/30 transition-all"
                    >
                      Clear
                    </button>
                  )}
                  <input
                    ref={lootFilterInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportLootFilter}
                    className="hidden"
                  />
                </div>
                {customFilterEntries.size > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-radar-success">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">{customFilterEntries.size} filter entries loaded</span>
                      </div>
                    </div>

                    {/* Custom Filter Entries List */}
                    <div className="bg-radar-bg/50 border border-radar-border rounded-xl overflow-hidden">
                      <div className="px-4 py-2 bg-radar-panel-light border-b border-radar-border flex items-center gap-4 text-xs text-gray-400 uppercase tracking-wider">
                        <span className="flex-1">Item</span>
                        <span className="w-20 text-center">Type</span>
                        <span className="w-12 text-center">Color</span>
                        <span className="w-10"></span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {Array.from(customFilterEntries.entries()).map(([itemId, entry]) => (
                          <div
                            key={itemId}
                            className="px-4 py-2.5 border-b border-radar-border/50 last:border-b-0 flex items-center gap-4 hover:bg-radar-panel-light/50 transition-colors group"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-white text-sm truncate block">
                                {entry.comment || itemId}
                              </span>
                              {entry.comment && (
                                <span className="text-gray-500 text-xs font-mono truncate block">
                                  {itemId.length > 20 ? itemId.slice(0, 20) + '...' : itemId}
                                </span>
                              )}
                            </div>
                            <span className={`w-20 text-center text-xs font-medium px-2 py-1 rounded ${
                              entry.type === 0
                                ? 'bg-radar-warning/20 text-radar-warning'
                                : 'bg-gray-600/30 text-gray-400'
                            }`}>
                              {entry.type === 0 ? 'Important' : 'Blacklist'}
                            </span>
                            <div className="w-12 flex justify-center">
                              {entry.color ? (
                                <div
                                  className="w-5 h-5 rounded-md border border-white/20"
                                  style={{ backgroundColor: entry.color }}
                                  title={entry.color}
                                />
                              ) : (
                                <span className="text-gray-500 text-xs">—</span>
                              )}
                            </div>
                            <button
                              onClick={() => removeCustomFilterEntry(itemId)}
                              className="w-10 flex justify-center text-gray-500 hover:text-radar-danger transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove item"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
