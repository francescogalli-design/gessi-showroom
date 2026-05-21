import {
  Scene,
  Group,
  Mesh,
  PlaneGeometry,
  CylinderGeometry,
  LatheGeometry,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  MeshBasicMaterial,
  DoubleSide,
  Color,
  Vector2,
} from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

/**
 * Floor strategy: Reflector (reflects actual scene objects) +
 * a semi-transparent overlay plane that acts as a "frosted glass" filter.
 *
 * Low Reflector resolution (128 px) → natural pixelation blur of the reflection.
 * Overlay opacity controls how much of the reflection bleeds through.
 *
 * Two-layer stack per floor type:
 *   [0] Reflector  — actual scene reflection, blurred by low resolution
 *   [1] Overlay    — colored semi-transparent plane that softens the reflection
 */
export class ShowroomEnvironment {
  public group: Group;

  // Dark studio
  private darkReflector!: Reflector;
  private darkOverlay!: Mesh;

  // Light studio
  private lightReflector!: Reflector;
  private lightOverlay!: Mesh;

  // Villa marble
  private villaReflector!: Reflector;
  private villaOverlay!: Mesh;

  private backdropGroup!: Group;
  private lightBackdropGroup!: Group;

  constructor(scene: Scene) {
    this.group = new Group();

    this.createDarkFloor();
    this.createLightFloor();
    this.createVillaFloor();
    this.createDarkBackdrop();
    this.createLightBackdrop();

    this.setMode('dark');
    scene.add(this.group);
  }

  // ─── Dark studio floor ──────────────────────────────────────────────────────

  private createDarkFloor() {
    const geo = new PlaneGeometry(5, 5);

    // Reflector — near-black tint so the reflected image stays dark
    this.darkReflector = new Reflector(geo, {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: new Color(0x060402),
    });
    this.darkReflector.rotation.x = -Math.PI / 2;
    this.darkReflector.position.y = -0.001;
    this.group.add(this.darkReflector);

    this.darkOverlay = new Mesh(
      geo,
      new MeshBasicMaterial({
        color: new Color(0x0d0a07),
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
    );
    this.darkOverlay.rotation.x = -Math.PI / 2;
    this.darkOverlay.position.y = -0.0005;
    this.darkOverlay.receiveShadow = true;
    this.group.add(this.darkOverlay);
  }

  // ─── Light studio floor ─────────────────────────────────────────────────────

  private createLightFloor() {
    const geo = new PlaneGeometry(5, 5);

    this.lightReflector = new Reflector(geo, {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: new Color(0xc8c0b0),  // warmer ivory reflection tint
    });
    this.lightReflector.rotation.x = -Math.PI / 2;
    this.lightReflector.position.y = -0.001;
    this.group.add(this.lightReflector);

    this.lightOverlay = new Mesh(
      geo,
      new MeshBasicMaterial({
        color: new Color(0xeae4da),  // warm ivory floor surface
        transparent: true,
        opacity: 0.90,
        depthWrite: false,
      })
    );
    this.lightOverlay.rotation.x = -Math.PI / 2;
    this.lightOverlay.position.y = -0.0005;
    this.lightOverlay.receiveShadow = true;
    this.group.add(this.lightOverlay);
  }

  // ─── Villa marble floor ─────────────────────────────────────────────────────

  private createVillaFloor() {
    const geo = new PlaneGeometry(12, 12); // larger — open HDRI background

    // Glass floor: near-perfect mirror with a cold blue-green tint
    this.villaReflector = new Reflector(geo, {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: new Color(0x8eaab8),   // float-glass blue-grey tint on the reflected image
    });
    this.villaReflector.rotation.x = -Math.PI / 2;
    this.villaReflector.position.y = -0.001;
    this.group.add(this.villaReflector);

    // Very thin glass overlay — mostly transparent, slight tint, high specular
    this.villaOverlay = new Mesh(
      geo,
      new MeshPhysicalMaterial({
        color: new Color(0x9ab8c8),   // cool blue-green glass body colour
        transparent: true,
        opacity: 0.10,                // 90% of the reflection shows through
        roughness: 0.0,               // perfectly smooth glass surface
        metalness: 0.0,
        reflectivity: 0.9,
        envMapIntensity: 2.5,         // strong HDRI specular on the glass surface
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        depthWrite: false,
      })
    );
    this.villaOverlay.rotation.x = -Math.PI / 2;
    this.villaOverlay.position.y = -0.0005;
    this.villaOverlay.receiveShadow = true;
    this.group.add(this.villaOverlay);
  }

  // ─── Backdrops ──────────────────────────────────────────────────────────────

  private createDarkBackdrop() {
    this.backdropGroup = new Group();

    const mat = new MeshStandardMaterial({
      color: new Color(0x020202),
      roughness: 0.95, metalness: 0.0,
      side: DoubleSide, envMapIntensity: 0.01,
    });
    const backdrop = new Mesh(
      new CylinderGeometry(2.0, 2.0, 1.5, 80, 1, true, 0, Math.PI * 2), mat
    );
    backdrop.position.y = 0.5;
    backdrop.receiveShadow = true;
    this.backdropGroup.add(backdrop);

    const coveMat = mat.clone();
    const cove = new Mesh(
      new LatheGeometry(this.buildCoveProfile(), 80, 0, Math.PI * 2), coveMat
    );
    cove.receiveShadow = true;
    this.backdropGroup.add(cove);
    this.group.add(this.backdropGroup);
  }

  private createLightBackdrop() {
    this.lightBackdropGroup = new Group();

    const mat = new MeshStandardMaterial({
      color: new Color(0xf5f0e8),  // warm ivory backdrop
      roughness: 1.0, metalness: 0.0,
      side: DoubleSide, envMapIntensity: 0.06,
    });
    const backdrop = new Mesh(
      new CylinderGeometry(2.0, 2.0, 1.5, 80, 1, true, 0, Math.PI * 2), mat
    );
    backdrop.position.y = 0.5;
    backdrop.receiveShadow = true;
    this.lightBackdropGroup.add(backdrop);

    const coveMat = new MeshStandardMaterial({
      color: new Color(0xf0ebe2),  // slightly warmer cove transition
      roughness: 1.0, metalness: 0.0,
      side: DoubleSide, envMapIntensity: 0.06,
    });
    const cove = new Mesh(
      new LatheGeometry(this.buildCoveProfile(), 80, 0, Math.PI * 2), coveMat
    );
    cove.receiveShadow = true;
    this.lightBackdropGroup.add(cove);
    this.group.add(this.lightBackdropGroup);
  }

  private buildCoveProfile(): Vector2[] {
    const profile: Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const a = t * Math.PI * 0.5;
      const r = 0.12;
      profile.push(new Vector2(2.0 - r + Math.cos(a) * r, Math.sin(a) * r - 0.25));
    }
    return profile;
  }

  // ─── Visibility control ─────────────────────────────────────────────────────

  setMode(mode: 'dark' | 'light' | 'villa') {
    const d = mode === 'dark';
    const l = mode === 'light';
    const v = mode === 'villa';

    this.darkReflector.visible  = d;
    this.darkOverlay.visible    = d;
    this.lightReflector.visible = l;
    this.lightOverlay.visible   = l;
    this.villaReflector.visible = v;
    this.villaOverlay.visible   = v;
    this.backdropGroup.visible       = d;
    this.lightBackdropGroup.visible  = l;
  }

  setVisible(visible: boolean) {
    this.group.visible = visible;
  }
}
