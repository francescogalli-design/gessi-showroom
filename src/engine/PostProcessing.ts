import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
  ChromaticAberrationEffect,
  NoiseEffect,
  BlendFunction,
  DepthOfFieldEffect,
} from 'postprocessing';

/**
 * Cinematic 4K post-processing pipeline.
 *
 * Stack (in order):
 *   1. Render
 *   2. Depth of Field  — shallow focus, luxury product bokeh
 *   3. Bloom           — specular glow on chrome/gold highlights
 *   4. Tone Mapping    — AGX, cinematic colour science
 *   5. Vignette        — gentle edge darkening, draws eye to product
 *   6. Film Grain      — adds analogue texture, removes digital flatness
 *   7. Chromatic Aberration — radial lens fringing, high-end glass feel
 *   8. SMAA Ultra      — sub-pixel antialiasing
 */
export class PostProcessingPipeline {
  public composer: EffectComposer;
  private dofEffect!: DepthOfFieldEffect;
  private chromaticEffect!: ChromaticAberrationEffect;
  private bloomEffect!: BloomEffect;

  constructor(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera
  ) {
    this.composer = new EffectComposer(renderer, {
      multisampling: 0, // SMAA handles AA — multisampling + postprocessing conflicts
    });

    // ── Render pass ───────────────────────────────────────────────────
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // ── Depth of Field ────────────────────────────────────────────────
    // Shallow focus pulls eye to product, blurs bg — luxury catalogue feel
    this.dofEffect = new DepthOfFieldEffect(camera, {
      focalLength: 0.055,
      bokehScale: 0.3,    // barely there — just a hint at extreme edges
      focusDistance: 0.0,
    });

    // ── Bloom ─────────────────────────────────────────────────────────
    // Specular glow on chrome/gold hits — subtle, just enough to feel real.
    // Too much bloom = fake; too little = flat. Target: barely noticeable.
    this.bloomEffect = new BloomEffect({
      intensity: 0.18,
      luminanceThreshold: 0.85,  // only the very brightest specular hits
      luminanceSmoothing: 0.02,
      mipmapBlur: true,
    });

    // ── Tone Mapping ──────────────────────────────────────────────────
    // AGX: wide-gamut, no colour channel clipping on bright metals
    const toneMappingEffect = new ToneMappingEffect({
      mode: ToneMappingMode.AGX,
    });

    // ── Vignette ─────────────────────────────────────────────────────
    // Gentle darkening — keeps attention centered on product
    const vignetteEffect = new VignetteEffect({
      offset: 0.22,
      darkness: 0.72,
    });

    // ── Film Grain ────────────────────────────────────────────────────
    // Analogue texture — removes digital "perfect flatness" on gradients
    const noiseEffect = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
    });
    noiseEffect.blendMode.opacity.value = 0.068;

    // Combined pass: DOF + Bloom + TM + Vignette + Grain
    const effectPass = new EffectPass(
      camera,
      this.dofEffect,
      this.bloomEffect,
      toneMappingEffect,
      vignetteEffect,
      noiseEffect
    );
    this.composer.addPass(effectPass);

    // ── Chromatic Aberration ──────────────────────────────────────────
    // Radial lens fringing: barely visible at centre, grows toward edges.
    // Signature of high-quality glass optics (think Leica, Hasselblad).
    this.chromaticEffect = new ChromaticAberrationEffect({
      radialModulation: true,
      modulationOffset: 0.18,  // stronger radial roll-off
    });
    this.chromaticEffect.offset.set(0.00055, 0.00055);
    const chromaticPass = new EffectPass(camera, this.chromaticEffect);
    this.composer.addPass(chromaticPass);

    // ── SMAA Ultra ────────────────────────────────────────────────────
    const smaaEffect = new SMAAEffect({ preset: SMAAPreset.ULTRA });
    const smaaPass = new EffectPass(camera, smaaEffect);
    this.composer.addPass(smaaPass);
  }

  /**
   * Called by EnvironmentManager on theme switch.
   * Dark → pronounced bokeh and bloom; Light → clean and sharp.
   */
  setBokeh(scale: number) {
    this.dofEffect.bokehScale = scale;
    // Sync bloom + clamp bokeh to avoid overdoing it
    this.dofEffect.bokehScale  = Math.min(scale * 0.25, 0.8);  // always gentle
    this.bloomEffect.intensity = scale > 1.5 ? 0.28 : 0.18;
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height);
  }

  render() {
    this.composer.render();
  }
}
