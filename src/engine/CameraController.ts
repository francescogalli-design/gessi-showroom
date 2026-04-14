import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

export interface CameraPreset {
  position: Vector3;
  target: Vector3;
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  front: {
    position: new Vector3(0, 0.12, 0.35),
    target: new Vector3(0, 0.06, 0),
  },
  side: {
    position: new Vector3(0.35, 0.12, 0),
    target: new Vector3(0, 0.06, 0),
  },
  top: {
    position: new Vector3(0, 0.45, 0.05),
    target: new Vector3(0, 0.06, 0),
  },
  detail: {
    position: new Vector3(0.12, 0.1, 0.12),
    target: new Vector3(0, 0.08, 0),
  },
};

export class CameraController {
  public camera: PerspectiveCamera;
  public controls: OrbitControls;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new PerspectiveCamera(35, aspect, 0.001, 100);
    this.camera.position.set(0.38, 0.22, 0.38);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.4;
    this.controls.target.set(0, 0.06, 0);
    this.controls.minDistance = 0.12;
    this.controls.maxDistance = 1.0;
    this.controls.minPolarAngle = Math.PI * 0.15;
    this.controls.maxPolarAngle = Math.PI * 0.55;
    this.controls.enablePan = false;

    window.addEventListener('resize', () => this.onResize(container));
  }

  private onResize(container: HTMLElement) {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  goToPreset(presetName: string) {
    const preset = CAMERA_PRESETS[presetName];
    if (!preset) return;
    this.transitionTo(preset.position, preset.target, 1.2);
  }

  transitionTo(position: Vector3, target: Vector3, duration = 1.0) {
    const wasAutoRotate = this.controls.autoRotate;
    this.controls.autoRotate = false;

    gsap.to(this.camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration,
      ease: 'power3.inOut',
      onComplete: () => {
        this.controls.autoRotate = wasAutoRotate;
      },
    });
    gsap.to(this.controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration,
      ease: 'power3.inOut',
    });
  }

  setAutoRotate(enabled: boolean) {
    this.controls.autoRotate = enabled;
  }

  update() {
    this.controls.update();
  }
}
