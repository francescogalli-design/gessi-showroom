import {
  Scene,
  Group,
  Mesh,
  PlaneGeometry,
  CylinderGeometry,
  LatheGeometry,
  MeshStandardMaterial,
  DoubleSide,
  Color,
  Vector2,
} from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export class ShowroomEnvironment {
  public group: Group;
  private darkFloor!: Reflector;
  private lightFloor!: Reflector;
  private backdropGroup!: Group;
  private lightBackdropGroup!: Group;

  constructor(scene: Scene) {
    this.group = new Group();

    this.createDarkFloor();
    this.createLightFloor();
    this.createDarkBackdrop();
    this.createLightBackdrop();

    // Default: dark mode
    this.setMode('dark');

    scene.add(this.group);
  }

  private createDarkFloor() {
    const reflectorGeometry = new PlaneGeometry(5, 5);
    this.darkFloor = new Reflector(reflectorGeometry, {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: new Color(0x030303),
    });
    this.darkFloor.rotation.x = -Math.PI / 2;
    this.darkFloor.position.y = -0.001;
    this.group.add(this.darkFloor);
  }

  private createLightFloor() {
    const reflectorGeometry = new PlaneGeometry(5, 5);
    this.lightFloor = new Reflector(reflectorGeometry, {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: new Color(0xd0cec8),
    });
    this.lightFloor.rotation.x = -Math.PI / 2;
    this.lightFloor.position.y = -0.001;
    this.group.add(this.lightFloor);
  }

  private createDarkBackdrop() {
    this.backdropGroup = new Group();

    // Full enclosing curved wall
    const backdropGeometry = new CylinderGeometry(
      2.0, 2.0, 1.5, 80, 1, true, 0, Math.PI * 2
    );
    const backdropMaterial = new MeshStandardMaterial({
      color: new Color(0x0a0a0a),
      roughness: 0.95,
      metalness: 0.0,
      side: DoubleSide,
      envMapIntensity: 0.02,
    });
    const backdrop = new Mesh(backdropGeometry, backdropMaterial);
    backdrop.position.y = 0.5;
    backdrop.receiveShadow = true;
    this.backdropGroup.add(backdrop);

    // Smooth cove floor-to-wall transition
    const coveProfile: Vector2[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 0.5;
      const r = 0.12;
      const x = 2.0 - r + Math.cos(angle) * r;
      const y = Math.sin(angle) * r - 0.25;
      coveProfile.push(new Vector2(x, y));
    }
    const coveGeometry = new LatheGeometry(coveProfile, 80, 0, Math.PI * 2);
    const coveMaterial = new MeshStandardMaterial({
      color: new Color(0x080808),
      roughness: 0.95,
      metalness: 0.0,
      side: DoubleSide,
      envMapIntensity: 0.02,
    });
    const cove = new Mesh(coveGeometry, coveMaterial);
    cove.receiveShadow = true;
    this.backdropGroup.add(cove);

    this.group.add(this.backdropGroup);
  }

  private createLightBackdrop() {
    this.lightBackdropGroup = new Group();

    const backdropGeometry = new CylinderGeometry(
      2.0, 2.0, 1.5, 80, 1, true, 0, Math.PI * 2
    );
    const backdropMaterial = new MeshStandardMaterial({
      color: new Color(0xf5f4f2),
      roughness: 0.95,
      metalness: 0.0,
      side: DoubleSide,
      envMapIntensity: 0.05,
    });
    const backdrop = new Mesh(backdropGeometry, backdropMaterial);
    backdrop.position.y = 0.5;
    backdrop.receiveShadow = true;
    this.lightBackdropGroup.add(backdrop);

    // Light cove
    const coveProfile: Vector2[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 0.5;
      const r = 0.12;
      const x = 2.0 - r + Math.cos(angle) * r;
      const y = Math.sin(angle) * r - 0.25;
      coveProfile.push(new Vector2(x, y));
    }
    const coveGeometry = new LatheGeometry(coveProfile, 80, 0, Math.PI * 2);
    const coveMaterial = new MeshStandardMaterial({
      color: new Color(0xf0eeec),
      roughness: 0.95,
      metalness: 0.0,
      side: DoubleSide,
      envMapIntensity: 0.05,
    });
    const cove = new Mesh(coveGeometry, coveMaterial);
    cove.receiveShadow = true;
    this.lightBackdropGroup.add(cove);

    this.group.add(this.lightBackdropGroup);
  }

  setMode(mode: 'dark' | 'light' | 'hidden') {
    this.darkFloor.visible = mode === 'dark';
    this.lightFloor.visible = mode === 'light';
    this.backdropGroup.visible = mode === 'dark';
    this.lightBackdropGroup.visible = mode === 'light';
  }

  setVisible(visible: boolean) {
    this.group.visible = visible;
  }
}
