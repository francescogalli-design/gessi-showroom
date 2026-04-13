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
 * Floating dust motes — cinematic ambient particles
 * inspired by Unreal Engine 5 atmospheric dust.
 * Tiny bright specks that drift slowly through light beams.
 */
export class DustParticles {
  private points: Points;
  private velocities: Float32Array;
  private positions: Float32Array;
  private count: number;
  private bounds = { x: 0.5, y: 0.35, z: 0.5 };
  private time = 0;

  constructor(scene: Scene, count = 120) {
    this.count = count;

    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      this.positions[i3] = (Math.random() - 0.5) * this.bounds.x * 2;
      this.positions[i3 + 1] = Math.random() * this.bounds.y + 0.01;
      this.positions[i3 + 2] = (Math.random() - 0.5) * this.bounds.z * 2;

      this.velocities[i3] = (Math.random() - 0.5) * 0.0003;
      this.velocities[i3 + 1] = (Math.random() - 0.3) * 0.0002;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.0003;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(this.positions, 3));

    const texture = this.createDustTexture();

    const material = new PointsMaterial({
      size: 0.007,
      sizeAttenuation: true,
      color: new Color(0xfff5e0),
      transparent: true,
      opacity: 0.28,
      blending: AdditiveBlending,
      depthWrite: false,
      map: texture,
    });

    this.points = new Points(geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  private createDustTexture(): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Very soft, large falloff — blurry dust mote look
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0,    'rgba(255, 250, 240, 0.9)');
    gradient.addColorStop(0.08, 'rgba(255, 248, 230, 0.6)');
    gradient.addColorStop(0.3,  'rgba(255, 244, 220, 0.2)');
    gradient.addColorStop(0.6,  'rgba(255, 240, 210, 0.05)');
    gradient.addColorStop(1,    'rgba(255, 240, 210, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    return new CanvasTexture(canvas);
  }

  update(delta: number) {
    this.time += delta;
    const attr = this.points.geometry.attributes.position;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      const wobbleX = Math.sin(this.time * 0.3 + i * 1.7) * 0.00008;
      const wobbleY = Math.cos(this.time * 0.2 + i * 2.3) * 0.00005;
      const wobbleZ = Math.sin(this.time * 0.25 + i * 0.9) * 0.00008;

      this.positions[i3] += this.velocities[i3] + wobbleX;
      this.positions[i3 + 1] += this.velocities[i3 + 1] + wobbleY;
      this.positions[i3 + 2] += this.velocities[i3 + 2] + wobbleZ;

      // Wrap around bounds
      if (this.positions[i3] > this.bounds.x) this.positions[i3] = -this.bounds.x;
      if (this.positions[i3] < -this.bounds.x) this.positions[i3] = this.bounds.x;
      if (this.positions[i3 + 1] > this.bounds.y) this.positions[i3 + 1] = 0.01;
      if (this.positions[i3 + 1] < 0.01) this.positions[i3 + 1] = this.bounds.y;
      if (this.positions[i3 + 2] > this.bounds.z) this.positions[i3 + 2] = -this.bounds.z;
      if (this.positions[i3 + 2] < -this.bounds.z) this.positions[i3 + 2] = this.bounds.z;
    }

    (attr as Float32BufferAttribute).set(this.positions);
    attr.needsUpdate = true;
  }

  setVisible(visible: boolean) {
    this.points.visible = visible;
  }
}
