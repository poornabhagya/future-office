import React, { useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Grid3x3,
  Layers,
  Sun,
  Tag,
  X,
} from 'lucide-react';
import {
  CAMERA_PRESETS,
  CONTAINER_FINISH_COLORS,
  ContainerFinish,
  CutawayMode,
  LightingPreset,
  RoomSpec,
} from '../data/houseData';

interface ControlDockProps {
  activeCameraId: string;
  onSelectCamera: (presetId: string) => void;
  cutawayMode: CutawayMode;
  onChangeCutaway: (mode: CutawayMode) => void;
  containerFinish: ContainerFinish;
  onChangeFinish: (finish: ContainerFinish) => void;
  lightingPreset: LightingPreset;
  onChangeLighting: (preset: LightingPreset) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showBlueprint: boolean;
  onToggleBlueprint: () => void;
  selectedRoom: RoomSpec | null;
  onCloseRoom: () => void;
  onExportPng: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  activeCameraId,
  onSelectCamera,
  cutawayMode,
  onChangeCutaway,
  containerFinish,
  onChangeFinish,
  lightingPreset,
  onChangeLighting,
  showLabels,
  onToggleLabels,
  showBlueprint,
  onToggleBlueprint,
  selectedRoom,
  onCloseRoom,
  onExportPng,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Minimal Top-Left Title Mark (No Pill Enclosures, No Backdrop Blur) */}
      <header className="pointer-events-none fixed top-4 left-5 z-20 max-w-md">
        <div className="pointer-events-auto inline-block bg-[#111920]/88 px-4 py-2.5 border border-white/12 rounded-lg">
          <h1 className="font-display text-sm sm:text-base font-bold tracking-tight text-white">
            Live-Work Startup House
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-300 font-mono-num">
            <span>2 × 40ft Ground</span>
            <span aria-hidden="true">·</span>
            <span>1 × 15ft Stacked</span>
            <span aria-hidden="true">·</span>
            <span>2,430 sq ft Total</span>
          </div>
        </div>
      </header>

      {/* Bottom Unified Collapsible Dock */}
      <div
        className={`fixed bottom-4 left-1/2 z-30 w-[min(960px,95vw)] -translate-x-1/2 transition-transform duration-200 ease-out ${
          collapsed ? 'translate-y-[calc(100%-20px)]' : 'translate-y-0'
        }`}
      >
        {/* Selected Room Architectural Sheet (Anchored cleanly above dock, zero center occlusion) */}
        {selectedRoom && !collapsed && (
          <div className="mb-2.5 rounded-lg border border-white/15 bg-[#111920]/94 px-4 py-3 text-slate-100 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-sky-300 font-mono-num">
                  <span>{selectedRoom.zone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedRoom.dimensions}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedRoom.area}</span>
                </div>
                <h2 className="mt-0.5 font-display text-sm font-bold tracking-wide text-white">
                  {selectedRoom.label}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-300 max-w-2xl">
                  {selectedRoom.summary}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                  {selectedRoom.fixtures.map((f, idx) => (
                    <span key={f} className="whitespace-nowrap">
                      {idx > 0 && <span className="mr-3 text-slate-600">/</span>}
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseRoom}
                aria-label="Close area details"
                className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Collapse / Expand Tab */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1.5 rounded-t-md border border-b-0 border-white/15 bg-[#111920]/95 px-3 py-1 text-[11px] font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
          >
            {collapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Unified Control Bar */}
        <div className="rounded-lg border border-white/15 bg-[#111920]/94 px-3.5 py-2.5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            {/* Camera Viewpoint Presets */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {CAMERA_PRESETS.map((preset) => {
                const active = activeCameraId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectCamera(preset.id)}
                    className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:block h-5 w-px bg-white/12" aria-hidden="true" />

            {/* Cutaway / Roof Section Selector */}
            <div className="flex items-center gap-1">
              <Layers className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              {(
                [
                  { id: 'cutaway', label: 'Cutaway' },
                  { id: 'glass-roof', label: 'Glass Roof' },
                  { id: 'full-shell', label: 'Full Shell' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeCutaway(m.id)}
                  className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    cutawayMode === m.id
                      ? 'bg-white/18 text-white'
                      : 'text-slate-400 hover:bg-white/8 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:block h-5 w-px bg-white/12" aria-hidden="true" />

            {/* Steel Container Finish + Lighting + Toggles */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Container Finish Swatches */}
              <div className="flex items-center gap-1.5" role="group" aria-label="Container finish">
                {(Object.keys(CONTAINER_FINISH_COLORS) as ContainerFinish[]).map((fin) => {
                  const cfg = CONTAINER_FINISH_COLORS[fin];
                  const active = containerFinish === fin;
                  return (
                    <button
                      key={fin}
                      type="button"
                      title={cfg.name}
                      aria-label={cfg.name}
                      onClick={() => onChangeFinish(fin)}
                      className={`h-5 w-5 rounded-sm border transition-transform ${
                        active
                          ? 'scale-110 border-sky-300 ring-1 ring-sky-300'
                          : 'border-white/25 hover:scale-105'
                      }`}
                      style={{ backgroundColor: cfg.swatch }}
                    />
                  );
                })}
              </div>

              {/* Lighting Cycle Button */}
              <button
                type="button"
                onClick={() => {
                  const order: LightingPreset[] = ['daylight', 'golden', 'blueprint'];
                  const next = order[(order.indexOf(lightingPreset) + 1) % order.length];
                  onChangeLighting(next);
                }}
                className="flex items-center gap-1.5 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
                title="Switch outdoor lighting"
              >
                <Sun className="h-3.5 w-3.5 text-amber-300" />
                <span>
                  {lightingPreset === 'daylight'
                    ? 'Daylight'
                    : lightingPreset === 'golden'
                      ? 'Golden Hour'
                      : 'Blueprint'}
                </span>
              </button>

              {/* Labels Toggle */}
              <button
                type="button"
                onClick={onToggleLabels}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  showLabels
                    ? 'border-sky-400/50 bg-sky-500/15 text-sky-200'
                    : 'border-white/12 text-slate-400 hover:text-white'
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Labels</span>
              </button>

              {/* Blueprint Grid Toggle */}
              <button
                type="button"
                onClick={onToggleBlueprint}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  showBlueprint
                    ? 'border-sky-400/50 bg-sky-500/15 text-sky-200'
                    : 'border-white/12 text-slate-400 hover:text-white'
                }`}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
                <span>Grid</span>
              </button>

              {/* Export Snapshot */}
              <button
                type="button"
                onClick={onExportPng}
                title="Save architectural view as PNG"
                className="flex items-center gap-1.5 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Save PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
