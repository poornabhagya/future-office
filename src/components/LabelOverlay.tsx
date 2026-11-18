import React from 'react';
import { ProjectedLabel } from '../three/HouseSceneController';

interface LabelOverlayProps {
  labels: ProjectedLabel[];
  visible: boolean;
  selectedRoomId: string | null;
  hoveredRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onHoverRoom: (roomId: string | null) => void;
}

export const LabelOverlay: React.FC<LabelOverlayProps> = ({
  labels,
  visible,
  selectedRoomId,
  hoveredRoomId,
  onSelectRoom,
  onHoverRoom,
}) => {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-label="Architectural Area Labels">
      {/* Crisp SVG Indicator Lines & Anchor Dots */}
      <svg className="h-full w-full" aria-hidden="true">
        {labels.map((item) => {
          if (!item.visible) return null;
          const isActive = selectedRoomId === item.id || hoveredRoomId === item.id;
          const dir = item.labelX >= item.anchorX ? 1 : -1;
          const elbowX = item.labelX - dir * 18;
          const elbowY = item.labelY;
          const pathD = `M ${item.anchorX.toFixed(1)} ${item.anchorY.toFixed(1)} L ${elbowX.toFixed(1)} ${elbowY.toFixed(1)} L ${item.labelX.toFixed(1)} ${item.labelY.toFixed(1)}`;

          return (
            <g key={item.id}>
              {/* Subtle dark under-stroke for contrast over bright timber or water */}
              <path
                d={pathD}
                fill="none"
                stroke="rgba(8, 13, 18, 0.72)"
                strokeWidth={isActive ? 3.5 : 2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Crisp white architectural leader line */}
              <path
                d={pathD}
                fill="none"
                stroke={isActive ? '#7dd3fc' : 'rgba(255, 255, 255, 0.94)'}
                strokeWidth={isActive ? 1.8 : 1.25}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Anchor target ring + dot */}
              <circle
                cx={item.anchorX}
                cy={item.anchorY}
                r={isActive ? 6.5 : 5}
                fill="none"
                stroke="rgba(8, 13, 18, 0.7)"
                strokeWidth={2}
              />
              <circle
                cx={item.anchorX}
                cy={item.anchorY}
                r={isActive ? 3.5 : 2.6}
                fill={isActive ? '#7dd3fc' : '#ffffff'}
              />
            </g>
          );
        })}
      </svg>

      {/* Semantic White Overlay Text Buttons */}
      {labels.map((item) => {
        if (!item.visible) return null;
        const isActive = selectedRoomId === item.id || hoveredRoomId === item.id;
        const isRight = item.labelX >= item.anchorX;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectRoom(item.id)}
            onMouseEnter={() => onHoverRoom(item.id)}
            onMouseLeave={() => onHoverRoom(null)}
            style={{
              left: `${item.labelX}px`,
              top: `${item.labelY}px`,
              transform: isRight ? 'translate(8px, -50%)' : 'translate(calc(-100% - 8px), -50%)',
            }}
            className={`pointer-events-auto absolute whitespace-nowrap text-left transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 ${
              isRight ? 'text-left' : 'text-right'
            } ${isActive ? 'scale-[1.04]' : 'hover:scale-[1.03]'}`}
          >
            <span
              className={`arch-label-shadow block font-display text-[11px] font-bold tracking-[0.11em] sm:text-xs ${
                isActive ? 'text-sky-200 underline decoration-sky-300/80 underline-offset-4' : 'text-white'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
