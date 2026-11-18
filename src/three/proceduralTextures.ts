import * as THREE from 'three';

export interface ProceduralTextureSet {
  timberColor: THREE.CanvasTexture;
  timberBump: THREE.CanvasTexture;
  deckColor: THREE.CanvasTexture;
  corrugationBump: THREE.CanvasTexture;
  slateTileColor: THREE.CanvasTexture;
  travertineColor: THREE.CanvasTexture;
  poolMosaicColor: THREE.CanvasTexture;
  waterNormal: THREE.CanvasTexture;
  rugColor: THREE.CanvasTexture;
  blueprintGround: THREE.CanvasTexture;
  dispose: () => void;
}

function configureTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function drawTimberPlanks(
  size: number,
  baseHue: [number, number, number],
  plankCount: number,
): { colorCanvas: HTMLCanvasElement; bumpCanvas: HTMLCanvasElement } {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const plankH = size / plankCount;
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let row = 0; row < plankCount; row++) {
    const y = row * plankH;
    const jointX = Math.floor(rand() * size * 0.7 + size * 0.15);
    const segments = [
      { x: 0, w: jointX },
      { x: jointX, w: size - jointX },
    ];

    for (const seg of segments) {
      const toneShift = (rand() - 0.5) * 22;
      const r = Math.min(255, Math.max(0, baseHue[0] + toneShift));
      const g = Math.min(255, Math.max(0, baseHue[1] + toneShift * 0.8));
      const b = Math.min(255, Math.max(0, baseHue[2] + toneShift * 0.5));

      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
      ctx.fillRect(seg.x, y, seg.w, plankH);

      bCtx.fillStyle = `rgb(${150 + ((rand() * 20) | 0)}, ${150 + ((rand() * 20) | 0)}, ${150 + ((rand() * 20) | 0)})`;
      bCtx.fillRect(seg.x, y, seg.w, plankH);

      // Wood grain streaks
      for (let s = 0; s < 14; s++) {
        const sy = y + rand() * plankH;
        const alpha = 0.05 + rand() * 0.09;
        ctx.strokeStyle = rand() > 0.5 ? `rgba(55,30,14,${alpha})` : `rgba(240,205,165,${alpha * 0.7})`;
        ctx.lineWidth = 0.8 + rand() * 1.4;
        ctx.beginPath();
        ctx.moveTo(seg.x, sy);
        ctx.bezierCurveTo(
          seg.x + seg.w * 0.33,
          sy + (rand() - 0.5) * 4,
          seg.x + seg.w * 0.66,
          sy + (rand() - 0.5) * 4,
          seg.x + seg.w,
          sy,
        );
        ctx.stroke();

        bCtx.strokeStyle = `rgba(110,110,110,0.25)`;
        bCtx.lineWidth = 1;
        bCtx.beginPath();
        bCtx.moveTo(seg.x, sy);
        bCtx.lineTo(seg.x + seg.w, sy);
        bCtx.stroke();
      }
    }

    // Horizontal seam
    ctx.fillStyle = 'rgba(42, 24, 12, 0.55)';
    ctx.fillRect(0, y, size, 1.5);
    bCtx.fillStyle = 'rgb(40,40,40)';
    bCtx.fillRect(0, y, size, 2);

    // Vertical end-joint seam
    ctx.fillRect(jointX, y, 1.5, plankH);
    bCtx.fillRect(jointX, y, 2, plankH);
  }

  return { colorCanvas, bumpCanvas };
}

function drawCorrugationBump(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const ribs = 16;
  const period = size / ribs;

  for (let x = 0; x < size; x++) {
    const phase = (x % period) / period;
    // Trapezoidal shipping container profile
    let h = 0.5;
    if (phase < 0.18) h = 0.15;
    else if (phase < 0.32) h = 0.15 + ((phase - 0.18) / 0.14) * 0.75;
    else if (phase < 0.68) h = 0.9;
    else if (phase < 0.82) h = 0.9 - ((phase - 0.68) / 0.14) * 0.75;
    else h = 0.15;

    const v = Math.round(h * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, 0, 1, size);
  }
  return canvas;
}

function drawTileGrid(
  size: number,
  cols: number,
  rows: number,
  baseColor: [number, number, number],
  groutColor: string,
  variance: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = groutColor;
  ctx.fillRect(0, 0, size, size);

  const w = size / cols;
  const h = size / rows;
  const pad = Math.max(1.5, size * 0.008);

  let seed = 109;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shift = (rand() - 0.5) * variance;
      const red = Math.min(255, Math.max(0, baseColor[0] + shift));
      const grn = Math.min(255, Math.max(0, baseColor[1] + shift));
      const blu = Math.min(255, Math.max(0, baseColor[2] + shift));
      ctx.fillStyle = `rgb(${red | 0}, ${grn | 0}, ${blu | 0})`;
      ctx.fillRect(c * w + pad, r * h + pad, w - pad * 2, h - pad * 2);
    }
  }
  return canvas;
}

function drawWaterNormalMap(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      const dx =
        Math.cos(u * 4 + v * 2) * 0.35 +
        Math.cos(u * 7 - v * 5) * 0.22 +
        Math.sin(u * 11 + v * 9) * 0.12;
      const dy =
        Math.sin(v * 4 + u * 3) * 0.35 +
        Math.sin(v * 6 - u * 4) * 0.22 +
        Math.cos(v * 10 - u * 8) * 0.12;

      const idx = (y * size + x) * 4;
      data[idx] = Math.round((dx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round((dy * 0.5 + 0.5) * 255);
      data[idx + 2] = 240;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function drawRugTexture(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c8bca6';
  ctx.fillRect(0, 0, size, size);

  // Subtle woven stripes
  for (let y = 0; y < size; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(95, 82, 65, 0.14)' : 'rgba(245, 240, 230, 0.18)';
    ctx.fillRect(0, y, size, 2);
  }
  for (let x = 0; x < size; x += 6) {
    ctx.fillStyle = 'rgba(70, 60, 48, 0.08)';
    ctx.fillRect(x, 0, 2, size);
  }

  // Border framing
  ctx.strokeStyle = '#6f6454';
  ctx.lineWidth = size * 0.035;
  ctx.strokeRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88);
  return canvas;
}

function drawBlueprintGround(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Rich architectural olive-slate lawn base for contrast against white overlay text
  ctx.fillStyle = '#25352d';
  ctx.fillRect(0, 0, size, size);

  // Subtle natural turf grain
  let seed = 777;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 4000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(62, 92, 68, 0.25)' : 'rgba(24, 38, 30, 0.25)';
    ctx.fillRect(x, y, 3, 3);
  }

  // Fine architectural blueprint grid lines
  const subdivisions = 8;
  const step = size / subdivisions;
  ctx.strokeStyle = 'rgba(182, 224, 232, 0.11)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= subdivisions; i++) {
    const p = i * step;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  // Major 1-meter grid line
  ctx.strokeStyle = 'rgba(205, 236, 245, 0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  return canvas;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const interiorTimber = drawTimberPlanks(512, [186, 134, 84], 8);
  const deckTimber = drawTimberPlanks(512, [146, 102, 66], 10);
  const corrugation = drawCorrugationBump(256);
  const slateTile = drawTileGrid(512, 4, 4, [78, 86, 92], '#373e44', 12);
  const travertine = drawTileGrid(512, 3, 2, [205, 194, 174], '#9e9280', 14);
  const poolMosaic = drawTileGrid(512, 16, 16, [34, 168, 192], '#187c92', 22);
  const waterNormalCanvas = drawWaterNormalMap(256);
  const rugCanvas = drawRugTexture(512);
  const blueprintCanvas = drawBlueprintGround(512);

  const timberColor = configureTexture(interiorTimber.colorCanvas, true, 3, 3, maxAnisotropy);
  const timberBump = configureTexture(interiorTimber.bumpCanvas, false, 3, 3, maxAnisotropy);
  const deckColor = configureTexture(deckTimber.colorCanvas, true, 4, 3, maxAnisotropy);
  const corrugationBump = configureTexture(corrugation, false, 3, 1, maxAnisotropy);
  const slateTileColor = configureTexture(slateTile, true, 2, 2, maxAnisotropy);
  const travertineColor = configureTexture(travertine, true, 4, 2, maxAnisotropy);
  const poolMosaicColor = configureTexture(poolMosaic, true, 4, 2, maxAnisotropy);
  const waterNormal = configureTexture(waterNormalCanvas, false, 3, 2, maxAnisotropy);
  const rugColor = configureTexture(rugCanvas, true, 1, 1, maxAnisotropy);
  const blueprintGround = configureTexture(blueprintCanvas, true, 18, 18, maxAnisotropy);

  return {
    timberColor,
    timberBump,
    deckColor,
    corrugationBump,
    slateTileColor,
    travertineColor,
    poolMosaicColor,
    waterNormal,
    rugColor,
    blueprintGround,
    dispose: () => {
      timberColor.dispose();
      timberBump.dispose();
      deckColor.dispose();
      corrugationBump.dispose();
      slateTileColor.dispose();
      travertineColor.dispose();
      poolMosaicColor.dispose();
      waterNormal.dispose();
      rugColor.dispose();
      blueprintGround.dispose();
    },
  };
}
