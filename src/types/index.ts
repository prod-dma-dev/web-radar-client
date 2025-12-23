export enum PlayerType {
  Bot = 0,
  LocalPlayer = 1,
  Teammate = 2,
  PMC = 3,
  PlayerScav = 4,
}

// Loot types
export enum LootType {
  Regular = 0,
  Corpse = 1,
  Container = 2,
}

export interface LootItem {
  id: string;           // BSG ID
  name: string;         // Short name for display
  position: { x: number; y: number; z: number };
  price: number;        // Value in roubles
  type: LootType;       // Regular, Corpse, or Container

  // Item flags
  isMeds: boolean;
  isFood: boolean;
  isBackpack: boolean;
  isQuestItem: boolean;
  isWishlisted: boolean;
  isImportant: boolean;  // Custom filter marked important
  isBlacklisted: boolean; // Custom filter marked blacklisted

  // For corpses
  ownerName?: string;    // Name of dead player
  hasImportantLoot?: boolean; // Corpse contains important loot
}

export interface Player {
  name: string;
  type: PlayerType;
  isActive: boolean;
  isAlive: boolean;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
}

export interface RadarUpdate {
  version: number;
  inGame: boolean;
  mapId: string;
  players: Player[];
  loot: LootItem[];
}

export interface MapLayer {
  filename: string;
  minHeight?: number;
  maxHeight?: number;
}

export interface MapConfig {
  name: string;
  x: number;
  y: number;
  scale: number;
  svgScale: number;
  layers: MapLayer[];
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'waiting';
  relayUrl: string;
  roomId: string;
}

// Loot filter settings
export interface LootFilterSettings {
  enabled: boolean;          // Show loot on map
  minValue: number;          // Minimum price for regular loot (default 50000)
  minValueImportant: number; // Minimum price for important loot (default 200000)
  showCorpses: boolean;      // Show dead bodies
  showContainers: boolean;   // Show static containers
  showMeds: boolean;         // Show medical items regardless of value
  showFood: boolean;         // Show food items regardless of value
  showBackpacks: boolean;    // Show backpacks regardless of value
  showQuestItems: boolean;   // Show quest items regardless of value
  showWishlist: boolean;     // Show wishlisted items regardless of value
}

// Loot color configuration
export interface LootColors {
  regular: string;      // Default loot color (WhiteSmoke)
  important: string;    // Valuable loot (Turquoise)
  meds: string;         // Medical items (LightSalmon)
  food: string;         // Food items (CornflowerBlue)
  backpack: string;     // Backpacks (Green)
  questItem: string;    // Quest items (YellowGreen)
  wishlist: string;     // Wishlisted items (Lime)
  corpse: string;       // Dead bodies (Silver)
  container: string;    // Static containers (Light Yellow)
}

export interface RadarState {
  // Connection
  connection: ConnectionState;

  // Radar data
  inGame: boolean;
  mapId: string;
  players: Player[];
  loot: LootItem[];

  // View settings
  zoom: number;
  showMap: boolean;
  mapOpacity: number;
  selectedPlayerId: string | null;
  povPlayerName: string | null; // Player name to center view on (null = LocalPlayer)

  // Player filter settings
  showBots: boolean;
  showDeadPlayers: boolean;
  showPlayerNames: boolean;
  showAimlines: boolean;
  showHeightDiff: boolean;

  // Loot settings
  lootFilter: LootFilterSettings;
  lootColors: LootColors;
}

export const PLAYER_COLORS: Record<PlayerType, string> = {
  [PlayerType.LocalPlayer]: '#3b82f6',
  [PlayerType.Teammate]: '#22c55e',
  [PlayerType.PMC]: '#ef4444',
  [PlayerType.PlayerScav]: '#f97316',
  [PlayerType.Bot]: '#fbbf24',
};

export function getPlayerColor(player: Player): string {
  if (!player.isAlive) return '#555555';
  return PLAYER_COLORS[player.type] ?? '#ffffff';
}

export function getPlayerTypeName(type: PlayerType): string {
  switch (type) {
    case PlayerType.LocalPlayer: return 'You';
    case PlayerType.Teammate: return 'Teammate';
    case PlayerType.PMC: return 'PMC';
    case PlayerType.PlayerScav: return 'Scav';
    case PlayerType.Bot: return 'AI';
    default: return 'Unknown';
  }
}

// Default loot colors matching the C# radar
export const DEFAULT_LOOT_COLORS: LootColors = {
  regular: '#F5F5F5',    // WhiteSmoke
  important: '#40E0D0',  // Turquoise
  meds: '#FFA07A',       // LightSalmon
  food: '#6495ED',       // CornflowerBlue
  backpack: '#00b02c',   // Green
  questItem: '#9ACD32',  // YellowGreen
  wishlist: '#00FF00',   // Lime
  corpse: '#C0C0C0',     // Silver
  container: '#FFFFCC',  // Light Yellow
};

// Default loot filter settings
export const DEFAULT_LOOT_FILTER: LootFilterSettings = {
  enabled: true,
  minValue: 50000,
  minValueImportant: 200000,
  showCorpses: true,
  showContainers: false,
  showMeds: true,
  showFood: false,
  showBackpacks: true,
  showQuestItems: true,
  showWishlist: true,
};

// Get the display color for a loot item based on its properties and filter settings
export function getLootColor(item: LootItem, colors: LootColors, filter: LootFilterSettings): string {
  // Priority order matches C# radar

  // 1. Corpses
  if (item.type === LootType.Corpse) {
    return colors.corpse;
  }

  // 2. Containers
  if (item.type === LootType.Container) {
    return colors.container;
  }

  // 3. Quest items (if showing)
  if (filter.showQuestItems && item.isQuestItem) {
    return colors.questItem;
  }

  // 4. Wishlisted items (if showing)
  if (filter.showWishlist && item.isWishlisted) {
    return colors.wishlist;
  }

  // 5. Backpacks (if showing)
  if (filter.showBackpacks && item.isBackpack) {
    return colors.backpack;
  }

  // 6. Meds (if showing)
  if (filter.showMeds && item.isMeds) {
    return colors.meds;
  }

  // 7. Food (if showing)
  if (filter.showFood && item.isFood) {
    return colors.food;
  }

  // 8. Important/custom filter items
  if (item.isImportant) {
    return colors.important;
  }

  // 9. Valuable loot (above important threshold)
  if (item.price >= filter.minValueImportant) {
    return colors.important;
  }

  // 10. Regular loot
  return colors.regular;
}

// Check if a loot item should be displayed based on filter settings
export function shouldShowLoot(item: LootItem, filter: LootFilterSettings): boolean {
  if (!filter.enabled) return false;
  if (item.isBlacklisted) return false;

  // Corpses
  if (item.type === LootType.Corpse) {
    return filter.showCorpses;
  }

  // Containers
  if (item.type === LootType.Container) {
    return filter.showContainers;
  }

  // Always show important/wishlisted items
  if (item.isImportant) return true;
  if (filter.showWishlist && item.isWishlisted) return true;

  // Category overrides
  if (filter.showMeds && item.isMeds) return true;
  if (filter.showFood && item.isFood) return true;
  if (filter.showBackpacks && item.isBackpack) return true;
  if (filter.showQuestItems && item.isQuestItem) return true;

  // Price threshold
  return item.price >= filter.minValue;
}

// Format number with K/M suffix (like FormatNumberKM in C#)
export function formatPrice(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

// Get display label for loot item
export function getLootLabel(item: LootItem): string {
  if (item.type === LootType.Corpse) {
    const prefix = item.hasImportantLoot ? '!! ' : '';
    return `${prefix}${item.ownerName || 'Body'}`;
  }
  if (item.type === LootType.Container) {
    return item.name;
  }
  if (item.price > 0) {
    return `[${formatPrice(item.price)}] ${item.name}`;
  }
  return item.name;
}
