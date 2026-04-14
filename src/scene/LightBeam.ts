import {
  Scene,
  Mesh,
  ConeGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
  Group,
  DoubleSide,
} from 'three';

/**
 * Cinematic volumetric light beam — subtle cone of warm light
 * simulating a studio spotlight shaft from upper-left.
 * Uses additive blending on a double-sided open cone.
 */
export class LightBeam {
  private group: Group;
  private cone: Mesh;

  constructor(scene: Scene) {
    this.group = new Group();

    const geometry = new ConeGeometry(0.22, 0.55, 48, 1, true);

    const material = new MeshBasicMaterial({
      color: 0xfff8e8,
      transparent: true,
      opacity: 0.028,
      blending: AdditiveBlending,
      side: DoubleSide,
      depthWrite: false,
    });

    this.cone = new Mesh(geometry, material);

    // Position: tip at key light (upper front-right), widening downward
    this.group.position.set(0.18, 0.48, 0.18);

    // Tilt toward the product center
    this.group.rotation.z = -0.22;
    this.group.rotation.x = 0.18;

    // Cone tip is at top by default — keep it that way (narrow at top, wide at bottom)
    this.cone.position.y = -0.27;

    this.group.add(this.cone);
    scene.add(this.group);
  }

  setVisible(visible: boolean) {
    this.group.visible = visible;
  }
}
