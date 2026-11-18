import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CAMERA_PRESETS,
  ContainerFinish,
  CutawayMode,
  LightingPreset,
  ROOM_SPECS,
} from '../data/houseData';
import { ArchitectureHandle, buildContainerArchitecture } from './containerArchitecture';
import { buildInteriorFurniture } from './interiorFurniture';
import { buildLandscapeAndPool, LandscapeHandle } from './landscapeAndPool';
import { createProceduralTextures, ProceduralTextureSet } from './proceduralTextures';

export interface ProjectedLabel {
  id: string;
  label: string;
  zone: string;
  anchorX: number;
  anchorY: number;
  labelX: number;
  labelY: number;
  visible: boolean;
}

interface SceneCallbacks {
  onLabelsProjected: (labels: ProjectedLabel[]) => void;
  onSelectRoom: (roomId: string | null) => void;
  onContextLost: (lost: boolean) => void;
}

// Pre-allocated math helpers outside render loop (zero GC)
const _projAnchor = new THREE.Vector3();
const _projLabel = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export class HouseSceneController {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private textures: ProceduralTextureSet;
  private arch: ArchitectureHandle;
  private landscape: LandscapeHandle;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private bgColor = new THREE.Color(0x1c2b36);

  private frameId = 0;
  private renderBusy = false;
  private renderDirty = false;
  private disposed = false;
  private lastTickTime = performance.now();

  // Smooth camera transition state
  private cameraAnimating = false;
  private desiredCamPos = new THREE.Vector3();
  private desiredCamTarget = new THREE.Vector3();

  // Smooth cutaway state
  private cutawayMode: CutawayMode = 'cutaway';
  private cutawayProgress = 1;
  private cutawayTarget = 1;

  // Raycasting state
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downPos = { x: 0, y: 0 };

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = this.bgColor.clone();
    this.scene.fog = new THREE.FogExp2(0x1c2b36, 0.0115);

    // Mandatory studio environment map for PBR steel & glass reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    pmrem.dispose();

    // Narrow-FOV architectural isometric perspective camera
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.2, 220);
    const initPreset = CAMERA_PRESETS[0];
    this.camera.position.set(...initPreset.position);
    this.desiredCamPos.copy(this.camera.position);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...initPreset.target);
    this.desiredCamTarget.copy(this.controls.target);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 48;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.minPolarAngle = 0.08;

    this.controls.addEventListener('start', () => {
      // Cancel scripted camera glide immediately on user interaction
      this.cameraAnimating = false;
    });
    this.controls.addEventListener('change', () => {
      this.requestRender();
    });

    // 3-point warm/cool outdoor architectural lighting rig
    this.hemiLight = new THREE.HemisphereLight(0xbbe0ff, 0x3b4838, 0.85);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff1d6, 2.25);
    this.keyLight.position.set(16, 24, 14);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 70;
    const d = 16;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x9bc8ff, 0.65);
    this.rimLight.position.set(-16, 12, -14);
    this.scene.add(this.rimLight);

    // Procedural textures & 3D scene assemblies
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    this.arch = buildContainerArchitecture(this.textures, this.isSoftwareGl);
    this.scene.add(this.arch.group);

    const furniture = buildInteriorFurniture(this.textures);
    this.scene.add(furniture);

    this.landscape = buildLandscapeAndPool(this.textures, this.isSoftwareGl);
    this.scene.add(this.landscape.group);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.controls.update();
    this.requestRender();
  }

  private onResize = () => {
    if (this.disposed) return;
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.requestRender();
  };

  private onPointerDown = (e: PointerEvent) => {
    this.downPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (e: PointerEvent) => {
    const dx = e.clientX - this.downPos.x;
    const dy = e.clientY - this.downPos.y;
    if (dx * dx + dy * dy > 36) return; // Ignore drag orbits

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const targets = [...this.arch.interactiveMeshes, ...this.landscape.interactiveMeshes];
    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length > 0 && hits[0].object.userData.roomId) {
      this.callbacks.onSelectRoom(hits[0].object.userData.roomId as string);
    } else {
      this.callbacks.onSelectRoom(null);
    }
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onContextLost(true);
  };

  private onContextRestored = () => {
    this.callbacks.onContextLost(false);
    this.requestRender();
  };

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private projectLabels() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w <= 0 || h <= 0) return;

    const projected: ProjectedLabel[] = ROOM_SPECS.map((room) => {
      _projAnchor.set(room.anchor3D[0], room.anchor3D[1], room.anchor3D[2]);
      _projAnchor.project(this.camera);

      _projLabel.set(room.labelOffset3D[0], room.labelOffset3D[1], room.labelOffset3D[2]);
      _projLabel.project(this.camera);

      const inFront = _projAnchor.z < 1 && _projLabel.z < 1;
      const ax = ((_projAnchor.x + 1) * 0.5) * w;
      const ay = ((-_projAnchor.y + 1) * 0.5) * h;
      let lx = ((_projLabel.x + 1) * 0.5) * w;
      let ly = ((-_projLabel.y + 1) * 0.5) * h;

      // Clamp label text safely inside viewport margins so labels never clip off screen
      lx = THREE.MathUtils.clamp(lx, 118, w - 118);
      ly = THREE.MathUtils.clamp(ly, 64, h - 135);

      return {
        id: room.id,
        label: room.label,
        zone: room.zone,
        anchorX: ax,
        anchorY: ay,
        labelX: lx,
        labelY: ly,
        visible: inFront,
      };
    });

    // Anti-collision pass so adjacent screen labels stay separated vertically
    const sorted = [...projected].sort((a, b) => a.labelY - b.labelY);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (Math.abs(curr.labelX - prev.labelX) < 165 && curr.labelY - prev.labelY < 32) {
        curr.labelY = Math.min(h - 130, prev.labelY + 34);
      }
    }

    this.callbacks.onLabelsProjected(projected);
  }

  public requestRender = () => {
    if (this.disposed) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }
    this.renderBusy = true;
    this.frameId = requestAnimationFrame(() => {
      if (this.disposed) return;
      this.renderDirty = false;
      const now = performance.now();
      const dt = Math.min((now - this.lastTickTime) / 1000, 0.1);
      this.lastTickTime = now;

      let needsMoreFrames = false;

      // Smooth camera preset glide using frame-rate independent damp
      if (this.cameraAnimating) {
        this.camera.position.x = THREE.MathUtils.damp(
          this.camera.position.x,
          this.desiredCamPos.x,
          6.5,
          dt,
        );
        this.camera.position.y = THREE.MathUtils.damp(
          this.camera.position.y,
          this.desiredCamPos.y,
          6.5,
          dt,
        );
        this.camera.position.z = THREE.MathUtils.damp(
          this.camera.position.z,
          this.desiredCamPos.z,
          6.5,
          dt,
        );
        this.controls.target.x = THREE.MathUtils.damp(
          this.controls.target.x,
          this.desiredCamTarget.x,
          7.0,
          dt,
        );
        this.controls.target.y = THREE.MathUtils.damp(
          this.controls.target.y,
          this.desiredCamTarget.y,
          7.0,
          dt,
        );
        this.controls.target.z = THREE.MathUtils.damp(
          this.controls.target.z,
          this.desiredCamTarget.z,
          7.0,
          dt,
        );

        const posDist = this.camera.position.distanceTo(this.desiredCamPos);
        const tgtDist = this.controls.target.distanceTo(this.desiredCamTarget);
        if (posDist < 0.04 && tgtDist < 0.03) {
          this.camera.position.copy(this.desiredCamPos);
          this.controls.target.copy(this.desiredCamTarget);
          this.cameraAnimating = false;
        } else {
          needsMoreFrames = true;
        }
      }

      // Smooth cutaway transition
      if (Math.abs(this.cutawayProgress - this.cutawayTarget) > 0.005) {
        this.cutawayProgress = THREE.MathUtils.damp(
          this.cutawayProgress,
          this.cutawayTarget,
          8,
          dt,
        );
        this.arch.updateCutaway(this.cutawayProgress, this.cutawayMode);
        needsMoreFrames = true;
      }

      const dampingChanged = this.controls.update();
      if (dampingChanged) {
        needsMoreFrames = true;
      }

      this.renderer.render(this.scene, this.camera);
      this.projectLabels();

      const done = () => {
        this.renderBusy = false;
        if (this.renderDirty || needsMoreFrames) {
          this.requestRender();
        }
      };

      if (this.isSoftwareGl) {
        this.afterDraw(done);
      } else {
        done();
      }
    });
  };

  public setCameraView(position: [number, number, number], target: [number, number, number]) {
    this.desiredCamPos.set(...position);
    this.desiredCamTarget.set(...target);
    this.cameraAnimating = true;
    this.requestRender();
  }

  public setCutawayMode(mode: CutawayMode) {
    this.cutawayMode = mode;
    this.cutawayTarget = mode === 'full-shell' ? 0 : 1;
    this.arch.updateCutaway(this.cutawayProgress, mode);
    this.requestRender();
  }

  public setContainerFinish(finish: ContainerFinish) {
    this.arch.setContainerFinish(finish);
    this.requestRender();
  }

  public setBlueprintVisible(visible: boolean) {
    this.landscape.setBlueprintVisible(visible);
    this.requestRender();
  }

  public setLightingPreset(preset: LightingPreset) {
    if (preset === 'daylight') {
      this.bgColor.setHex(0x1c2b36);
      this.keyLight.color.setHex(0xfff1d6);
      this.keyLight.intensity = 2.25;
      this.keyLight.position.set(16, 24, 14);
      this.hemiLight.color.setHex(0xbbe0ff);
      this.hemiLight.groundColor.setHex(0x3b4838);
      this.hemiLight.intensity = 0.85;
      this.renderer.toneMappingExposure = 1.08;
    } else if (preset === 'golden') {
      this.bgColor.setHex(0x23202d);
      this.keyLight.color.setHex(0xffb86c);
      this.keyLight.intensity = 2.45;
      this.keyLight.position.set(24, 13, 10);
      this.hemiLight.color.setHex(0xffd6a5);
      this.hemiLight.groundColor.setHex(0x2e2930);
      this.hemiLight.intensity = 0.72;
      this.renderer.toneMappingExposure = 1.05;
    } else {
      // Studio Blueprint
      this.bgColor.setHex(0x122233);
      this.keyLight.color.setHex(0xeaf4ff);
      this.keyLight.intensity = 1.9;
      this.keyLight.position.set(14, 28, 16);
      this.hemiLight.color.setHex(0xa6d1ff);
      this.hemiLight.groundColor.setHex(0x1f3346);
      this.hemiLight.intensity = 0.95;
      this.renderer.toneMappingExposure = 1.02;
    }
    (this.scene.background as THREE.Color).copy(this.bgColor);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.bgColor);
    }
    this.requestRender();
  }

  public capturePng(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('webglcontextlost', this.onContextLost);
    canvas.removeEventListener('webglcontextrestored', this.onContextRestored);

    this.controls.dispose();
    this.textures.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
