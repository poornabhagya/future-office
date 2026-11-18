import * as THREE from 'three';
import { CONTAINER_FINISH_COLORS, ContainerFinish, CutawayMode } from '../data/houseData';
import { ProceduralTextureSet } from './proceduralTextures';

export interface ArchitectureHandle {
  group: THREE.Group;
  setContainerFinish: (finish: ContainerFinish) => void;
  updateCutaway: (progress: number, mode: CutawayMode) => void;
  interactiveMeshes: THREE.Object3D[];
}

function createSectionCapMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xe6e4de,
    roughness: 0.45,
    metalness: 0.05,
  });
}

function addCornerCastings(
  parent: THREE.Group,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  mat: THREE.Material,
) {
  const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  const coords: [number, number, number][] = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x0, y1, z0],
    [x1, y1, z0],
    [x0, y1, z1],
    [x1, y1, z1],
  ];
  for (const [cx, cy, cz] of coords) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(cx, cy, cz);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
  }
}

function createRoomZoneHitbox(
  roomId: string,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ visible: false });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.userData.roomId = roomId;
  return mesh;
}

export function buildContainerArchitecture(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): ArchitectureHandle {
  const root = new THREE.Group();
  const interactiveMeshes: THREE.Object3D[] = [];

  // Shared materials
  const containerWallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(CONTAINER_FINISH_COLORS.charcoal.hex),
    roughness: 0.52,
    metalness: 0.68,
    bumpMap: textures.corrugationBump,
    bumpScale: 0.055,
  });

  const steelFrameMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(CONTAINER_FINISH_COLORS.charcoal.trimHex),
    roughness: 0.36,
    metalness: 0.85,
  });

  const interiorWallMat = new THREE.MeshStandardMaterial({
    color: 0xeae5dc,
    roughness: 0.82,
    metalness: 0.02,
  });

  const timberFloorMat = new THREE.MeshStandardMaterial({
    map: textures.timberColor,
    bumpMap: textures.timberBump,
    bumpScale: 0.015,
    roughness: 0.62,
    metalness: 0.04,
  });

  const washroomFloorMat = new THREE.MeshStandardMaterial({
    map: textures.slateTileColor,
    roughness: 0.5,
    metalness: 0.08,
  });

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x85827b,
    roughness: 0.88,
    metalness: 0.05,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdff2fa,
    metalness: 0.05,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.86,
    transparent: true,
    opacity: isSoftwareGl ? 0.3 : 0.92,
    ior: 1.5,
    thickness: 0.08,
    depthWrite: false,
  });

  const roofGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6f6ff,
    metalness: 0.05,
    roughness: 0.08,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const frostedGlassMat = new THREE.MeshStandardMaterial({
    color: 0xd7e8ee,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });

  const sectionCapMat = createSectionCapMaterial();

  // Arrays for animated cutaway transition
  const cutawayUpperGroup = new THREE.Group();
  const skylightGlassGroup = new THREE.Group();
  root.add(cutawayUpperGroup);
  root.add(skylightGlassGroup);

  // 1. CONCRETE FOUNDATION PLINTH
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.14, 12.7), plinthMat);
  plinth.position.set(0, 0.07, 0);
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  root.add(plinth);

  // 2. INTERIOR FLOORS (Offset Y >= 0.16 to prevent Z-fighting)
  const leftFloor = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.04, 12.04), timberFloorMat);
  leftFloor.position.set(-4.2, 0.16, 0);
  leftFloor.receiveShadow = true;
  root.add(leftFloor);

  const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(5.96, 0.04, 12.08), timberFloorMat);
  hallFloor.position.set(0, 0.16, 0);
  hallFloor.receiveShadow = true;
  root.add(hallFloor);

  const rightMainFloor = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.04, 8.7), timberFloorMat);
  rightMainFloor.position.set(4.2, 0.16, -1.7);
  rightMainFloor.receiveShadow = true;
  root.add(rightMainFloor);

  const washroomFloor = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.05, 3.35), washroomFloorMat);
  washroomFloor.position.set(4.2, 0.165, 4.35);
  washroomFloor.receiveShadow = true;
  root.add(washroomFloor);

  // ============================================================================
  // 3. LEFT 40FT CONTAINER (X = -4.2, Z = -6.1..+6.1) -> BEDROOM 01 & BEDROOM 02
  // ============================================================================
  const leftContainer = new THREE.Group();
  root.add(leftContainer);

  // Steel base rails & corner posts
  const postGeo40 = new THREE.BoxGeometry(0.14, 2.9, 0.14);
  for (const px of [-5.36, -3.04]) {
    for (const pz of [-6.04, 6.04]) {
      const post = new THREE.Mesh(postGeo40, steelFrameMat);
      post.position.set(px, 1.59, pz);
      post.castShadow = true;
      leftContainer.add(post);
    }
  }
  addCornerCastings(leftContainer, -5.36, -3.04, 0.2, 3.0, -6.04, 6.04, steelFrameMat);

  // Lower cutaway outer wall (X = -5.4, Y = 0.14..1.45)
  const leftLowerWall = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.32, 12.1), containerWallMat);
  leftLowerWall.position.set(-5.38, 0.8, 0);
  leftLowerWall.castShadow = true;
  leftLowerWall.receiveShadow = true;
  leftContainer.add(leftLowerWall);

  // Interior warm wall lining on lower outer wall
  const leftLowerInner = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.28, 11.96), interiorWallMat);
  leftLowerInner.position.set(-5.31, 0.8, 0);
  leftLowerInner.receiveShadow = true;
  leftContainer.add(leftLowerInner);

  // Section cut cap on left lower wall
  const leftCutCap = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 12.1), sectionCapMat);
  leftCutCap.position.set(-5.35, 1.47, 0);
  leftContainer.add(leftCutCap);

  // Rear end wall (Z = -6.06) lower + upper
  const leftRearLower = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.32, 0.11), containerWallMat);
  leftRearLower.position.set(-4.2, 0.8, -6.06);
  leftRearLower.castShadow = true;
  leftContainer.add(leftRearLower);

  const leftRearCap = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.04, 0.14), sectionCapMat);
  leftRearCap.position.set(-4.2, 1.47, -6.06);
  leftContainer.add(leftRearCap);

  // Front end wall (Z = +6.06) low window sill + glass window
  const leftFrontSill = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.72, 0.11), containerWallMat);
  leftFrontSill.position.set(-4.2, 0.5, 6.06);
  leftFrontSill.castShadow = true;
  leftContainer.add(leftFrontSill);

  const leftFrontWindow = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.72, 0.04), glassMat);
  leftFrontWindow.position.set(-4.2, 1.22, 6.06);
  leftContainer.add(leftFrontWindow);

  // Partition wall between Bedroom 01 and Bedroom 02 (Z = 0.0)
  const leftPartition = new THREE.Mesh(new THREE.BoxGeometry(2.26, 2.05, 0.12), interiorWallMat);
  leftPartition.position.set(-4.18, 1.18, 0.0);
  leftPartition.castShadow = true;
  leftPartition.receiveShadow = true;
  leftContainer.add(leftPartition);

  // Inner hall-facing structural steel top beam & sliding glass door frames (X = -3.02)
  const leftInnerBeam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 12.16), steelFrameMat);
  leftInnerBeam.position.set(-3.02, 2.95, 0);
  leftInnerBeam.castShadow = true;
  leftContainer.add(leftInnerBeam);

  // Inner partition piers + sliding glass doors for Bedroom 01 & Bedroom 02
  const addSlidingDoorBay = (xPos: number, zCenter: number, width: number, isFrosted = false) => {
    const bay = new THREE.Group();
    const frameH = 2.45;
    // Top & bottom rail
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, width), steelFrameMat);
    railTop.position.set(xPos, 0.16 + frameH, zCenter);
    bay.add(railTop);
    const railBot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, width), steelFrameMat);
    railBot.position.set(xPos, 0.18, zCenter);
    bay.add(railBot);
    // Vertical mullions
    for (const dz of [-width / 2, 0, width / 2]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, frameH, 0.06), steelFrameMat);
      m.position.set(xPos, 0.16 + frameH / 2, zCenter + dz);
      m.castShadow = true;
      bay.add(m);
    }
    // Glass pane
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, frameH - 0.08, width - 0.08),
      isFrosted ? frostedGlassMat : glassMat,
    );
    pane.position.set(xPos, 0.16 + frameH / 2, zCenter);
    bay.add(pane);
    root.add(bay);
  };

  addSlidingDoorBay(-3.02, -2.5, 2.6);
  addSlidingDoorBay(-3.02, 2.5, 2.6);

  // Wall segments between sliding doors along X = -3.02
  for (const [zPos, len] of [
    [-4.95, 2.1],
    [0.0, 2.3],
    [4.95, 2.1],
  ]) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.35, len), interiorWallMat);
    seg.position.set(-3.02, 1.33, zPos);
    seg.castShadow = true;
    seg.receiveShadow = true;
    leftContainer.add(seg);
  }

  // Left container upper cutaway shell (hidden in cutaway, shown in full-shell)
  const leftUpperWall = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.56, 12.1), containerWallMat);
  leftUpperWall.position.set(-5.38, 2.24, 0);
  leftUpperWall.castShadow = true;
  cutawayUpperGroup.add(leftUpperWall);

  const leftRoof = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.12, 12.2), containerWallMat);
  leftRoof.position.set(-4.2, 3.04, 0);
  leftRoof.castShadow = true;
  leftRoof.receiveShadow = true;
  cutawayUpperGroup.add(leftRoof);

  // ============================================================================
  // 4. RIGHT 40FT CONTAINER (X = +4.2, Z = -6.1..+6.1) -> BED 03, KITCHEN, WASHROOM
  // ============================================================================
  const rightContainer = new THREE.Group();
  root.add(rightContainer);

  for (const px of [3.04, 5.36]) {
    for (const pz of [-6.04, 6.04]) {
      const post = new THREE.Mesh(postGeo40, steelFrameMat);
      post.position.set(px, 1.59, pz);
      post.castShadow = true;
      rightContainer.add(post);
    }
  }
  addCornerCastings(rightContainer, 3.04, 5.36, 0.2, 3.0, -6.04, 6.04, steelFrameMat);

  // Lower cutaway outer wall on right (X = +5.38, Y = 0.14..1.08) -> kept low at 1.08m so isometric view sees inside!
  const rightLowerWall = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.96, 12.1), containerWallMat);
  rightLowerWall.position.set(5.38, 0.62, 0);
  rightLowerWall.castShadow = true;
  rightLowerWall.receiveShadow = true;
  rightContainer.add(rightLowerWall);

  const rightLowerInner = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.92, 11.96), interiorWallMat);
  rightLowerInner.position.set(5.31, 0.62, 0);
  rightContainer.add(rightLowerInner);

  const rightCutCap = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 12.1), sectionCapMat);
  rightCutCap.position.set(5.35, 1.12, 0);
  rightContainer.add(rightCutCap);

  // Front wall (Z = +6.06) low cutaway + frosted washroom louver strip
  const rightFrontLower = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.96, 0.11), containerWallMat);
  rightFrontLower.position.set(4.2, 0.62, 6.06);
  rightFrontLower.castShadow = true;
  rightContainer.add(rightFrontLower);

  const rightFrontCap = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.04, 0.14), sectionCapMat);
  rightFrontCap.position.set(4.2, 1.12, 6.06);
  rightContainer.add(rightFrontCap);

  // Rear end wall (Z = -6.06) full height under 2nd floor container
  const rightRearWall = new THREE.Mesh(new THREE.BoxGeometry(2.38, 2.9, 0.11), containerWallMat);
  rightRearWall.position.set(4.2, 1.59, -6.06);
  rightRearWall.castShadow = true;
  rightContainer.add(rightRearWall);

  // Solid structural roof deck over Rear Bedroom 03 (Z = -6.1..-3.25) supporting the 2nd floor container
  const rightRearRoofDeck = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.12, 2.95), containerWallMat);
  rightRearRoofDeck.position.set(4.2, 3.04, -4.62);
  rightRearRoofDeck.castShadow = true;
  rightRearRoofDeck.receiveShadow = true;
  rightContainer.add(rightRearRoofDeck);

  // Interior partition walls in right container:
  // Partition 1: Bedroom 03 | Kitchen (Z = -1.7)
  const rightPart1 = new THREE.Mesh(new THREE.BoxGeometry(2.26, 2.1, 0.12), interiorWallMat);
  rightPart1.position.set(4.18, 1.2, -1.7);
  rightPart1.castShadow = true;
  rightPart1.receiveShadow = true;
  rightContainer.add(rightPart1);

  // Partition 2: Kitchen | Common Washroom (Z = +2.7)
  const rightPart2 = new THREE.Mesh(new THREE.BoxGeometry(2.26, 2.1, 0.12), interiorWallMat);
  rightPart2.position.set(4.18, 1.2, 2.7);
  rightPart2.castShadow = true;
  rightPart2.receiveShadow = true;
  rightContainer.add(rightPart2);

  // Inner hall-facing top steel beam (X = +3.02)
  const rightInnerBeam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 12.16), steelFrameMat);
  rightInnerBeam.position.set(3.02, 2.95, 0);
  rightInnerBeam.castShadow = true;
  rightContainer.add(rightInnerBeam);

  // Doors / openings on inner wall (X = +3.02)
  addSlidingDoorBay(3.02, -3.0, 2.0); // Bedroom 03 door
  addSlidingDoorBay(3.02, 3.5, 1.35, true); // Washroom frosted glass door

  // Kitchen open breakfast pass-through counter wall (X = +3.02, Z = -0.2..+2.2)
  const kitchenPassWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.92, 2.4), interiorWallMat);
  kitchenPassWall.position.set(3.02, 0.62, 1.0);
  kitchenPassWall.castShadow = true;
  rightContainer.add(kitchenPassWall);

  // Inner wall piers on X = +3.02
  for (const [zPos, len] of [
    [-5.05, 1.9],
    [-1.1, 1.8],
    [2.5, 0.6],
    [5.1, 1.8],
  ]) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.35, len), interiorWallMat);
    seg.position.set(3.02, 1.33, zPos);
    seg.castShadow = true;
    seg.receiveShadow = true;
    rightContainer.add(seg);
  }

  // Right container upper cutaway wall + front roof (hidden in cutaway, shown in full-shell)
  const rightUpperWall = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.92, 12.1), containerWallMat);
  rightUpperWall.position.set(5.38, 2.06, 0);
  rightUpperWall.castShadow = true;
  cutawayUpperGroup.add(rightUpperWall);

  const rightFrontRoof = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.12, 9.25), containerWallMat);
  rightFrontRoof.position.set(4.2, 3.04, 1.48);
  rightFrontRoof.castShadow = true;
  rightFrontRoof.receiveShadow = true;
  cutawayUpperGroup.add(rightFrontRoof);

  // ============================================================================
  // 5. DOUBLE-HEIGHT CENTRAL GLASS ROOF & PORTAL STEEL FRAMING
  // ============================================================================
  const atriumFrame = new THREE.Group();
  root.add(atriumFrame);

  const portalZPositions = [-6.04, -2.0, 2.0, 6.04];
  const colH = 2.55; // rises from Y=3.04 to Y=5.59
  for (const pz of portalZPositions) {
    // Left and right steel columns rising from container top beams
    for (const px of [-2.98, 2.98]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.14, colH, 0.14), steelFrameMat);
      col.position.set(px, 3.04 + colH / 2, pz);
      col.castShadow = true;
      atriumFrame.add(col);
    }
    // Transverse steel truss beam across central hall (pitched gently left-to-right for architectural interest)
    const beam = new THREE.Mesh(new THREE.BoxGeometry(6.14, 0.16, 0.14), steelFrameMat);
    beam.position.set(0, 5.56, pz);
    beam.rotation.z = -0.045;
    beam.castShadow = true;
    atriumFrame.add(beam);
  }

  // Longitudinal skylight ridge & eave steel purlins
  for (const px of [-2.98, -1.0, 1.0, 2.98]) {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 12.24), steelFrameMat);
    purlin.position.set(px, 5.62 - px * 0.045, 0);
    purlin.castShadow = true;
    atriumFrame.add(purlin);
  }

  // Central glass skylight roof panels (translucent glass panes between purlins)
  const skylightPane = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.04, 12.16), roofGlassMat);
  skylightPane.position.set(0, 5.67, 0);
  skylightPane.rotation.z = -0.045;
  skylightGlassGroup.add(skylightPane);

  // Front double-height sliding glass doors (Z = +6.06, X = -2.9..+2.9)
  const frontGlassDoors = new THREE.Group();
  root.add(frontGlassDoors);
  const doorHeight = 2.65;
  for (let i = -2; i <= 2; i++) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.07, doorHeight, 0.08), steelFrameMat);
    mullion.position.set(i * 1.45, 0.16 + doorHeight / 2, 6.06);
    mullion.castShadow = true;
    frontGlassDoors.add(mullion);
  }
  const frontDoorHeader = new THREE.Mesh(new THREE.BoxGeometry(5.96, 0.12, 0.12), steelFrameMat);
  frontDoorHeader.position.set(0, 0.16 + doorHeight, 6.06);
  frontGlassDoors.add(frontDoorHeader);

  const frontDoorGlass = new THREE.Mesh(new THREE.BoxGeometry(5.82, doorHeight - 0.1, 0.03), glassMat);
  frontDoorGlass.position.set(0, 0.16 + doorHeight / 2, 6.06);
  frontGlassDoors.add(frontDoorGlass);

  // Rear glass curtain wall (Z = -6.06)
  const rearDoorHeader = new THREE.Mesh(new THREE.BoxGeometry(5.96, 0.12, 0.12), steelFrameMat);
  rearDoorHeader.position.set(0, 0.16 + doorHeight, -6.06);
  frontGlassDoors.add(rearDoorHeader);
  for (let i = -2; i <= 2; i++) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.07, doorHeight, 0.08), steelFrameMat);
    mullion.position.set(i * 1.45, 0.16 + doorHeight / 2, -6.06);
    frontGlassDoors.add(mullion);
  }
  const rearDoorGlass = new THREE.Mesh(new THREE.BoxGeometry(5.82, doorHeight - 0.1, 0.03), glassMat);
  rearDoorGlass.position.set(0, 0.16 + doorHeight / 2, -6.06);
  frontGlassDoors.add(rearDoorGlass);

  // ============================================================================
  // 6. SECOND FLOOR: 15FT OFFSET STACKED CONTAINER (UPSTAIRS MEETING ROOM)
  //    X = +1.9..+6.5 (4.6m = 15ft), Z = -5.8..-3.3 (2.5m), Y = 3.16..5.76
  // ============================================================================
  const secondFloor = new THREE.Group();
  root.add(secondFloor);

  // Steel transfer I-beams supporting the offset container
  for (const bz of [-5.72, -3.38]) {
    const transferBeam = new THREE.Mesh(new THREE.BoxGeometry(4.76, 0.14, 0.14), steelFrameMat);
    transferBeam.position.set(4.2, 3.11, bz);
    transferBeam.castShadow = true;
    secondFloor.add(transferBeam);
  }

  // Two slender exterior steel pilotis columns on outer right edge (X = +6.42)
  for (const cz of [-5.72, -3.38]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 3.04, 16), steelFrameMat);
    col.position.set(6.42, 1.54, cz);
    col.castShadow = true;
    secondFloor.add(col);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), plinthMat);
    pad.position.set(6.42, 0.06, cz);
    pad.receiveShadow = true;
    secondFloor.add(pad);
  }

  // 15ft container floor deck & warm timber interior floor
  const topBase = new THREE.Mesh(new THREE.BoxGeometry(4.64, 0.08, 2.54), containerWallMat);
  topBase.position.set(4.2, 3.21, -4.55);
  topBase.castShadow = true;
  topBase.receiveShadow = true;
  secondFloor.add(topBase);

  const topTimberFloor = new THREE.Mesh(new THREE.BoxGeometry(4.46, 0.03, 2.36), timberFloorMat);
  topTimberFloor.position.set(4.2, 3.265, -4.55);
  topTimberFloor.receiveShadow = true;
  secondFloor.add(topTimberFloor);

  // Corner posts & castings for 15ft container
  const topPostGeo = new THREE.BoxGeometry(0.12, 2.55, 0.12);
  for (const px of [1.94, 6.46]) {
    for (const pz of [-5.76, -3.34]) {
      const p = new THREE.Mesh(topPostGeo, steelFrameMat);
      p.position.set(px, 4.5, pz);
      p.castShadow = true;
      secondFloor.add(p);
    }
  }
  addCornerCastings(secondFloor, 1.94, 6.46, 3.24, 5.72, -5.76, -3.34, steelFrameMat);

  // Rear & Left corrugated walls of 15ft container (cut cleanly to 1.65m in cutaway, full height in full-shell)
  const topRearLower = new THREE.Mesh(new THREE.BoxGeometry(4.56, 1.45, 0.1), containerWallMat);
  topRearLower.position.set(4.2, 3.96, -5.78);
  topRearLower.castShadow = true;
  secondFloor.add(topRearLower);

  const topRearCap = new THREE.Mesh(new THREE.BoxGeometry(4.56, 0.04, 0.14), sectionCapMat);
  topRearCap.position.set(4.2, 4.7, -5.78);
  secondFloor.add(topRearCap);

  const topLeftLower = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.45, 2.46), containerWallMat);
  topLeftLower.position.set(1.94, 3.96, -4.55);
  topLeftLower.castShadow = true;
  secondFloor.add(topLeftLower);

  // Front glass facade & sliding door opening onto the upper terrace (Z = -3.34)
  const topFrontGlass = new THREE.Mesh(new THREE.BoxGeometry(4.36, 2.25, 0.03), glassMat);
  topFrontGlass.position.set(4.2, 4.38, -3.34);
  secondFloor.add(topFrontGlass);

  for (const mx of [2.0, 3.45, 4.95, 6.4]) {
    const mul = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.35, 0.07), steelFrameMat);
    mul.position.set(mx, 4.42, -3.34);
    secondFloor.add(mul);
  }
  const topFrontHeader = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.08, 0.08), steelFrameMat);
  topFrontHeader.position.set(4.2, 5.62, -3.34);
  secondFloor.add(topFrontHeader);

  // Right-end glass door connecting to terrace landing (X = +6.46)
  const topRightGlass = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.25, 2.28), glassMat);
  topRightGlass.position.set(6.46, 4.38, -4.55);
  secondFloor.add(topRightGlass);

  // Upper cutaway walls & roof of 15ft container
  const topRearUpper = new THREE.Mesh(new THREE.BoxGeometry(4.56, 1.04, 0.1), containerWallMat);
  topRearUpper.position.set(4.2, 5.22, -5.78);
  cutawayUpperGroup.add(topRearUpper);

  const topLeftUpper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.04, 2.46), containerWallMat);
  topLeftUpper.position.set(1.94, 5.22, -4.55);
  cutawayUpperGroup.add(topLeftUpper);

  const topRoof = new THREE.Mesh(new THREE.BoxGeometry(4.66, 0.11, 2.58), containerWallMat);
  topRoof.position.set(4.2, 5.76, -4.55);
  topRoof.castShadow = true;
  topRoof.receiveShadow = true;
  cutawayUpperGroup.add(topRoof);

  // ============================================================================
  // 7. UPPER TERRACE LANDING & EXTERNAL SPIRAL STAIRS
  // ============================================================================
  const deckTimberMat = new THREE.MeshStandardMaterial({
    map: textures.deckColor,
    bumpMap: textures.timberBump,
    bumpScale: 0.015,
    roughness: 0.72,
    metalness: 0.04,
  });

  // Cantilevered upper landing balcony connecting Upstairs Meeting Room to Spiral Stairs
  const landingFrame = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.1, 2.5), steelFrameMat);
  landingFrame.position.set(6.3, 3.12, -2.08);
  landingFrame.castShadow = true;
  secondFloor.add(landingFrame);

  const landingDeck = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.04, 2.4), deckTimberMat);
  landingDeck.position.set(6.3, 3.19, -2.08);
  landingDeck.receiveShadow = true;
  secondFloor.add(landingDeck);

  // Steel support strut under upper landing
  const landingStrut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.1), steelFrameMat);
  landingStrut.position.set(7.05, 2.4, -2.25);
  landingStrut.rotation.x = Math.PI / 4;
  secondFloor.add(landingStrut);

  // Balcony steel posts & horizontal railing bars
  const railPosts: [number, number][] = [
    [5.46, -3.28],
    [5.46, -2.08],
    [5.46, -0.88],
    [6.3, -3.28],
    [7.14, -3.28],
    [7.14, -2.08],
    [7.14, -0.88],
  ];
  for (const [rx, rz] of railPosts) {
    const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.96, 10), steelFrameMat);
    rp.position.set(rx, 3.68, rz);
    secondFloor.add(rp);
  }
  // Top rails around terrace
  const railWest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 2.44), steelFrameMat);
  railWest.position.set(5.46, 4.16, -2.08);
  secondFloor.add(railWest);
  const railEast = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 2.44), steelFrameMat);
  railEast.position.set(7.14, 4.16, -2.08);
  secondFloor.add(railEast);

  // EXTERNAL SPIRAL STAIRS (Center at X = +6.85, Z = -0.75)
  const spiralGroup = new THREE.Group();
  const stairX = 6.85;
  const stairZ = -0.65;
  spiralGroup.position.set(stairX, 0, stairZ);
  root.add(spiralGroup);

  // Ground side-patio pad under spiral stairs
  const stairGroundPad = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.38, 0.14, 28), deckTimberMat);
  stairGroundPad.position.set(0, 0.07, 0);
  stairGroundPad.receiveShadow = true;
  spiralGroup.add(stairGroundPad);

  // Central structural steel mast
  const stairMast = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 4.1, 20), steelFrameMat);
  stairMast.position.set(0, 2.1, 0);
  stairMast.castShadow = true;
  spiralGroup.add(stairMast);

  const mastCap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 20), steelFrameMat);
  mastCap.position.set(0, 4.16, 0);
  spiralGroup.add(mastCap);

  // Build 14 fanned wedge-shaped hardwood treads + brackets + vertical balusters
  const treadCount = 14;
  const startAngle = Math.PI * 0.45;
  const sweepAngle = Math.PI * 1.48;
  const riser = (3.14 - 0.34) / treadCount;
  const handrailPoints: THREE.Vector3[] = [];

  // Custom wedge tread shape
  const treadShape = new THREE.Shape();
  const rInner = 0.11;
  const rOuter = 1.08;
  const halfAng = 0.21;
  treadShape.moveTo(Math.cos(-halfAng) * rInner, Math.sin(-halfAng) * rInner);
  treadShape.lineTo(Math.cos(-halfAng) * rOuter, Math.sin(-halfAng) * rOuter);
  treadShape.absarc(0, 0, rOuter, -halfAng, halfAng, false);
  treadShape.lineTo(Math.cos(halfAng) * rInner, Math.sin(halfAng) * rInner);
  treadShape.absarc(0, 0, rInner, halfAng, -halfAng, true);

  const treadGeo = new THREE.ExtrudeGeometry(treadShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  treadGeo.rotateX(-Math.PI / 2);

  const bracketGeo = new THREE.BoxGeometry(0.9, 0.035, 0.05);
  const balusterGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.96, 8);

  for (let i = 0; i < treadCount; i++) {
    const t = i / (treadCount - 1);
    const angle = startAngle + t * sweepAngle;
    const y = 0.34 + i * riser;

    const treadHolder = new THREE.Group();
    treadHolder.position.y = y;
    treadHolder.rotation.y = angle;

    const treadMesh = new THREE.Mesh(treadGeo, timberFloorMat);
    treadMesh.castShadow = true;
    treadMesh.receiveShadow = true;
    treadHolder.add(treadMesh);

    const bracket = new THREE.Mesh(bracketGeo, steelFrameMat);
    bracket.position.set(0.55, -0.025, 0);
    treadHolder.add(bracket);

    const baluster = new THREE.Mesh(balusterGeo, steelFrameMat);
    baluster.position.set(rOuter - 0.05, 0.5, 0);
    baluster.castShadow = true;
    treadHolder.add(baluster);

    spiralGroup.add(treadHolder);

    // Record world-local handrail spline point
    const hrRadius = rOuter - 0.05;
    handrailPoints.push(
      new THREE.Vector3(
        Math.cos(-angle) * hrRadius,
        y + 0.98,
        Math.sin(-angle) * hrRadius,
      ),
    );
  }

  // Continuous helical handrail
  const handrailCurve = new THREE.CatmullRomCurve3(handrailPoints);
  const handrailGeo = new THREE.TubeGeometry(handrailCurve, 48, 0.028, 10, false);
  const handrailMesh = new THREE.Mesh(handrailGeo, steelFrameMat);
  handrailMesh.castShadow = true;
  spiralGroup.add(handrailMesh);

  // ============================================================================
  // 8. INTERACTIVE ROOM HITBOXES FOR CLICK-TO-INSPECT
  // ============================================================================
  const hitboxes: Array<[string, number, number, number, number, number, number]> = [
    ['office-living', 5.8, 2.2, 11.8, 0.0, 1.2, 0.0],
    ['bedroom-01', 2.3, 2.0, 5.8, -4.2, 1.1, -3.1],
    ['bedroom-02', 2.3, 2.0, 5.8, -4.2, 1.1, 3.1],
    ['bedroom-03', 2.3, 2.0, 4.2, 4.2, 1.1, -3.9],
    ['pantry-kitchen', 2.3, 2.0, 4.2, 4.2, 1.1, 0.5],
    ['common-washroom', 2.3, 2.0, 3.2, 4.2, 1.1, 4.4],
    ['upstairs-meeting', 4.6, 2.4, 2.5, 4.2, 4.4, -4.55],
    ['spiral-stairs', 2.5, 3.8, 2.5, stairX, 2.0, stairZ],
  ];

  for (const [id, w, h, d, x, y, z] of hitboxes) {
    const hb = createRoomZoneHitbox(id, w, h, d, x, y, z);
    root.add(hb);
    interactiveMeshes.push(hb);
  }

  return {
    group: root,
    interactiveMeshes,
    setContainerFinish: (finish: ContainerFinish) => {
      const cfg = CONTAINER_FINISH_COLORS[finish];
      containerWallMat.color.set(cfg.hex);
      steelFrameMat.color.set(cfg.trimHex);
    },
    updateCutaway: (progress: number, mode: CutawayMode) => {
      // progress: 0 = full shell, 1 = open cutaway
      const showUpper = progress < 0.55;
      cutawayUpperGroup.visible = showUpper;
      cutawayUpperGroup.position.y = (1 - (showUpper ? 1 : 0)) * 0.5;
      if (mode === 'full-shell') {
        cutawayUpperGroup.visible = true;
        roofGlassMat.opacity = 0.36;
      } else if (mode === 'glass-roof') {
        cutawayUpperGroup.visible = false;
        roofGlassMat.opacity = 0.38;
      } else {
        cutawayUpperGroup.visible = false;
        roofGlassMat.opacity = 0.13;
      }
    },
  };
}
