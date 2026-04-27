import {
  Scene,
  DirectionalLight,
  SpotLight,
  Color,
  HemisphereLight,
} from 'three';
import { gsap } from 'gsap';

/** Named presets that DayNightCycle can switch between. */
export type DayNightPreset = 'day' | 'golden' | 'night';

interface LightParams {
  hemiSky: string; hemiGround: string; hemiInt: number;
  keyColor: string; keyInt: number;
  fillColor: string; fillInt: number;
  rimColor: string; rimInt: number;
  topColor: string; topInt: number;
  grazingInt: number;
  bounceInt: number;
}

const PRESETS: Record<DayNightPreset, LightParams> = {
  day: {
    hemiSky: '#fff8f0', hemiGround: '#1a1a2e', hemiInt: 0.45,
    keyColor: '#fff4e0',  keyInt: 3.2,
    fillColor: '#e8eeff', fillInt: 0.55,
    rimColor: '#d0e8ff',  rimInt: 2.8,
    topColor: '#ffecd6',  topInt: 5.0,
    grazingInt: 1.2,
    bounceInt: 0.35,
  },
  golden: {
    // Late afternoon / golden hour — warmer, lower contrast
    hemiSky: '#ffcf80', hemiGround: '#1a0a00', hemiInt: 0.35,
    keyColor: '#ff9f3a',  keyInt: 3.8,   // warm orange key from the side
    fillColor: '#ffd580', fillInt: 0.4,
    rimColor: '#ffe4b0',  rimInt: 1.8,
    topColor: '#ff8c2a',  topInt: 3.5,
    grazingInt: 2.0,      // stronger grazing — low sun angle reveals texture
    bounceInt: 0.2,
  },
  night: {
    // Interior night — warm tungsten / studio artificial lights
    hemiSky: '#1a0d00', hemiGround: '#050305', hemiInt: 0.08,
    keyColor: '#ffd080',  keyInt: 2.6,   // warm tungsten key
    fillColor: '#ffe8a0', fillInt: 0.2,
    rimColor: '#ffffff',  rimInt: 3.8,   // sharp cold rim from overhead fill
    topColor: '#ffcc66',  topInt: 6.5,   // bright overhead artificial spot
    grazingInt: 0.6,
    bounceInt: 0.15,
  },
};

export class LightingRig {
  private hemi!: HemisphereLight;
  private keyLight!: DirectionalLight;
  private fillLight!: DirectionalLight;
  private rimLight!: DirectionalLight;
  private topSpot!: SpotLight;
  private grazingLight!: SpotLight;
  private floorBounce!: SpotLight;

  private currentPreset: DayNightPreset = 'day';

  constructor(scene: Scene) {

    // ── Hemisphere ambient ─────────────────────────────────────────────
    this.hemi = new HemisphereLight(new Color(0xfff8f0), new Color(0x1a1a2e), 0.45);
    scene.add(this.hemi);

    // ── Key light ─────────────────────────────────────────────────────
    this.keyLight = new DirectionalLight(new Color(0xfff4e0), 3.2);
    this.keyLight.position.set(0.3, 0.6, 0.35);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(4096, 4096);
    this.keyLight.shadow.camera.near   = 0.01;
    this.keyLight.shadow.camera.far    = 2.5;
    this.keyLight.shadow.camera.left   = -0.4;
    this.keyLight.shadow.camera.right  =  0.4;
    this.keyLight.shadow.camera.top    =  0.4;
    this.keyLight.shadow.camera.bottom = -0.4;
    this.keyLight.shadow.bias          = -0.00005;
    this.keyLight.shadow.normalBias    =  0.002;
    this.keyLight.shadow.radius        =  3;
    scene.add(this.keyLight);

    // ── Fill light ────────────────────────────────────────────────────
    this.fillLight = new DirectionalLight(new Color(0xe8eeff), 0.55);
    this.fillLight.position.set(-0.4, 0.3, 0.2);
    scene.add(this.fillLight);

    // ── Rim light ─────────────────────────────────────────────────────
    this.rimLight = new DirectionalLight(new Color(0xd0e8ff), 2.8);
    this.rimLight.position.set(-0.1, 0.5, -0.45);
    this.rimLight.castShadow = true;
    this.rimLight.shadow.mapSize.set(2048, 2048);
    this.rimLight.shadow.bias          = -0.00005;
    this.rimLight.shadow.normalBias    =  0.002;
    this.rimLight.shadow.radius        =  2;
    this.rimLight.shadow.camera.near   = 0.01;
    this.rimLight.shadow.camera.far    = 2.5;
    this.rimLight.shadow.camera.left   = -0.35;
    this.rimLight.shadow.camera.right  =  0.35;
    this.rimLight.shadow.camera.top    =  0.35;
    this.rimLight.shadow.camera.bottom = -0.35;
    scene.add(this.rimLight);

    // ── Top spot ──────────────────────────────────────────────────────
    this.topSpot = new SpotLight(new Color(0xffecd6), 5.0, 1.2, Math.PI / 7, 0.5, 1.8);
    this.topSpot.position.set(0.04, 0.72, 0.06);
    this.topSpot.target.position.set(0, 0, 0);
    this.topSpot.castShadow = true;
    this.topSpot.shadow.mapSize.set(4096, 4096);
    this.topSpot.shadow.bias       = -0.00005;
    this.topSpot.shadow.normalBias =  0.002;
    this.topSpot.shadow.radius     =  4;
    scene.add(this.topSpot);
    scene.add(this.topSpot.target);

    // ── Grazing light ─────────────────────────────────────────────────
    this.grazingLight = new SpotLight(new Color(0xf5e8d0), 1.2, 0.9, Math.PI / 5, 0.85, 2.0);
    this.grazingLight.position.set(0.38, 0.03, 0.22);
    this.grazingLight.target.position.set(0, 0.06, 0);
    scene.add(this.grazingLight);
    scene.add(this.grazingLight.target);

    // ── Floor bounce ──────────────────────────────────────────────────
    this.floorBounce = new SpotLight(new Color(0xfff5e8), 0.35, 0.6, Math.PI / 3, 1.0, 2.5);
    this.floorBounce.position.set(0.0, -0.05, 0.15);
    this.floorBounce.target.position.set(0, 0.15, 0);
    scene.add(this.floorBounce);
    scene.add(this.floorBounce.target);
  }

  /**
   * Animate to a day/night preset over `duration` seconds.
   * Smoothly interpolates all light colours and intensities via GSAP.
   */
  setPreset(name: DayNightPreset, duration = 1.8) {
    if (this.currentPreset === name) return;
    this.currentPreset = name;
    const p = PRESETS[name];

    const ease = 'power2.inOut';

    // Hemi
    gsap.to(this.hemi.color,        { r: this._r(p.hemiSky),    g: this._g(p.hemiSky),    b: this._b(p.hemiSky),    duration, ease });
    gsap.to(this.hemi.groundColor,  { r: this._r(p.hemiGround), g: this._g(p.hemiGround), b: this._b(p.hemiGround), duration, ease });
    gsap.to(this.hemi,              { intensity: p.hemiInt, duration, ease });

    // Key
    gsap.to(this.keyLight.color,  { r: this._r(p.keyColor),  g: this._g(p.keyColor),  b: this._b(p.keyColor),  duration, ease });
    gsap.to(this.keyLight,        { intensity: p.keyInt, duration, ease });

    // Fill
    gsap.to(this.fillLight.color, { r: this._r(p.fillColor), g: this._g(p.fillColor), b: this._b(p.fillColor), duration, ease });
    gsap.to(this.fillLight,       { intensity: p.fillInt, duration, ease });

    // Rim
    gsap.to(this.rimLight.color,  { r: this._r(p.rimColor),  g: this._g(p.rimColor),  b: this._b(p.rimColor),  duration, ease });
    gsap.to(this.rimLight,        { intensity: p.rimInt, duration, ease });

    // Top spot
    gsap.to(this.topSpot.color,   { r: this._r(p.topColor),  g: this._g(p.topColor),  b: this._b(p.topColor),  duration, ease });
    gsap.to(this.topSpot,         { intensity: p.topInt, duration, ease });

    // Grazing
    gsap.to(this.grazingLight,    { intensity: p.grazingInt, duration, ease });

    // Floor bounce
    gsap.to(this.floorBounce,     { intensity: p.bounceInt,  duration, ease });
  }

  getPreset(): DayNightPreset { return this.currentPreset; }

  // Helpers: parse #rrggbb → linear 0-1 for Three.js Color components
  private _r(hex: string) { return parseInt(hex.slice(1, 3), 16) / 255; }
  private _g(hex: string) { return parseInt(hex.slice(3, 5), 16) / 255; }
  private _b(hex: string) { return parseInt(hex.slice(5, 7), 16) / 255; }

  setIntensityMultiplier(multiplier: number) {
    [this.hemi, this.keyLight, this.fillLight, this.rimLight,
     this.topSpot, this.grazingLight, this.floorBounce].forEach((l) => {
      l.intensity *= multiplier;
    });
  }
}
