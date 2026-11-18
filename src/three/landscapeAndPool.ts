import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';

export interface LandscapeHandle {
  group: THREE.Group;
  setBlueprintVisible: (visible: boolean) => void;
  interactiveMeshes: THREE.Object3D[];
}

function buildTropicalPalm(
  trunkMat: THREE.Material,
  frondMat: THREE.Material,
  height: number,
  leanX: number,
  leanZ: number,
): THREE.Group {
  const palm = new THREE.Group();
  const segments = 7;
  let curX = 0;
  let curY = 0;
  let curZ = 0;

  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const segH = height / segments;
    const rBot = 0.16 * (1 - t * 0.45);
    const rTop = 0.16 * (1 - (t + 1 / segments) * 0.45);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, segH + 0.04, 10), trunkMat);

    const dx = (leanX / segments) * (0.4 + t * 1.1);
    const dz = (leanZ / segments) * (0.4 + t * 1.1);
    seg.position.set(curX + dx * 0.5, curY + segH * 0.5, curZ + dz * 0.5);
    seg.rotation.z = -Math.atan2(dx, segH);
    seg.rotation.x = Math.atan2(dz, segH);
    seg.castShadow = true;
    palm.add(seg);

    curX += dx;
    curY += segH;
    curZ += dz;
  }

  // Crown cluster
  const crown = new THREE.Group();
  crown.position.set(curX, curY, curZ);
  palm.add(crown);

  const frondCount = 9;
  for (let f = 0; f < frondCount; f++) {
    const yaw = (f / frondCount) * Math.PI * 2 + (f % 2) * 0.2;
    const pitch = 0.25 + (f % 3) * 0.18;
    const frondHolder = new THREE.Group();
    frondHolder.rotation.y = yaw;
    frondHolder.rotation.z = -pitch;

    // Arched frond made of 3 tapered leaf segments
    for (let s = 0; s < 3; s++) {
      const len = 0.85 - s * 0.16;
      const w = 0.34 - s * 0.08;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(len, 0.025, w), frondMat);
      blade.position.set(0.45 + s * 0.72, -s * s * 0.14, 0);
      blade.rotation.z = -s * 0.26;
      blade.castShadow = true;
      frondHolder.add(blade);
    }
    crown.add(frondHolder);
  }

  return palm;
}

function buildSunLounger(
  teakMat: THREE.Material,
  cushionMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 1.92), teakMat);
  frame.position.set(0, 0.22, 0);
  frame.castShadow = true;
  g.add(frame);

  for (const [lx, lz] of [
    [-0.32, -0.82],
    [0.32, -0.82],
    [-0.32, 0.82],
    [0.32, 0.82],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), teakMat);
    leg.position.set(lx, 0.1, lz);
    g.add(leg);
  }

  const cushionBase = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 1.24), cushionMat);
  cushionBase.position.set(0, 0.29, 0.28);
  cushionBase.castShadow = true;
  g.add(cushionBase);

  const cushionBack = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.64), cushionMat);
  cushionBack.position.set(0, 0.46, -0.62);
  cushionBack.rotation.x = 0.55;
  cushionBack.castShadow = true;
  g.add(cushionBack);

  return g;
}

export function buildLandscapeAndPool(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): LandscapeHandle {
  const root = new THREE.Group();
  const interactiveMeshes: THREE.Object3D[] = [];

  // 1. EXTENDED GROUND PLANE + BLUEPRINT GRID
  const blueprintMat = new THREE.MeshStandardMaterial({
    map: textures.blueprintGround,
    roughness: 0.94,
    metalness: 0.02,
  });

  const plainLawnMat = new THREE.MeshStandardMaterial({
    color: 0x26372d,
    roughness: 0.94,
    metalness: 0.02,
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), blueprintMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  root.add(ground);

  // Subtle architectural footprint blueprint lines around house & pool
  const blueprintLines = new THREE.Group();
  root.add(blueprintLines);
  const bpLineMat = new THREE.LineBasicMaterial({
    color: 0xaedcf0,
    transparent: true,
    opacity: 0.36,
  });
  const rectPts = (x0: number, z0: number, x1: number, z1: number, y = 0.01) => [
    new THREE.Vector3(x0, y, z0),
    new THREE.Vector3(x1, y, z0),
    new THREE.Vector3(x1, y, z1),
    new THREE.Vector3(x0, y, z1),
    new THREE.Vector3(x0, y, z0),
  ];
  const siteOutline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(rectPts(-8.6, -8.2, 8.6, 15.2)),
    bpLineMat,
  );
  blueprintLines.add(siteOutline);

  // ============================================================================
  // 2. FRONT TIMBER PATIO DECK (X = -5.6..+7.4, Z = +6.1..+9.3)
  // ============================================================================
  const deckMat = new THREE.MeshStandardMaterial({
    map: textures.deckColor,
    bumpMap: textures.timberBump,
    bumpScale: 0.015,
    roughness: 0.72,
    metalness: 0.04,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e242a,
    roughness: 0.4,
    metalness: 0.8,
  });
  const travertineMat = new THREE.MeshStandardMaterial({
    map: textures.travertineColor,
    roughness: 0.78,
    metalness: 0.02,
  });

  const patioDeck = new THREE.Mesh(new THREE.BoxGeometry(13.0, 0.14, 3.2), deckMat);
  patioDeck.position.set(0.9, 0.07, 7.7);
  patioDeck.receiveShadow = true;
  patioDeck.castShadow = true;
  root.add(patioDeck);

  // Outdoor Patio Dining Table & 4 Chairs (X = -3.1, Z = 7.7)
  const patioTable = new THREE.Group();
  patioTable.position.set(-3.1, 0.14, 7.7);
  root.add(patioTable);

  const ptTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.95), deckMat);
  ptTop.position.y = 0.72;
  ptTop.castShadow = true;
  patioTable.add(ptTop);
  for (const [lx, lz] of [
    [-0.72, -0.38],
    [0.72, -0.38],
    [-0.72, 0.38],
    [0.72, 0.38],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.05), darkSteelMat);
    leg.position.set(lx, 0.36, lz);
    patioTable.add(leg);
  }
  for (const [cx, cz, ry] of [
    [-0.45, 0.68, Math.PI],
    [0.45, 0.68, Math.PI],
    [-0.45, -0.68, 0],
    [0.45, -0.68, 0],
  ]) {
    const c = new THREE.Group();
    c.position.set(cx, 0, cz);
    c.rotation.y = ry;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), deckMat);
    seat.position.y = 0.44;
    seat.castShadow = true;
    c.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.04), deckMat);
    back.position.set(0, 0.64, -0.19);
    c.add(back);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.38), darkSteelMat);
    base.position.y = 0.21;
    base.scale.set(0.15, 1, 0.15);
    c.add(base);
    patioTable.add(c);
  }

  // Side-patio stepping stones connecting Spiral Stairs (X=6.85, Z=-0.65) to front patio (Z=6.1)
  for (let i = 0; i < 6; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.68), travertineMat);
    step.position.set(6.75, 0.03, 0.75 + i * 0.95);
    step.receiveShadow = true;
    root.add(step);
  }

  // ============================================================================
  // 3. RECESSED TURQUOISE SWIMMING POOL & TRAVERTINE COPING
  //    Pool interior: X = -1.6..+4.8 (6.4m), Z = +9.8..+13.2 (3.4m)
  // ============================================================================
  // Frame the pool opening with 4 travertine terrace slabs (Y = 0.0..0.10)
  const deckParts: Array<[number, number, number, number]> = [
    // [xCenter, zCenter, width, depth]
    [-3.6, 11.85, 4.0, 5.1], // West lounger terrace (X=-5.6..-1.6, Z=9.3..14.4)
    [5.6, 11.85, 1.6, 5.1], // East pool coping terrace (X=+4.8..+6.4, Z=9.3..14.4)
    [1.6, 9.55, 6.4, 0.5], // North pool coping (Z=9.3..9.8)
    [1.6, 13.8, 6.4, 1.2], // South pool coping (Z=13.2..14.4)
  ];
  for (const [dx, dz, dw, dd] of deckParts) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(dw, 0.1, dd), travertineMat);
    slab.position.set(dx, 0.05, dz);
    slab.receiveShadow = true;
    slab.castShadow = true;
    root.add(slab);
  }

  const poolMosaicMat = new THREE.MeshStandardMaterial({
    map: textures.poolMosaicColor,
    roughness: 0.35,
    metalness: 0.05,
  });

  // Pool basin floor & 4 mosaic walls
  const poolFloor = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.08, 3.4), poolMosaicMat);
  poolFloor.position.set(1.6, -0.68, 11.5);
  poolFloor.receiveShadow = true;
  root.add(poolFloor);

  const poolWalls: Array<[number, number, number, number]> = [
    [1.6, 9.78, 6.48, 0.08],
    [1.6, 13.22, 6.48, 0.08],
    [-1.62, 11.5, 0.08, 3.44],
    [4.82, 11.5, 0.08, 3.44],
  ];
  for (const [wx, wz, ww, wd] of poolWalls) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, 0.76, wd), poolMosaicMat);
    wall.position.set(wx, -0.32, wz);
    wall.receiveShadow = true;
    root.add(wall);
  }

  // Underwater entry steps (West end of pool)
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 1.4), poolMosaicMat);
    step.position.set(-1.42 + s * 0.36, -0.14 - s * 0.18, 10.55);
    step.receiveShadow = true;
    root.add(step);
  }

  // Shimmering turquoise pool water surface
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x3ad2e6,
    roughness: 0.08,
    metalness: 0.05,
    normalMap: textures.waterNormal,
    normalScale: new THREE.Vector2(0.32, 0.32),
    transparent: true,
    opacity: isSoftwareGl ? 0.62 : 0.72,
    ior: 1.33,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    depthWrite: false,
  });
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.36, 3.36), waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(1.6, 0.04, 11.5);
  root.add(waterMesh);

  // Two teak sun loungers + umbrella on west pool deck (X = -3.7)
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe0, roughness: 0.9 });
  const lounger1 = buildSunLounger(deckMat, cushionMat);
  lounger1.position.set(-3.65, 0.1, 10.6);
  lounger1.rotation.y = Math.PI / 2;
  root.add(lounger1);

  const lounger2 = buildSunLounger(deckMat, cushionMat);
  lounger2.position.set(-3.65, 0.1, 12.1);
  lounger2.rotation.y = Math.PI / 2;
  root.add(lounger2);

  // Pool-patio clickable hitbox
  const poolHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(12.2, 0.8, 8.2),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  poolHitbox.position.set(0.8, 0.4, 10.2);
  poolHitbox.userData.roomId = 'pool-patio';
  root.add(poolHitbox);
  interactiveMeshes.push(poolHitbox);

  // ============================================================================
  // 4. TROPICAL GARDEN SURROUNDING THE HOUSE
  // ============================================================================
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e553e, roughness: 0.92 });
  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x3b7a47,
    roughness: 0.62,
    metalness: 0.02,
  });

  // Framing tropical palms (carefully placed around perimeter so interior cutaway stays 100% clear!)
  const palmPlacements: Array<[number, number, number, number, number]> = [
    [-8.2, -6.8, 5.8, -1.1, -0.6],
    [-8.8, 2.8, 5.2, -1.2, 0.4],
    [-7.6, 11.8, 4.9, -0.8, 0.9],
    [8.6, -7.2, 6.2, 1.0, -0.8],
    [9.2, 6.8, 5.4, 1.1, 0.6],
    [-2.8, -8.6, 5.6, -0.5, -1.1],
    [3.4, -8.8, 5.0, 0.6, -0.9],
  ];
  for (const [px, pz, ph, lx, lz] of palmPlacements) {
    const palm = buildTropicalPalm(trunkMat, frondMat, ph, lx, lz);
    palm.position.set(px, 0, pz);
    root.add(palm);
  }

  // Instanced tropical bushes & ferns around foundation and pool perimeter
  const bushGeo = new THREE.DodecahedronGeometry(0.45, 1);
  const bushMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // tinted per-instance via setColorAt
    roughness: 0.78,
    metalness: 0.02,
  });

  const bushCoords: Array<[number, number]> = [
    [-6.6, -6.6], [-6.8, -4.8], [-6.6, -2.5], [-6.7, 0.5], [-6.6, 3.6], [-6.7, 6.0],
    [-6.8, 8.8], [-6.6, 11.4], [-6.5, 13.8],
    [6.5, -6.8], [7.8, -4.5], [8.2, -2.2], [6.6, 2.2], [6.5, 5.0], [7.2, 8.8], [7.2, 11.6], [7.0, 14.0],
    [-4.8, -7.5], [-2.2, -7.6], [0.4, -7.5], [3.2, -7.6], [5.8, -7.5],
    [-3.8, 15.0], [-1.0, 15.1], [2.2, 15.0], [5.2, 15.1],
  ];

  const bushInstanced = new THREE.InstancedMesh(bushGeo, bushMat, bushCoords.length);
  bushInstanced.castShadow = true;
  bushInstanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  const greens = [0x2d5e38, 0x3b7242, 0x4b8247, 0x264f31];
  bushCoords.forEach(([bx, bz], idx) => {
    const scaleVar = 0.82 + ((idx * 37) % 10) * 0.04;
    dummy.position.set(bx, 0.25 * scaleVar, bz);
    dummy.rotation.set((idx % 3) * 0.2, idx * 0.8, 0);
    dummy.scale.set(1.25 * scaleVar, 0.78 * scaleVar, 1.15 * scaleVar);
    dummy.updateMatrix();
    bushInstanced.setMatrixAt(idx, dummy.matrix);
    c.setHex(greens[idx % greens.length]);
    bushInstanced.setColorAt(idx, c);
  });
  bushInstanced.instanceMatrix.needsUpdate = true;
  if (bushInstanced.instanceColor) bushInstanced.instanceColor.needsUpdate = true;
  bushInstanced.computeBoundingSphere();
  root.add(bushInstanced);

  // Decorative bamboo cluster along rear-left & rear-right garden perimeter
  const bambooGeo = new THREE.CylinderGeometry(0.045, 0.055, 3.2, 8);
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x5c8044, roughness: 0.55 });
  const bambooPositions: Array<[number, number, number]> = [];
  for (let i = 0; i < 12; i++) {
    bambooPositions.push([-7.4 + (i % 3) * 0.24, -6.2 + Math.floor(i / 3) * 0.4, 2.8 + (i % 4) * 0.3]);
    bambooPositions.push([7.6 + (i % 3) * 0.24, 3.5 + Math.floor(i / 3) * 0.45, 2.6 + (i % 4) * 0.35]);
  }
  const bambooInst = new THREE.InstancedMesh(bambooGeo, bambooMat, bambooPositions.length);
  bambooInst.castShadow = true;
  bambooPositions.forEach(([x, z, h], idx) => {
    dummy.position.set(x, h * 0.5, z);
    dummy.rotation.set(((idx % 3) - 1) * 0.04, 0, ((idx % 5) - 2) * 0.03);
    dummy.scale.set(1, h / 3.2, 1);
    dummy.updateMatrix();
    bambooInst.setMatrixAt(idx, dummy.matrix);
  });
  bambooInst.instanceMatrix.needsUpdate = true;
  bambooInst.computeBoundingSphere();
  root.add(bambooInst);

  return {
    group: root,
    interactiveMeshes,
    setBlueprintVisible: (visible: boolean) => {
      ground.material = visible ? blueprintMat : plainLawnMat;
      blueprintLines.visible = visible;
    },
  };
}
