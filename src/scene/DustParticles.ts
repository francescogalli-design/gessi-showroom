import {
  Scene,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  AdditiveBlending,
  Color,
  CanvasTexture,
} from 'three';

/**
 * Cinematic atmospheric dust system.
 *
 * Two layers for depth:
 *   - MACRO  : larger, brighter, slow-drifting motes (lit by key beam)
 *   - MICRO  : fine ambient haze, barely visible, ultra-slow
 *
 * Inspired by high-end product photography: Leica / Hasselblad studio shoots
 * where dust in light beams adds volume and depth to the air.
 */
export class DustParticles {
  private macro: Points;
  private micro: Points;
  private macroPositions: Float32Array;
  private microPositions: Float32Array;
  private macroVelocities: Float32Array;
  private microVelocities: Float32Array;
  private macroCount: number;
  private microCount: number;
  private bounds = { x: 0.55, y: 0.4, z: 0.55 };
  private time = 0;

  constructor(scene: Scene, count = 200) {
    this.macroCount = count;
    this.microCount = Math.floor(count * 1.6); // denser haze layer

    // ── Macro motes ───────────────────────────────────────────────────
    this.macroPositions  = new Float32Array(this.macroCount * 3);
    this.macroVelocities = new Float32Array(this.macroCount * 3);

    for (let i = 0; i < this.macroCount; i++) {
      const i3 = i * 3;
      this.macroPositions[i3]     = (Math.random() - 0.5) * this.bounds.x * 2;
      this.macroPositions[i3 + 1] = Math.random() * this.bounds.y + 0.01;
      this.macroPositions[i3 + 2] = (Math.random() - 0.5) * this.bounds.z * 2;

      // Slightly upward drift — warm air rising from product lighting
      this.macroVelocities[i3]     = (Math.random() - 0.5) * 0.00025;
      this.macroVelocities[i3 + 1] = (Math.random() * 0.6 + 0.1) * 0.00018;
      this.macroVelocities[i3 + 2] = (Math.random() - 0.5) * 0.00025;
    }

    const macroGeo = new BufferGeometry();
    macroGeo.setAttribute('position', new Float32BufferAttribute(this.macroPositions, 3));

    const macroMat = new PointsMaterial({
      size: 0.006,
      sizeAttenuation: true,
      color: new Color(0xfff8e8),
      transparent: true,
      opacity: 0.06,
      blending: AdditiveBlending,
      depthWrite: false,
      map: this.createDustTexture(0.7),
    });

    this.macro = new Points(macroGeo, macroMat);
    this.macro.frustumCulled = false;
    scene.add(this.macro);

    // ── Micro haze ────────────────────────────────────────────────────
    this.microPositions  = new Float32Array(this.microCount * 3);
    this.microVelocities = new Float32Array(this.microCount * 3);

    for (let i = 0; i < this.microCount; i++) {
      const i3 = i * 3;
      this.microPositions[i3]     = (Math.random() - 0.5) * this.bounds.x * 2.2;
      this.microPositions[i3 + 1] = Math.random() * this.bounds.y;
      this.microPositions[i3 + 2] = (Math.random() - 0.5) * this.bounds.z * 2.2;

      this.microVelocities[i3]     = (Math.random() - 0.5) * 0.00010;
      this.microVelocities[i3 + 1] = (Math.random() - 0.4) * 0.00008;
      this.microVelocities[i3 + 2] = (Math.random() - 0.5) * 0.00010;
    }

    const microGeo = new BufferGeometry();
    microGeo.setAttribute('position', new Float32BufferAttribute(this.microPositions, 3));

    const microMat = new PointsMaterial({
      size: 0.0025,
      sizeAttenuation: true,
      color: new Color(0xfff0d8),
      transparent: true,
      opacity: 0.025,
      blending: AdditiveBlending,
      depthWrite: false,
      map: this.createDustTexture(0.5),
    });

    this.micro = new Points(microGeo, microMat);
    this.micro.frustumCulled = false;
    scene.add(this.micro);
  }

  /**
   * Soft radial gradient texture for each particle.
   * centerAlpha controls peak opacity — macro motes are brighter.
   */
  private createDustTexture(centerAlpha: number): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width  = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,    `rgba(255, 252, 242, ${centerAlpha})`);
    g.addColorStop(0.06, `rgba(255, 248, 235, ${centerAlpha * 0.65})`);
    g.addColorStop(0.25, `rgba(255, 244, 225, ${centerAlpha * 0.2})`);
    g.addColorStop(0.55, `rgba(255, 240, 215, ${centerAlpha * 0.04})`);
    g.addColorStop(1,    'rgba(255, 240, 215, 0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new CanvasTexture(canvas);
  }

  update(delta: number) {
    this.time += delta;

    this.updateLayer(
      this.macro,
      this.macroPositions,
      this.macroVelocities,
      this.macroCount,
      1.0  // wobble scale
    );

    this.updateLayer(
      this.micro,
      this.microPositions,
      this.microVelocities,
      this.microCount,
      0.4  // slower, more subtle
    );
  }

  private updateLayer(
    points: Points,
    positions: Float32Array,
    velocities: Float32Array,
    count: number,
    wobbleScale: number
  ) {
    const attr = points.geometry.attributes.position;
    const { x, y, z } = this.bounds;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const wx = Math.sin(this.time * 0.28 + i * 1.73) * 0.00007 * wobbleScale;
      const wy = Math.cos(this.time * 0.19 + i * 2.31) * 0.00004 * wobbleScale;
      const wz = Math.sin(this.time * 0.23 + i * 0.87) * 0.00007 * wobbleScale;

      positions[i3]     += velocities[i3]     + wx;
      positions[i3 + 1] += velocities[i3 + 1] + wy;
      positions[i3 + 2] += velocities[i3 + 2] + wz;

      // Wrap around bounds
      if (positions[i3]     >  x) positions[i3]     = -x;
      if (positions[i3]     < -x) positions[i3]     =  x;
      if (positions[i3 + 1] >  y) positions[i3 + 1] = 0.005;
      if (positions[i3 + 1] < 0) positions[i3 + 1]  =  y;
      if (positions[i3 + 2] >  z) positions[i3 + 2] = -z;
      if (positions[i3 + 2] < -z) positions[i3 + 2] =  z;
    }

    (attr as Float32BufferAttribute).set(positions);
    attr.needsUpdate = true;
  }

  setVisible(visible: boolean) {
    this.macro.visible = visible;
    this.micro.visible = visible;
  }
}
