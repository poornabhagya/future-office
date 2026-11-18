export type CutawayMode = 'cutaway' | 'glass-roof' | 'full-shell';
export type ContainerFinish = 'charcoal' | 'corten' | 'sage';
export type LightingPreset = 'daylight' | 'golden' | 'blueprint';

export interface RoomSpec {
  id: string;
  label: string;
  zone: string;
  dimensions: string;
  area: string;
  summary: string;
  fixtures: string[];
  anchor3D: [number, number, number];
  labelOffset3D: [number, number, number];
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface CameraPreset {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const ROOM_SPECS: RoomSpec[] = [
  {
    id: 'office-living',
    label: 'OFFICE & LIVING AREA',
    zone: 'Central Double-Height Hall',
    dimensions: '19.5 ft × 40.0 ft',
    area: '780 sq ft',
    summary:
      'Open double-height communal studio beneath a steel-framed skylight roof, uniting a 6-seat startup workbench, glass brainstorm wall, and rustic lounge.',
    fixtures: [
      'Live-edge timber startup desk (6 seats)',
      'Freestanding brainstorm whiteboard & pinboard',
      'L-shaped linen sofa & timber coffee table',
      'Full-height sliding glass patio doors',
    ],
    anchor3D: [0.0, 0.95, 0.2],
    labelOffset3D: [-0.8, 6.4, -0.4],
    cameraPos: [10.5, 9.8, 13.5],
    cameraTarget: [0.0, 1.2, 0.5],
  },
  {
    id: 'bedroom-01',
    label: 'BEDROOM 01',
    zone: 'Left 40ft Container · Rear',
    dimensions: '8.0 ft × 19.5 ft',
    area: '156 sq ft',
    summary:
      'Private founder sleeping quarters in the rear half of the left 40ft container with oak flooring, built-in wardrobe, and sliding glass hall access.',
    fixtures: [
      'Queen timber platform bed & linen throw',
      'Twin nightstands with warm brass lamps',
      'Full-height oak wardrobe & woven rug',
    ],
    anchor3D: [-4.2, 1.0, -3.2],
    labelOffset3D: [-8.0, 4.4, -4.4],
    cameraPos: [-12.5, 9.2, -8.5],
    cameraTarget: [-4.1, 1.1, -3.0],
  },
  {
    id: 'bedroom-02',
    label: 'BEDROOM 02',
    zone: 'Left 40ft Container · Front',
    dimensions: '8.0 ft × 19.5 ft',
    area: '156 sq ft',
    summary:
      'Front guest and co-founder suite with natural timber floors, dedicated study desk, shelving, and direct views toward the front patio.',
    fixtures: [
      'Double timber-framed bed & accent cushions',
      'Compact study desk, chair & open shelving',
      'Sliding glass entry from central hall',
    ],
    anchor3D: [-4.2, 1.0, 3.1],
    labelOffset3D: [-8.6, 3.8, 3.0],
    cameraPos: [-12.5, 8.8, 9.5],
    cameraTarget: [-4.1, 1.1, 3.0],
  },
  {
    id: 'bedroom-03',
    label: 'BEDROOM 03',
    zone: 'Right 40ft Container · Rear',
    dimensions: '8.0 ft × 14.0 ft',
    area: '112 sq ft',
    summary:
      'Quiet rear sleeping alcove tucked beneath the cantilevered second-floor structure, outfitted with warm timber paneling and acoustic privacy.',
    fixtures: [
      'Timber-framed bed & warm reading sconce',
      'Compact storage wardrobe & woven rug',
      'Sliding glass door into central hall',
    ],
    anchor3D: [4.2, 0.9, -3.4],
    labelOffset3D: [8.8, 2.2, -5.2],
    cameraPos: [13.5, 7.6, -7.8],
    cameraTarget: [4.0, 1.0, -3.6],
  },
  {
    id: 'pantry-kitchen',
    label: 'COMPACT PANTRY & KITCHEN',
    zone: 'Right 40ft Container · Center',
    dimensions: '8.0 ft × 14.5 ft',
    area: '116 sq ft',
    summary:
      'Efficient galley kitchen with butcher-block counters, induction cooktop, espresso station, and open breakfast pass-through to the startup hall.',
    fixtures: [
      'Butcher-block counter & stainless sink',
      '2-burner induction stove & black range hood',
      'Espresso bar, open timber shelves & bar stools',
    ],
    anchor3D: [4.2, 1.05, 0.45],
    labelOffset3D: [9.4, 3.1, 0.8],
    cameraPos: [12.5, 8.2, 4.5],
    cameraTarget: [4.0, 1.1, 0.4],
  },
  {
    id: 'common-washroom',
    label: 'COMMON WASHROOM',
    zone: 'Right 40ft Container · Front',
    dimensions: '8.0 ft × 11.5 ft',
    area: '92 sq ft',
    summary:
      'Shared modern wet-room bath featuring matte slate tilework, glass walk-in rain shower, floating oak vanity, and frosted louvers.',
    fixtures: [
      'Frameless glass walk-in rain shower',
      'Floating oak vanity & ceramic vessel basin',
      'Modern wall-hung WC & heated towel rail',
    ],
    anchor3D: [4.2, 1.0, 4.4],
    labelOffset3D: [8.8, 2.7, 5.2],
    cameraPos: [12.5, 8.2, 10.2],
    cameraTarget: [4.1, 1.0, 4.3],
  },
  {
    id: 'upstairs-meeting',
    label: 'UPSTAIRS MEETING ROOM',
    zone: 'Second Floor · 15ft Offset Container',
    dimensions: '8.0 ft × 15.0 ft',
    area: '120 sq ft',
    summary:
      'Elevated 15ft shipping container offset transversely across the second level, housing a private boardroom cantilevered above the central atrium.',
    fixtures: [
      '6-person oak conference table & seating',
      'Wall-mounted presentation screen',
      'Sliding glass door to cantilevered sky deck',
    ],
    anchor3D: [4.0, 4.4, -4.5],
    labelOffset3D: [4.2, 7.6, -5.6],
    cameraPos: [13.5, 10.2, 2.5],
    cameraTarget: [4.1, 4.1, -4.4],
  },
  {
    id: 'spiral-stairs',
    label: 'EXTERNAL SPIRAL STAIRS',
    zone: 'Exterior Right Flank',
    dimensions: '7.2 ft Ø × 9.8 ft Rise',
    area: '14 Treads',
    summary:
      'Sculptural black steel and hardwood spiral staircase rising externally from the ground side-deck to the upper meeting room terrace.',
    fixtures: [
      'Central structural matte-black steel mast',
      '14 fanned natural hardwood treads',
      'Continuous helical steel handrail & balusters',
    ],
    anchor3D: [6.85, 2.1, -0.9],
    labelOffset3D: [10.4, 4.9, -1.6],
    cameraPos: [14.8, 7.5, 5.2],
    cameraTarget: [6.4, 2.2, -1.2],
  },
  {
    id: 'pool-patio',
    label: 'OUTDOOR POOL & PATIO',
    zone: 'Front Courtyard',
    dimensions: '42.0 ft × 25.0 ft',
    area: '1,050 sq ft',
    summary:
      'Sunlit hardwood patio deck with outdoor dining set and loungers stepping down to a recessed turquoise mosaic lap pool framed by tropical palms.',
    fixtures: [
      'Hardwood deck with outdoor dining table',
      'Recessed 21ft × 11ft turquoise mosaic pool',
      'Teak sun loungers & travertine coping',
    ],
    anchor3D: [1.0, 0.25, 10.6],
    labelOffset3D: [4.8, 2.3, 14.2],
    cameraPos: [13.0, 9.8, 21.5],
    cameraTarget: [0.5, 0.4, 10.0],
  },
];

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'isometric',
    label: 'Isometric Cutaway',
    position: [20.0, 16.5, 21.0],
    target: [0.4, 1.3, 1.6],
  },
  {
    id: 'top-plan',
    label: 'Floor Plan',
    position: [0.2, 28.0, 3.2],
    target: [0.2, 0.5, 1.5],
  },
  {
    id: 'central-hall',
    label: 'Central Hall',
    position: [8.5, 8.8, 12.2],
    target: [0.0, 1.2, 0.2],
  },
  {
    id: 'upstairs',
    label: 'Top Floor',
    position: [15.5, 10.2, 5.2],
    target: [4.3, 3.6, -3.2],
  },
  {
    id: 'pool-front',
    label: 'Pool & Patio',
    position: [-12.0, 8.8, 19.5],
    target: [0.6, 0.6, 8.5],
  },
];

export const CONTAINER_FINISH_COLORS: Record<
  ContainerFinish,
  { name: string; hex: string; trimHex: string; swatch: string }
> = {
  charcoal: {
    name: 'Charcoal Steel',
    hex: '#2b343b',
    trimHex: '#181e23',
    swatch: '#2b343b',
  },
  corten: {
    name: 'Corten Rust',
    hex: '#8c4328',
    trimHex: '#33241e',
    swatch: '#9c4b2d',
  },
  sage: {
    name: 'Sage Olive',
    hex: '#46584b',
    trimHex: '#202822',
    swatch: '#4a5d4f',
  },
};
