import { useEffect, useRef, useCallback, useState } from 'react';
import { useRadarStore } from '../../store/radarStore';
import { getMapConfig, loadMapConfig } from '../../config/maps';
import {
  getPlayerColor,
  PlayerType,
  getLootColor,
  getLootLabel,
  shouldShowLoot,
  type MapConfig,
} from '../../types';

// Helper function to draw up arrow (for items above player)
function drawUpArrow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);           // Top point
  ctx.lineTo(x - size * 0.6, y + size * 0.5);  // Bottom left
  ctx.lineTo(x + size * 0.6, y + size * 0.5);  // Bottom right
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

// Helper function to draw down arrow (for items below player)
function drawDownArrow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + size);           // Bottom point
  ctx.lineTo(x - size * 0.6, y - size * 0.5);  // Top left
  ctx.lineTo(x + size * 0.6, y - size * 0.5);  // Top right
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

export function RadarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  // Store all layer images with their height bounds
  const mapLayersRef = useRef<Array<{
    image: HTMLImageElement;
    viewBox: { width: number; height: number };
    minHeight: number | undefined;
    maxHeight: number | undefined;
  }>>([]);
  const currentMapRef = useRef<string>('');

  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);

  // Pan/zoom state
  const panRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const {
    mapId,
    players,
    loot,
    zoom,
    showMap,
    mapOpacity,
    showBots,
    showDeadPlayers,
    showPlayerNames,
    showAimlines,
    showHeightDiff,
    setZoom,
    povPlayerName,
    lootFilter,
    lootColors,
  } = useRadarStore();

  // World to map coordinate conversion
  // Config values are calibrated for the SVG viewBox, but browser may render at different size
  const worldToMap = useCallback((worldX: number, worldZ: number, config: ReturnType<typeof getMapConfig>, imgWidth?: number, viewBoxWidth?: number) => {
    if (!config) return { x: 0, y: 0 };

    // Scale factor to convert from SVG viewBox coords to actual image coords
    const scaleFactor = (imgWidth && viewBoxWidth) ? imgWidth / viewBoxWidth : 1;

    // Calculate position in SVG viewBox space, then scale to actual image size
    return {
      x: (config.x + (worldX * config.scale)) * scaleFactor,
      y: (config.y - (worldZ * config.scale)) * scaleFactor,
    };
  }, []);

  // Load map config and all layer images
  useEffect(() => {
    if (!mapId || mapId === currentMapRef.current) return;

    const load = async () => {
      const config = await loadMapConfig(mapId);
      if (!config) {
        console.log('No map config for:', mapId);
        return;
      }

      setMapConfig(config);
      mapLayersRef.current = [];
      console.log('Loading map layers:', config.layers.length, 'layers for', mapId);

      // Load all layers
      const loadLayer = async (layer: typeof config.layers[0], index: number) => {
        const url = `/maps/${layer.filename}`;
        console.log(`Loading layer ${index}:`, layer.filename, 'height:', layer.minHeight, '-', layer.maxHeight);

        try {
          const response = await fetch(url);
          const svgText = await response.text();

          // Parse viewBox from SVG
          let viewBox = { width: 300, height: 300 };
          const viewBoxMatch = svgText.match(/viewBox=["']([^"']+)["']/);
          if (viewBoxMatch) {
            const [, , , width, height] = viewBoxMatch[1].split(/\s+/).map(Number);
            viewBox = { width, height };
          }

          // Create image from SVG with explicit dimensions
          return new Promise<typeof mapLayersRef.current[0] | null>((resolve) => {
            const img = new Image();
            img.onload = () => {
              console.log(`Layer ${index} loaded:`, layer.filename, img.width, 'x', img.height);
              resolve({
                image: img,
                viewBox,
                minHeight: layer.minHeight,
                maxHeight: layer.maxHeight,
              });
            };
            img.onerror = (e) => {
              console.error(`Failed to load layer: ${url}`, e);
              resolve(null);
            };

            // Inject width/height into SVG
            const modifiedSvg = svgText.replace(
              /<svg([^>]*)>/,
              `<svg$1 width="${viewBox.width}" height="${viewBox.height}">`
            );
            const blob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
            img.src = URL.createObjectURL(blob);
          });
        } catch (err) {
          console.error(`Failed to load layer ${layer.filename}:`, err);
          return null;
        }
      };

      // Load all layers in parallel
      const loadedLayers = await Promise.all(
        config.layers.map((layer, i) => loadLayer(layer, i))
      );

      mapLayersRef.current = loadedLayers.filter((l): l is NonNullable<typeof l> => l !== null);
      currentMapRef.current = mapId;
      console.log('All layers loaded:', mapLayersRef.current.length);
    };

    load();
  }, [mapId]);

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to container
    const rect = container.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Find POV player - use custom POV name if set, otherwise default to LocalPlayer
    const povPlayer = povPlayerName
      ? players.find(p => p.name === povPlayerName)
      : players.find(p => p.type === PlayerType.LocalPlayer);
    const localPlayer = players.find(p => p.type === PlayerType.LocalPlayer);

    // Clear canvas
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Select the correct map layer based on POV player's height
    const playerHeight = povPlayer?.position.y ?? 0;
    let activeLayer = mapLayersRef.current[0]; // Default to first layer

    // Find matching layer based on height - check layers in reverse order (higher floors first)
    for (let i = mapLayersRef.current.length - 1; i >= 0; i--) {
      const layer = mapLayersRef.current[i];
      const minOk = layer.minHeight === undefined || playerHeight >= layer.minHeight;
      const maxOk = layer.maxHeight === undefined || playerHeight <= layer.maxHeight;
      if (minOk && maxOk) {
        activeLayer = layer;
        break;
      }
    }

    const currentImage = activeLayer?.image;
    const currentViewBox = activeLayer?.viewBox;

    // Get POV player map position (for centering the view)
    const imgWidth = currentImage?.width;
    const viewBoxWidth = currentViewBox?.width;
    let povPlayerMapPos = { x: 0, y: 0 };
    if (povPlayer && mapConfig) {
      povPlayerMapPos = worldToMap(povPlayer.position.x, povPlayer.position.z, mapConfig, imgWidth, viewBoxWidth);
    }

    // Apply transform - center view on POV player
    // The svgScale is applied as part of the canvas transform (like the main radar)
    ctx.save();
    const effectiveZoom = zoom * (mapConfig?.svgScale ?? 1);
    const offsetX = canvas.width / 2 + panRef.current.x - povPlayerMapPos.x * effectiveZoom;
    const offsetY = canvas.height / 2 + panRef.current.y - povPlayerMapPos.y * effectiveZoom;
    ctx.translate(offsetX, offsetY);
    ctx.scale(effectiveZoom, effectiveZoom);

    // Draw map at its natural SVG size (transform handles scaling)
    if (showMap && currentImage && mapConfig) {
      ctx.globalAlpha = mapOpacity;
      ctx.drawImage(currentImage, 0, 0);
      ctx.globalAlpha = 1;
    }

    // Draw grid if no map
    if (!currentImage || !showMap) {
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 0.2;
      const gridSize = 20; // In SVG coordinate units
      const gridRange = 1000;
      const gx = povPlayerMapPos.x;
      const gy = povPlayerMapPos.y;
      for (let x = -gridRange; x <= gridRange; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + gx, -gridRange + gy);
        ctx.lineTo(x + gx, gridRange + gy);
        ctx.stroke();
      }
      for (let y = -gridRange; y <= gridRange; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-gridRange + gx, y + gy);
        ctx.lineTo(gridRange + gx, y + gy);
        ctx.stroke();
      }
    }

    // Draw loot (before players so players appear on top)
    if (lootFilter.enabled && mapConfig) {
      const filteredLoot = loot.filter(item => shouldShowLoot(item, lootFilter));

      // Sort by price (lowest first, so valuable items are drawn on top)
      const sortedLoot = [...filteredLoot].sort((a, b) => {
        // Important items last (on top)
        if (a.isImportant && !b.isImportant) return 1;
        if (!a.isImportant && b.isImportant) return -1;
        return a.price - b.price;
      });

      const lootRadius = 1.2;

      sortedLoot.forEach(item => {
        const pos = worldToMap(item.position.x, item.position.z, mapConfig, imgWidth, viewBoxWidth);
        const color = getLootColor(item, lootColors, lootFilter);
        const heightDiff = item.position.y - (localPlayer?.position.y ?? 0);

        // Draw shape based on height difference
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 0.3;

        if (heightDiff > 1.45) {
          // Above player - up arrow
          drawUpArrow(ctx, pos.x, pos.y, lootRadius * 2);
        } else if (heightDiff < -1.45) {
          // Below player - down arrow
          drawDownArrow(ctx, pos.x, pos.y, lootRadius * 2);
        } else {
          // Same level - circle
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, lootRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
        }

        // Draw label in screen space
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const screenX = offsetX + pos.x * effectiveZoom;
        const screenY = offsetY + pos.y * effectiveZoom;
        const label = getLootLabel(item);

        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Text outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(label, screenX + 8, screenY);

        // Text fill
        ctx.fillStyle = color;
        ctx.fillText(label, screenX + 8, screenY);

        ctx.restore();
      });
    }

    // Filter and sort players
    const filteredPlayers = players.filter(player => {
      if (!showBots && player.type === PlayerType.Bot) return false;
      if (!showDeadPlayers && !player.isAlive) return false;
      return true;
    });

    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
      if (a.type === PlayerType.LocalPlayer) return 1;
      if (b.type === PlayerType.LocalPlayer) return -1;
      return 0;
    });

    // Draw players
    const baseRadius = 1.5; // Base radius in image coordinate units
    sortedPlayers.forEach(player => {
      if (!mapConfig) return;
      const pos = worldToMap(player.position.x, player.position.z, mapConfig, imgWidth, viewBoxWidth);
      const color = getPlayerColor(player);
      const isLocal = player.type === PlayerType.LocalPlayer;
      const radius = isLocal ? baseRadius * 1.5 : baseRadius;

      // Aimline
      if (showAimlines && player.isAlive) {
        const aimLength = isLocal ? 15 : 10; // In image coordinate units
        // Use rotation.x for horizontal aim direction (game uses different axis convention)
        const yaw = (player.rotation.x - 90) * (Math.PI / 180);

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(
          pos.x + Math.cos(yaw) * aimLength,
          pos.y + Math.sin(yaw) * aimLength
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.4;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Player dot outline
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fill();

      // Player dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Selection ring for local player
      if (isLocal) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 1, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 0.3;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Player name - draw in screen space for readable text
      if (showPlayerNames) {
        ctx.save();
        // Reset transform for text rendering
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Calculate screen position
        const screenX = offsetX + pos.x * effectiveZoom;
        const screenY = offsetY + pos.y * effectiveZoom;

        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Text outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(player.name, screenX, screenY - radius * effectiveZoom - 5);

        // Text fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText(player.name, screenX, screenY - radius * effectiveZoom - 5);

        // Height difference
        if (showHeightDiff && localPlayer && player !== localPlayer) {
          const heightDiff = Math.round(player.position.y - localPlayer.position.y);
          if (Math.abs(heightDiff) > 1) {
            ctx.font = '9px Arial';
            ctx.textBaseline = 'top';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            const heightText = `${heightDiff > 0 ? '+' : ''}${heightDiff}`;
            ctx.strokeText(heightText, screenX, screenY + radius * effectiveZoom + 3);
            ctx.fillStyle = heightDiff > 0 ? '#22c55e' : '#ef4444';
            ctx.fillText(heightText, screenX, screenY + radius * effectiveZoom + 3);
          }
        }
        ctx.restore();
      }
    });

    ctx.restore();

    // Draw compass
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('N', canvas.width / 2, 20);

    animationRef.current = requestAnimationFrame(render);
  }, [mapId, mapConfig, players, loot, zoom, showMap, mapOpacity, showBots, showDeadPlayers, showPlayerNames, showAimlines, showHeightDiff, worldToMap, povPlayerName, lootFilter, lootColors]);

  // Start render loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  // Mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      panRef.current.x += dx;
      panRef.current.y += dy;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      canvas.releasePointerCapture(e.pointerId);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.2, Math.min(5, zoom + delta));
      setZoom(newZoom);
    };

    const onDoubleClick = () => {
      panRef.current = { x: 0, y: 0 };
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDoubleClick);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDoubleClick);
    };
  }, [zoom, setZoom]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none', cursor: 'grab' }}
      />
    </div>
  );
}
