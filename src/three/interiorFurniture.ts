import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';

function createStickyBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f5f4ef';
  ctx.fillRect(0, 0, 512, 320);

  // Subtle grid dots
  ctx.fillStyle = 'rgba(100,116,139,0.22)';
  for (let x = 24; x < 500; x += 24) {
    for (let y = 24; y < 300; y += 24) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Architectural flow sketch lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 42, 170, 96);
  ctx.beginPath();
  ctx.moveTo(206, 90);
  ctx.lineTo(270, 90);
  ctx.stroke();
  ctx.strokeRect(270, 42, 190, 96);

  // Colorful sticky notes
  const notes = [
    { x: 46, y: 175, c: '#f59e0b' },
    { x: 112, y: 178, c: '#38bdf8' },
    { x: 176, y: 172, c: '#fb7185' },
    { x: 245, y: 180, c: '#34d399' },
    { x: 315, y: 175, c: '#fbbf24' },
    { x: 382, y: 182, c: '#a78bfa' },
  ];
  for (const n of notes) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(n.x + 3, n.y + 4, 48, 48);
    ctx.fillStyle = n.c;
    ctx.fillRect(n.x, n.y, 48, 48);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildChair(
  oakMat: THREE.Material,
  steelMat: THREE.Material,
  fabricMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.016, 0.014, 0.44, 8);
  for (const [lx, lz] of [
    [-0.18, -0.18],
    [0.18, -0.18],
    [-0.18, 0.18],
    [0.18, 0.18],
  ]) {
    const leg = new THREE.Mesh(legGeo, steelMat);
    leg.position.set(lx, 0.22, lz);
    leg.castShadow = true;
    g.add(leg);
  }
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), fabricMat);
  seat.position.set(0, 0.45, 0);
  seat.castShadow = true;
  g.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.045), oakMat);
  back.position.set(0, 0.65, -0.19);
  back.rotation.x = -0.1;
  back.castShadow = true;
  g.add(back);
  return g;
}

function buildBed(
  width: number,
  length: number,
  oakMat: THREE.Material,
  linenMat: THREE.Material,
  blanketMat: THREE.Material,
  pillowMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  // Timber frame
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, length), oakMat);
  base.position.set(0, 0.14, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.12, 8);
  for (const [lx, lz] of [
    [-width / 2 + 0.08, -length / 2 + 0.08],
    [width / 2 - 0.08, -length / 2 + 0.08],
    [-width / 2 + 0.08, length / 2 - 0.08],
    [width / 2 - 0.08, length / 2 - 0.08],
  ]) {
    const leg = new THREE.Mesh(legGeo, oakMat);
    leg.position.set(lx, 0.06, lz);
    g.add(leg);
  }

  // Headboard
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.78, 0.08), oakMat);
  headboard.position.set(0, 0.48, -length / 2 + 0.04);
  headboard.castShadow = true;
  g.add(headboard);

  // Mattress
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(width - 0.08, 0.22, length - 0.12), linenMat);
  mattress.position.set(0, 0.34, 0.04);
  mattress.castShadow = true;
  mattress.receiveShadow = true;
  g.add(mattress);

  // Folded throw blanket
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, 0.05, length * 0.46), blanketMat);
  blanket.position.set(0, 0.44, length * 0.24);
  blanket.castShadow = true;
  g.add(blanket);

  // Two pillows
  const pillowCount = width > 1.25 ? 2 : 1;
  for (let i = 0; i < pillowCount; i++) {
    const px = pillowCount === 2 ? (i === 0 ? -width * 0.22 : width * 0.22) : 0;
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.11, 0.34), pillowMat);
    pillow.position.set(px, 0.49, -length / 2 + 0.28);
    pillow.rotation.x = 0.16;
    pillow.castShadow = true;
    g.add(pillow);
  }

  return g;
}

function buildIndoorPlant(
  potMat: THREE.Material,
  leafMat: THREE.Material,
  stemMat: THREE.Material,
  scale = 1,
): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.34, 14), potMat);
  pot.position.y = 0.17;
  pot.castShadow = true;
  g.add(pot);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.04, 12),
    new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.95 }),
  );
  soil.position.y = 0.33;
  g.add(soil);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.55, 8), stemMat);
  stem.position.y = 0.58;
  g.add(stem);

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), leafMat);
    leaf.scale.set(1.2, 0.28, 0.75);
    leaf.position.set(Math.cos(a) * 0.15, 0.62 + (i % 3) * 0.12, Math.sin(a) * 0.15);
    leaf.rotation.y = -a;
    leaf.rotation.z = 0.35;
    leaf.castShadow = true;
    g.add(leaf);
  }

  g.scale.setScalar(scale);
  return g;
}

export function buildInteriorFurniture(textures: ProceduralTextureSet): THREE.Group {
  const root = new THREE.Group();

  // Curated material palette (distinct roughness & metalness contrast)
  const oakMat = new THREE.MeshStandardMaterial({
    map: textures.timberColor,
    roughness: 0.58,
    metalness: 0.04,
  });
  const darkWalnutMat = new THREE.MeshStandardMaterial({
    color: 0x5d4029,
    roughness: 0.54,
    metalness: 0.05,
  });
  const blackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1d2228,
    roughness: 0.34,
    metalness: 0.85,
  });
  const brushedSteelMat = new THREE.MeshStandardMaterial({
    color: 0xc2c9cf,
    roughness: 0.26,
    metalness: 0.9,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4a656,
    roughness: 0.24,
    metalness: 0.9,
  });
  const oatmealFabricMat = new THREE.MeshStandardMaterial({
    color: 0xd9d2c5,
    roughness: 0.92,
    metalness: 0.0,
  });
  const charcoalFabricMat = new THREE.MeshStandardMaterial({
    color: 0x3b4248,
    roughness: 0.9,
    metalness: 0.0,
  });
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xb55d42,
    roughness: 0.85,
    metalness: 0.02,
  });
  const sageTextilesMat = new THREE.MeshStandardMaterial({
    color: 0x627c68,
    roughness: 0.9,
    metalness: 0.0,
  });
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xf0ede6,
    roughness: 0.92,
    metalness: 0.0,
  });
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xf6f6f2,
    roughness: 0.18,
    metalness: 0.05,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x8f5232,
    roughness: 0.48,
    metalness: 0.05,
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x121820,
    roughness: 0.16,
    metalness: 0.25,
    emissive: 0x1a3044,
    emissiveIntensity: 0.45,
  });
  const plantLeafMat = new THREE.MeshStandardMaterial({
    color: 0x3d6e47,
    roughness: 0.65,
    metalness: 0.02,
  });
  const rugMat = new THREE.MeshStandardMaterial({
    map: textures.rugColor,
    roughness: 0.95,
    metalness: 0.0,
  });
  const warmBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff1d6,
    emissive: 0xffcc80,
    emissiveIntensity: 1.1,
    roughness: 0.3,
  });

  const floorY = 0.18;

  // ============================================================================
  // 1. OFFICE & LIVING AREA (Central Double-Height Hall)
  // ============================================================================
  // Long Startup Work Desk (3.6m x 1.15m) at (0.15, floorY, -3.1)
  const workDeskGroup = new THREE.Group();
  workDeskGroup.position.set(0.15, floorY, -3.1);
  root.add(workDeskGroup);

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.06, 1.18), oakMat);
  deskTop.position.set(0, 0.74, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  workDeskGroup.add(deskTop);

  // Steel trestle legs
  for (const lx of [-1.55, 0, 1.55]) {
    for (const lz of [-0.46, 0.46]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.05), blackSteelMat);
      leg.position.set(lx, 0.36, lz);
      leg.castShadow = true;
      workDeskGroup.add(leg);
    }
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.96), blackSteelMat);
    cross.position.set(lx, 0.15, 0);
    workDeskGroup.add(cross);
  }

  // 4 dual/wide workstation monitors & laptops on long desk
  for (const [mx, mz, rotY] of [
    [-1.1, -0.22, 0.08],
    [0.0, -0.22, 0],
    [1.1, -0.22, -0.08],
    [-0.55, 0.24, Math.PI],
    [0.65, 0.24, Math.PI],
  ]) {
    const mon = new THREE.Group();
    mon.position.set(mx, 0.77, mz);
    mon.rotation.y = rotY;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.16, 8), blackSteelMat);
    stand.position.y = 0.08;
    mon.add(stand);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.32, 0.025), screenMat);
    panel.position.y = 0.24;
    panel.castShadow = true;
    mon.add(panel);
    workDeskGroup.add(mon);
  }

  // 6 ergonomic chairs around the long startup desk
  for (const cx of [-1.1, 0, 1.1]) {
    const c1 = buildChair(oakMat, blackSteelMat, charcoalFabricMat);
    c1.position.set(cx, 0, 0.85);
    c1.rotation.y = Math.PI;
    workDeskGroup.add(c1);

    const c2 = buildChair(oakMat, blackSteelMat, charcoalFabricMat);
    c2.position.set(cx, 0, -0.85);
    workDeskGroup.add(c2);
  }

  // Brainstorm Area (Freestanding Whiteboard + Stools + Credenza) at (-1.7, floorY, 0.2)
  const brainstormGroup = new THREE.Group();
  brainstormGroup.position.set(-1.75, floorY, 0.2);
  brainstormGroup.rotation.y = 0.42;
  root.add(brainstormGroup);

  const wbFrame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.45, 0.06), blackSteelMat);
  wbFrame.position.set(0, 1.15, 0);
  wbFrame.castShadow = true;
  brainstormGroup.add(wbFrame);

  for (const lx of [-0.78, 0.78]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.56), blackSteelMat);
    foot.position.set(lx, 0.025, 0);
    brainstormGroup.add(foot);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.85, 0.05), blackSteelMat);
    post.position.set(lx, 0.94, 0);
    brainstormGroup.add(post);
  }

  const wbTex = createStickyBoardTexture();
  const wbSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(1.52, 1.15),
    new THREE.MeshStandardMaterial({ map: wbTex, roughness: 0.4, metalness: 0.02 }),
  );
  wbSurface.position.set(0, 1.18, 0.035);
  brainstormGroup.add(wbSurface);

  // Two drafting stools in front of whiteboard
  for (const sx of [-0.4, 0.45]) {
    const stool = new THREE.Group();
    stool.position.set(sx, 0, 0.88);
    const sSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), oakMat);
    sSeat.position.y = 0.56;
    sSeat.castShadow = true;
    stool.add(sSeat);
    const sBase = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.2, 0.54, 12), blackSteelMat);
    sBase.position.y = 0.27;
    stool.add(sBase);
    brainstormGroup.add(stool);
  }

  // Living Lounge Area (Front Central Hall: Z = +2.2..+5.0)
  const loungeRug = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.016, 2.9), rugMat);
  loungeRug.position.set(0.1, floorY + 0.008, 3.4);
  loungeRug.receiveShadow = true;
  root.add(loungeRug);

  // L-shaped Sofa
  const sofaGroup = new THREE.Group();
  sofaGroup.position.set(-0.35, floorY, 2.7);
  root.add(sofaGroup);

  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.24, 0.92), oakMat);
  sofaBase.position.set(0, 0.2, 0);
  sofaBase.castShadow = true;
  sofaGroup.add(sofaBase);

  const sofaChaiseBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.24, 1.75), oakMat);
  sofaChaiseBase.position.set(-0.82, 0.2, 0.42);
  sofaChaiseBase.castShadow = true;
  sofaGroup.add(sofaChaiseBase);

  const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.2, 0.84), oatmealFabricMat);
  sofaSeat.position.set(0, 0.41, 0.02);
  sofaSeat.castShadow = true;
  sofaGroup.add(sofaSeat);

  const sofaChaiseSeat = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.2, 1.66), oatmealFabricMat);
  sofaChaiseSeat.position.set(-0.82, 0.41, 0.42);
  sofaChaiseSeat.castShadow = true;
  sofaGroup.add(sofaChaiseSeat);

  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.48, 0.18), oatmealFabricMat);
  sofaBack.position.set(0, 0.65, -0.36);
  sofaBack.castShadow = true;
  sofaGroup.add(sofaBack);

  const sofaArmL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.92), oatmealFabricMat);
  sofaArmL.position.set(-1.22, 0.55, 0);
  sofaGroup.add(sofaArmL);

  const sofaArmR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.92), oatmealFabricMat);
  sofaArmR.position.set(1.22, 0.55, 0);
  sofaGroup.add(sofaArmR);

  // Accent throw pillows on sofa
  for (const [px, pz, mat] of [
    [-0.95, -0.18, terracottaMat],
    [0.05, -0.18, sageTextilesMat],
    [0.95, -0.18, terracottaMat],
  ] as Array<[number, number, THREE.Material]>) {
    const tp = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.12), mat);
    tp.position.set(px, 0.64, pz);
    tp.rotation.x = -0.2;
    tp.rotation.z = 0.08;
    sofaGroup.add(tp);
  }

  // Timber Coffee Table
  const coffeeTable = new THREE.Group();
  coffeeTable.position.set(0.35, floorY, 3.85);
  root.add(coffeeTable);
  const ctTop = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 24), darkWalnutMat);
  ctTop.scale.set(1.35, 1, 0.85);
  ctTop.position.y = 0.38;
  ctTop.castShadow = true;
  ctTop.receiveShadow = true;
  coffeeTable.add(ctTop);
  const ctBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.36, 16), blackSteelMat);
  ctBase.position.y = 0.18;
  coffeeTable.add(ctBase);

  // Leather Accent Armchair
  const armchair = new THREE.Group();
  armchair.position.set(1.85, floorY, 3.6);
  armchair.rotation.y = -0.75;
  root.add(armchair);
  const acSeat = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.18, 0.72), leatherMat);
  acSeat.position.y = 0.36;
  acSeat.castShadow = true;
  armchair.add(acSeat);
  const acBack = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.44, 0.16), leatherMat);
  acBack.position.set(0, 0.62, -0.28);
  acBack.rotation.x = -0.14;
  armchair.add(acBack);
  const acFrame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.26, 0.76), oakMat);
  acFrame.position.y = 0.16;
  armchair.add(acFrame);

  // Fiddle-leaf indoor plant in central hall
  const hallPlant = buildIndoorPlant(terracottaMat, plantLeafMat, darkWalnutMat, 1.25);
  hallPlant.position.set(-2.35, floorY, 4.9);
  root.add(hallPlant);

  // ============================================================================
  // 2. BEDROOM 01 (Left Container Rear: X = -4.2, Z = -6.0..-0.1)
  // ============================================================================
  const rugB1 = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.015, 2.3), rugMat);
  rugB1.position.set(-4.15, floorY + 0.008, -3.5);
  rugB1.receiveShadow = true;
  root.add(rugB1);

  const bed1 = buildBed(1.42, 1.98, oakMat, linenMat, sageTextilesMat, oatmealFabricMat);
  bed1.position.set(-4.3, floorY, -3.7);
  bed1.rotation.y = Math.PI / 2;
  root.add(bed1);

  // Nightstand + warm bedside lamp
  const ns1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.46, 0.42), oakMat);
  ns1.position.set(-4.95, floorY + 0.23, -5.0);
  ns1.castShadow = true;
  root.add(ns1);
  const lamp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.18, 12), warmBulbMat);
  lamp1.position.set(-4.95, floorY + 0.56, -5.0);
  root.add(lamp1);

  // Oak Wardrobe
  const ward1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.85, 1.5), oakMat);
  ward1.position.set(-4.88, floorY + 0.925, -1.25);
  ward1.castShadow = true;
  root.add(ward1);

  // ============================================================================
  // 3. BEDROOM 02 (Left Container Front: X = -4.2, Z = +0.1..+6.0)
  // ============================================================================
  const rugB2 = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.015, 2.2), rugMat);
  rugB2.position.set(-4.15, floorY + 0.008, 2.3);
  rugB2.receiveShadow = true;
  root.add(rugB2);

  const bed2 = buildBed(1.36, 1.94, oakMat, linenMat, terracottaMat, oatmealFabricMat);
  bed2.position.set(-4.3, floorY, 2.0);
  bed2.rotation.y = Math.PI / 2;
  root.add(bed2);

  // Study desk & chair at front window of Bedroom 02
  const b2Desk = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 0.58), oakMat);
  b2Desk.position.set(-4.2, floorY + 0.72, 5.15);
  b2Desk.castShadow = true;
  root.add(b2Desk);
  for (const dx of [-4.78, -3.62]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.5), blackSteelMat);
    leg.position.set(dx, floorY + 0.36, 5.15);
    root.add(leg);
  }
  const b2Chair = buildChair(oakMat, blackSteelMat, charcoalFabricMat);
  b2Chair.position.set(-4.2, floorY, 4.55);
  root.add(b2Chair);

  // Bookshelf in Bedroom 02
  const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.65, 1.15), darkWalnutMat);
  shelf2.position.set(-4.92, floorY + 0.825, 0.75);
  shelf2.castShadow = true;
  root.add(shelf2);

  // ============================================================================
  // 4. BEDROOM 03 (Right Container Rear: X = +4.2, Z = -6.0..-1.7)
  // ============================================================================
  const rugB3 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.015, 1.9), rugMat);
  rugB3.position.set(4.15, floorY + 0.008, -4.3);
  rugB3.receiveShadow = true;
  root.add(rugB3);

  const bed3 = buildBed(1.34, 1.92, oakMat, linenMat, sageTextilesMat, oatmealFabricMat);
  bed3.position.set(4.25, floorY, -4.5);
  bed3.rotation.y = -Math.PI / 2;
  root.add(bed3);

  const ward3 = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.75, 1.25), oakMat);
  ward3.position.set(4.92, floorY + 0.875, -2.55);
  ward3.castShadow = true;
  root.add(ward3);

  // ============================================================================
  // 5. COMPACT PANTRY & KITCHEN (Right Container Middle: X = +4.2, Z = -1.6..+2.6)
  // ============================================================================
  // Main galley counter along right wall (X = +4.95)
  const kCab = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.88, 3.15), charcoalFabricMat);
  kCab.position.set(4.92, floorY + 0.44, 0.92);
  kCab.castShadow = true;
  root.add(kCab);

  const kCounter = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.055, 3.22), oakMat);
  kCounter.position.set(4.9, floorY + 0.9, 0.92);
  kCounter.castShadow = true;
  kCounter.receiveShadow = true;
  root.add(kCounter);

  // Stainless fridge at rear end of kitchen (Z = -1.15)
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.86, 0.76), brushedSteelMat);
  fridge.position.set(4.9, floorY + 0.93, -1.15);
  fridge.castShadow = true;
  root.add(fridge);

  // Stainless sink & gooseneck faucet
  const sinkBasin = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.62), brushedSteelMat);
  sinkBasin.position.set(4.9, floorY + 0.93, 0.25);
  root.add(sinkBasin);
  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.28, 8), brushedSteelMat);
  faucet.position.set(5.12, floorY + 1.07, 0.25);
  root.add(faucet);

  // 2-burner induction stove + range hood
  const stove = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.025, 0.65),
    new THREE.MeshStandardMaterial({ color: 0x111518, roughness: 0.15, metalness: 0.4 }),
  );
  stove.position.set(4.9, floorY + 0.935, 1.55);
  root.add(stove);

  // Espresso machine
  const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), brushedSteelMat);
  espresso.position.set(4.92, floorY + 1.07, -0.42);
  espresso.castShadow = true;
  root.add(espresso);

  // Breakfast counter top on central-hall pass-through wall (X = +3.02) + 2 bar stools
  const passCounter = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 2.38), oakMat);
  passCounter.position.set(2.96, floorY + 0.92, 1.0);
  passCounter.castShadow = true;
  root.add(passCounter);

  for (const sz of [0.45, 1.55]) {
    const stool = new THREE.Group();
    stool.position.set(2.55, floorY, sz);
    const sTop = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 14), oakMat);
    sTop.position.y = 0.64;
    sTop.castShadow = true;
    stool.add(sTop);
    const sPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.18, 0.62, 10), blackSteelMat);
    sPost.position.y = 0.31;
    stool.add(sPost);
    root.add(stool);
  }

  // ============================================================================
  // 6. COMMON WASHROOM (Right Container Front: X = +4.2, Z = +2.8..+6.0)
  // ============================================================================
  // Floating oak vanity + ceramic vessel basin + mirror
  const vanity = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 1.05), oakMat);
  vanity.position.set(4.98, floorY + 0.62, 3.4);
  vanity.castShadow = true;
  root.add(vanity);

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.14, 18), ceramicMat);
  basin.position.set(4.96, floorY + 0.89, 3.4);
  basin.castShadow = true;
  root.add(basin);

  // Modern ceramic WC
  const wcBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.38, 16), ceramicMat);
  wcBase.position.set(4.92, floorY + 0.19, 4.32);
  wcBase.castShadow = true;
  root.add(wcBase);
  const wcTank = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.38), ceramicMat);
  wcTank.position.set(5.12, floorY + 0.48, 4.32);
  root.add(wcTank);

  // Walk-in Glass Shower Enclosure (Z = +4.85..+5.95)
  const showerGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 1.9, 0.03),
    new THREE.MeshPhysicalMaterial({
      color: 0xdff5ff,
      transparent: true,
      opacity: 0.38,
      roughness: 0.08,
      depthWrite: false,
    }),
  );
  showerGlass.position.set(4.55, floorY + 0.95, 4.82);
  root.add(showerGlass);

  const showerDeck = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.04, 0.95), oakMat);
  showerDeck.position.set(4.65, floorY + 0.02, 5.42);
  root.add(showerDeck);

  const showerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.9, 8), brushedSteelMat);
  showerPipe.position.set(5.2, floorY + 0.95, 5.45);
  root.add(showerPipe);
  const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 14), brushedSteelMat);
  showerHead.position.set(4.95, floorY + 1.88, 5.45);
  root.add(showerHead);

  // ============================================================================
  // 7. UPSTAIRS MEETING ROOM (Second Floor 15ft Container: Y = 3.28)
  // ============================================================================
  const upY = 3.28;
  const confTable = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.06, 1.05), oakMat);
  confTable.position.set(4.15, upY + 0.74, -4.55);
  confTable.castShadow = true;
  confTable.receiveShadow = true;
  root.add(confTable);

  for (const lx of [3.2, 5.1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.8), blackSteelMat);
    leg.position.set(lx, upY + 0.36, -4.55);
    leg.castShadow = true;
    root.add(leg);
  }

  // 6 meeting chairs around conference table
  for (const cx of [3.4, 4.15, 4.9]) {
    const mc1 = buildChair(oakMat, blackSteelMat, leatherMat);
    mc1.position.set(cx, upY, -3.85);
    mc1.rotation.y = Math.PI;
    root.add(mc1);

    const mc2 = buildChair(oakMat, blackSteelMat, leatherMat);
    mc2.position.set(cx, upY, -5.25);
    root.add(mc2);
  }

  // Wall-mounted presentation screen on left wall (X = +2.06)
  const presScreen = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.95, 1.65), screenMat);
  presScreen.position.set(2.04, upY + 1.25, -4.55);
  root.add(presScreen);

  return root;
}
