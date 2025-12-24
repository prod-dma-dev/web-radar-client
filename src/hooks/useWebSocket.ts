import { useEffect, useRef, useCallback } from 'react';
import { decode } from '@msgpack/msgpack';
import { useRadarStore } from '../store/radarStore';
import type { Player, PlayerType, LootItem, LootType, GameItem, GearItem } from '../types';

interface RawGearItem {
  0: string;      // slot
  1: string;      // name
  2: number;      // value
  3: boolean;     // isImportant
}

interface RawPlayer {
  0: string;      // name
  1: PlayerType;  // type
  2: boolean;     // isActive
  3: boolean;     // isAlive
  4: number[];    // position [x, y, z]
  5: number[];    // rotation [x, y]
  6: number;      // gearValue
  7: RawGearItem[] | null; // gear
  8: boolean;     // hasImportantLoot
}

interface RawLootItem {
  0: string;      // id
  1: string;      // name
  2: number[];    // position [x, y, z]
  3: number;      // price
  4: LootType;    // type (0=Regular, 1=Corpse, 2=Container)
  5: number;      // flags (packed byte)
  6: string | null; // ownerName (for corpses)
}

interface RawGameItem {
  0: string;      // id
  1: string;      // shortName
  2: string;      // name
  3: number;      // price
  4: number;      // flags (packed byte)
}

interface RawRadarUpdate {
  0: number;        // version
  1: boolean;       // inGame
  2: string;        // mapId
  3: RawPlayer[];   // players
  4: RawLootItem[] | null; // loot
  5: RawGameItem[] | null; // itemDatabase
}

function parseGearItem(raw: RawGearItem): GearItem {
  return {
    slot: raw[0],
    name: raw[1],
    value: raw[2],
    isImportant: raw[3],
  };
}

function parsePlayer(raw: RawPlayer): Player {
  return {
    name: raw[0],
    type: raw[1],
    isActive: raw[2],
    isAlive: raw[3],
    position: {
      x: raw[4][0],
      y: raw[4][1],
      z: raw[4][2],
    },
    rotation: {
      x: raw[5][0],
      y: raw[5][1],
    },
    gearValue: raw[6] || 0,
    gear: raw[7] ? raw[7].map(parseGearItem) : null,
    hasImportantLoot: raw[8] || false,
  };
}

function parseLootItem(raw: RawLootItem): LootItem {
  const flags = raw[5];
  return {
    id: raw[0],
    name: raw[1],
    position: {
      x: raw[2][0],
      y: raw[2][1],
      z: raw[2][2],
    },
    price: raw[3],
    type: raw[4],
    // Unpack flags
    isMeds: (flags & 0x01) !== 0,
    isFood: (flags & 0x02) !== 0,
    isBackpack: (flags & 0x04) !== 0,
    isQuestItem: (flags & 0x08) !== 0,
    isWishlisted: (flags & 0x10) !== 0,
    isImportant: (flags & 0x20) !== 0,
    isBlacklisted: (flags & 0x40) !== 0,
    hasImportantLoot: (flags & 0x80) !== 0,
    ownerName: raw[6] ?? undefined,
  };
}

function parseGameItem(raw: RawGameItem): GameItem {
  const flags = raw[4];
  return {
    id: raw[0],
    shortName: raw[1],
    name: raw[2],
    price: raw[3],
    isMeds: (flags & 0x01) !== 0,
    isFood: (flags & 0x02) !== 0,
    isBackpack: (flags & 0x04) !== 0,
  };
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const connectionParamsRef = useRef<{ relayUrl: string; roomId: string } | null>(null);

  const { setConnectionStatus, updateRadar } = useRadarStore();

  const connect = useCallback((relayUrl: string, roomId: string) => {
    if (!relayUrl || !roomId) return;

    // Store params for reconnection
    connectionParamsRef.current = { relayUrl, roomId };

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('connecting');

    const wsUrl = `${relayUrl}/?role=viewer&room=${roomId}`;
    console.log('Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('waiting');
    };

    ws.onmessage = (event) => {
      try {
        if (typeof event.data === 'string') {
          const msg = JSON.parse(event.data);
          if (msg.type === 'host_connected') {
            setConnectionStatus('connected');
          } else if (msg.type === 'host_disconnected' || msg.type === 'waiting_for_host') {
            setConnectionStatus('waiting');
          }
        } else {
          // Binary message - radar update
          const data = decode(new Uint8Array(event.data)) as RawRadarUpdate;
          const players = (data[3] || []).map(parsePlayer);
          const loot = (data[4] || []).map(parseLootItem);
          const itemDatabase = data[5] ? data[5].map(parseGameItem) : undefined;
          updateRadar(data[1], data[2], players, loot, itemDatabase);
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setConnectionStatus('disconnected');
      wsRef.current = null;

      // Attempt reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        const params = connectionParamsRef.current;
        if (params) {
          connect(params.relayUrl, params.roomId);
        }
      }, 3000);
    };

    wsRef.current = ws;
  }, [setConnectionStatus, updateRadar]);

  const disconnect = useCallback(() => {
    connectionParamsRef.current = null;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect };
}
