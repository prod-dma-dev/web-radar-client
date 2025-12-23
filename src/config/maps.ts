import type { MapConfig } from '../types';

interface RawMapConfig {
  mapID: string[];
  x: number;
  y: number;
  scale: number;
  svgScale: number;
  mapLayers: Array<{
    minHeight: number | null;
    maxHeight: number | null;
    filename: string;
  }>;
}

// Cache for loaded configs
const configCache: Record<string, MapConfig> = {};
const loadingPromises: Record<string, Promise<MapConfig | null>> = {};

export async function loadMapConfig(mapId: string): Promise<MapConfig | null> {
  const normalizedId = mapId.toLowerCase();

  // Return cached config
  if (configCache[normalizedId]) {
    return configCache[normalizedId];
  }

  // Return existing loading promise
  if (normalizedId in loadingPromises) {
    return loadingPromises[normalizedId];
  }

  // Map IDs to JSON filenames
  const filenameMap: Record<string, string> = {
    'interchange': 'Interchange',
    'bigmap': 'Customs',
    'factory4_day': 'Factory',
    'factory4_night': 'Factory',
    'laboratory': 'Labs',
    'rezervbase': 'Reserve',
    'shoreline': 'Shoreline',
    'woods': 'Woods',
    'lighthouse': 'Lighthouse',
    'tarkovstreets': 'Streets',
    'sandbox': 'GroundZero',
    'sandbox_high': 'GroundZero',
    'labyrinth': 'Labyrinth',
    'terminal': 'Terminal',
  };

  const jsonFilename = filenameMap[normalizedId] || mapId;

  loadingPromises[normalizedId] = (async () => {
    try {
      const response = await fetch(`/maps/${jsonFilename}.json`);
      if (!response.ok) {
        console.error(`Failed to load map config: ${jsonFilename}.json`);
        return null;
      }

      const raw: RawMapConfig = await response.json();

      const config: MapConfig = {
        name: jsonFilename,
        x: raw.x,
        y: raw.y,
        scale: raw.scale,
        svgScale: raw.svgScale,
        layers: raw.mapLayers.map(layer => ({
          filename: layer.filename,
          minHeight: layer.minHeight ?? undefined,
          maxHeight: layer.maxHeight ?? undefined,
        })),
      };

      configCache[normalizedId] = config;
      return config;
    } catch (err) {
      console.error(`Error loading map config for ${mapId}:`, err);
      return null;
    }
  })();

  return loadingPromises[normalizedId];
}

// Synchronous getter (returns cached value or null)
export function getMapConfig(mapId: string): MapConfig | undefined {
  const normalizedId = mapId.toLowerCase();
  return configCache[normalizedId];
}

export function getMapName(mapId: string): string {
  const config = getMapConfig(mapId);
  return config?.name ?? mapId;
}
