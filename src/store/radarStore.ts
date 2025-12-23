import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, LootItem, RadarState, LootFilterSettings, LootColors } from '../types';
import { DEFAULT_LOOT_COLORS, DEFAULT_LOOT_FILTER } from '../types';

interface RadarActions {
  // Connection
  setConnectionStatus: (status: RadarState['connection']['status']) => void;
  setRelayUrl: (url: string) => void;
  setRoomId: (id: string) => void;

  // Radar data
  updateRadar: (inGame: boolean, mapId: string, players: Player[], loot: LootItem[]) => void;

  // View settings
  setZoom: (zoom: number) => void;
  setShowMap: (show: boolean) => void;
  setMapOpacity: (opacity: number) => void;
  setSelectedPlayer: (id: string | null) => void;
  setPovPlayerName: (name: string | null) => void;

  // Player filter settings
  setShowBots: (show: boolean) => void;
  setShowDeadPlayers: (show: boolean) => void;
  setShowPlayerNames: (show: boolean) => void;
  setShowAimlines: (show: boolean) => void;
  setShowHeightDiff: (show: boolean) => void;

  // Loot filter settings
  setLootEnabled: (enabled: boolean) => void;
  setLootMinValue: (value: number) => void;
  setLootMinValueImportant: (value: number) => void;
  setShowCorpses: (show: boolean) => void;
  setShowContainers: (show: boolean) => void;
  setShowMeds: (show: boolean) => void;
  setShowFood: (show: boolean) => void;
  setShowBackpacks: (show: boolean) => void;
  setShowQuestItems: (show: boolean) => void;
  setShowWishlist: (show: boolean) => void;
  updateLootFilter: (filter: Partial<LootFilterSettings>) => void;

  // Loot color settings
  setLootColor: (key: keyof LootColors, color: string) => void;
  resetLootColors: () => void;
}

const initialState: RadarState = {
  connection: {
    status: 'disconnected',
    relayUrl: '',
    roomId: '',
  },
  inGame: false,
  mapId: '',
  players: [],
  loot: [],
  zoom: 1,
  showMap: true,
  mapOpacity: 0.8,
  selectedPlayerId: null,
  povPlayerName: null,
  showBots: true,
  showDeadPlayers: true,
  showPlayerNames: true,
  showAimlines: true,
  showHeightDiff: true,
  lootFilter: { ...DEFAULT_LOOT_FILTER },
  lootColors: { ...DEFAULT_LOOT_COLORS },
};

// Separate persisted settings from runtime state
interface PersistedState {
  connection: {
    relayUrl: string;
    roomId: string;
  };
  lootFilter: LootFilterSettings;
  lootColors: LootColors;
  showBots: boolean;
  showDeadPlayers: boolean;
  showPlayerNames: boolean;
  showAimlines: boolean;
  showHeightDiff: boolean;
  zoom: number;
  showMap: boolean;
  mapOpacity: number;
}

export const useRadarStore = create<RadarState & RadarActions>()(
  persist(
    (set) => ({
      ...initialState,

      setConnectionStatus: (status) =>
        set((state) => ({ connection: { ...state.connection, status } })),

      setRelayUrl: (relayUrl) =>
        set((state) => ({ connection: { ...state.connection, relayUrl } })),

      setRoomId: (roomId) =>
        set((state) => ({ connection: { ...state.connection, roomId } })),

      updateRadar: (inGame, mapId, players, loot) =>
        set({ inGame, mapId, players, loot }),

      setZoom: (zoom) => set({ zoom }),
      setShowMap: (showMap) => set({ showMap }),
      setMapOpacity: (mapOpacity) => set({ mapOpacity }),
      setSelectedPlayer: (selectedPlayerId) => set({ selectedPlayerId }),
      setPovPlayerName: (povPlayerName) => set({ povPlayerName }),

      // Player filters
      setShowBots: (showBots) => set({ showBots }),
      setShowDeadPlayers: (showDeadPlayers) => set({ showDeadPlayers }),
      setShowPlayerNames: (showPlayerNames) => set({ showPlayerNames }),
      setShowAimlines: (showAimlines) => set({ showAimlines }),
      setShowHeightDiff: (showHeightDiff) => set({ showHeightDiff }),

      // Loot filter settings
      setLootEnabled: (enabled) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, enabled } })),

      setLootMinValue: (minValue) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, minValue } })),

      setLootMinValueImportant: (minValueImportant) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, minValueImportant } })),

      setShowCorpses: (showCorpses) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, showCorpses } })),

      setShowContainers: (showContainers) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, showContainers } })),

      setShowMeds: (showMeds) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, showMeds } })),

      setShowFood: (showFood) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, showFood } })),

      setShowBackpacks: (showBackpacks) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, showBackpacks } })),

      setShowQuestItems: (showQuestItems) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, showQuestItems } })),

      setShowWishlist: (showWishlist) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, showWishlist } })),

      updateLootFilter: (filter) =>
        set((state) => ({ lootFilter: { ...state.lootFilter, ...filter } })),

      // Loot color settings
      setLootColor: (key, color) =>
        set((state) => ({ lootColors: { ...state.lootColors, [key]: color } })),

      resetLootColors: () => set({ lootColors: { ...DEFAULT_LOOT_COLORS } }),
    }),
    {
      name: 'radar-settings',
      partialize: (state): PersistedState => ({
        connection: {
          relayUrl: state.connection.relayUrl,
          roomId: state.connection.roomId,
        },
        lootFilter: state.lootFilter,
        lootColors: state.lootColors,
        showBots: state.showBots,
        showDeadPlayers: state.showDeadPlayers,
        showPlayerNames: state.showPlayerNames,
        showAimlines: state.showAimlines,
        showHeightDiff: state.showHeightDiff,
        zoom: state.zoom,
        showMap: state.showMap,
        mapOpacity: state.mapOpacity,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedState;
        return {
          ...currentState,
          ...persisted,
          connection: {
            ...currentState.connection,
            relayUrl: persisted.connection?.relayUrl || '',
            roomId: persisted.connection?.roomId || '',
          },
        };
      },
    }
  )
);
