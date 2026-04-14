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

export class PostProcessingPipeline {
  public composer: EffectComposer;
  private dofEffect!: DepthOfFieldEffect;

  constructor(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera
  ) {
    this.composer = new EffectComposer(renderer, {
      multisampling: 0,
    });

    // Render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Bloom - cinematic highlight glow on chrome specular hits
    const bloomEffect = new BloomEffect({
      intensity: 0.5,
      luminanceThreshold: 0.7,
      luminanceSmoothing: 0.025,
      mipmapBlur: true,
    });

    // Tone mapping - AGX for cinematic look
    const toneMappingEffect = new ToneMappingEffect({
      mode: ToneMappingMode.AGX,
    });

    // Vignette - cinematic frame
    const vignetteEffect = new VignetteEffect({
      offset: 0.25,
      darkness: 0.7,
    });

    // Film grain - subtle cinematic texture
    const noiseEffect = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
    });
    noiseEffect.blendMode.opacity.value = 0.055;

    // Depth of field — subtle cinematic bokeh
    this.dofEffect = new DepthOfFieldEffect(camera, {
      focalLength: 0.06,
      bokehScale: 1.2,
      focusDistance: 0.0,
    });

    // Main effects pass
    const effectPass = new EffectPass(
      camera,
      this.dofEffect,
      bloomEffect,
      toneMappingEffect,
      vignetteEffect,
      noiseEffect
    );
    this.composer.addPass(effectPass);

    // Chromatic aberration - separate pass (convolution effect)
    const chromaticAberrationEffect = new ChromaticAberrationEffect({
      radialModulation: true,
      modulationOffset: 0.15,
    });
    chromaticAberrationEffect.offset.set(0.0003, 0.0003);
    const chromaticPass = new EffectPass(camera, chromaticAberrationEffect);
    this.composer.addPass(chromaticPass);

    // SMAA antialiasing as final pass
    const smaaEffect = new SMAAEffect({
      preset: SMAAPreset.ULTRA,
    });
    const smaaPass = new EffectPass(camera, smaaEffect);
    this.composer.addPass(smaaPass);
  }

  setBokeh(scale: number) {
    this.dofEffect.bokehScale = scale;
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height);
  }

  render() {
    this.composer.render();
  }
}
