/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ControlDock } from './components/ControlDock';
import { LabelOverlay } from './components/LabelOverlay';
import {
  CAMERA_PRESETS,
  ContainerFinish,
  CutawayMode,
  LightingPreset,
  ROOM_SPECS,
} from './data/houseData';
import { HouseSceneController, ProjectedLabel } from './three/HouseSceneController';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<HouseSceneController | null>(null);

  const [labels, setLabels] = useState<ProjectedLabel[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [activeCameraId, setActiveCameraId] = useState<string>('isometric');
  const [cutawayMode, setCutawayMode] = useState<CutawayMode>('cutaway');
  const [containerFinish, setContainerFinish] = useState<ContainerFinish>('charcoal');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('daylight');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showBlueprint, setShowBlueprint] = useState<boolean>(true);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<boolean>(false);

  const selectRoomAndFocus = useCallback((roomId: string | null) => {
    setSelectedRoomId(roomId);
    if (!roomId || !controllerRef.current) return;
    const room = ROOM_SPECS.find((r) => r.id === roomId);
    if (room) {
      setActiveCameraId('');
      controllerRef.current.setCameraView(room.cameraPos, room.cameraTarget);
    }
  }, []);

  const selectRoomRef = useRef(selectRoomAndFocus);
  selectRoomRef.current = selectRoomAndFocus;

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    let ctrl: HouseSceneController | null = null;
    try {
      ctrl = new HouseSceneController(mount, {
        onLabelsProjected: (projected) => setLabels(projected),
        onSelectRoom: (roomId) => selectRoomRef.current(roomId),
        onContextLost: (lost) => setContextLost(lost),
      });
      controllerRef.current = ctrl;
    } catch {
      setWebglError(true);
    }

    return () => {
      ctrl?.dispose();
      controllerRef.current = null;
    };
  }, []);

  const handleSelectCamera = useCallback((presetId: string) => {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId);
    if (!preset || !controllerRef.current) return;
    setActiveCameraId(presetId);
    setSelectedRoomId(null);
    controllerRef.current.setCameraView(preset.position, preset.target);
  }, []);

  const handleChangeCutaway = useCallback((mode: CutawayMode) => {
    setCutawayMode(mode);
    controllerRef.current?.setCutawayMode(mode);
  }, []);

  const handleChangeFinish = useCallback((finish: ContainerFinish) => {
    setContainerFinish(finish);
    controllerRef.current?.setContainerFinish(finish);
  }, []);

  const handleChangeLighting = useCallback((preset: LightingPreset) => {
    setLightingPreset(preset);
    controllerRef.current?.setLightingPreset(preset);
  }, []);

  const handleToggleBlueprint = useCallback(() => {
    setShowBlueprint((prev) => {
      const next = !prev;
      controllerRef.current?.setBlueprintVisible(next);
      return next;
    });
  }, []);

  const handleExportPng = useCallback(() => {
    if (!controllerRef.current) return;
    const dataUrl = controllerRef.current.capturePng();
    const link = document.createElement('a');
    link.download = 'live-work-startup-house-floorplan.png';
    link.href = dataUrl;
    link.click();
  }, []);

  const selectedRoom = useMemo(
    () => ROOM_SPECS.find((r) => r.id === selectedRoomId) ?? null,
    [selectedRoomId],
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#18232c]">
      {/* Dedicated Isolated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D architectural floor plan cutaway"
      />

      {/* Crisp White Overlay Text Labels with SVG Indicator Lines */}
      <LabelOverlay
        labels={labels}
        visible={showLabels && !webglError && !contextLost}
        selectedRoomId={selectedRoomId}
        hoveredRoomId={hoveredRoomId}
        onSelectRoom={selectRoomAndFocus}
        onHoverRoom={setHoveredRoomId}
      />

      {/* Unified Collapsible Bottom Control Dock & Title Mark */}
      <ControlDock
        activeCameraId={activeCameraId}
        onSelectCamera={handleSelectCamera}
        cutawayMode={cutawayMode}
        onChangeCutaway={handleChangeCutaway}
        containerFinish={containerFinish}
        onChangeFinish={handleChangeFinish}
        lightingPreset={lightingPreset}
        onChangeLighting={handleChangeLighting}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((v) => !v)}
        showBlueprint={showBlueprint}
        onToggleBlueprint={handleToggleBlueprint}
        selectedRoom={selectedRoom}
        onCloseRoom={() => setSelectedRoomId(null)}
        onExportPng={handleExportPng}
      />

      {/* Graceful WebGL Fallback Backdrop */}
      {(webglError || contextLost) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#18232c]/95 p-6 text-center">
          <div className="max-w-md rounded-lg border border-white/15 bg-[#111920] p-6">
            <h2 className="font-display text-lg font-bold text-white">
              {contextLost ? '3D Viewport Paused' : 'WebGL Required'}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {contextLost
                ? 'Graphics context was temporarily interrupted. Restoring the architectural floor plan shortly.'
                : 'Enable hardware or software WebGL rendering in your browser to inspect the interactive 3D floor plan.'}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
