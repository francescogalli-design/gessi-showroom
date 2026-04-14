import {
  Scene,
  Texture,
  PMREMGenerator,
  WebGLRenderer,
  Color,
  EquirectangularReflectionMapping,
} from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export interface EnvironmentPreset {
  id: string;
  name: string;
  hdriPath: string;
  showAsBackground: boolean;
  lightMode?: boolean; // white background mode
}

export const ENVIRONMENTS: EnvironmentPreset[] = [
  {
    id: 'studio',
    name: 'Studio Dark',
    hdriPath: '/hdri/studio_small_09_1k.hdr',
    showAsBackground: false,
  },
  {
    id: 'studio-light',
    name: 'Studio Light',
    hdriPath: '/hdri/studio_small_09_1k.hdr',
    showAsBackground: false,
    lightMode: true,
  },
  {
    id: 'warm-studio',
    name: 'Warm',
    hdriPath: '/hdri/brown_photostudio_02_1k.hdr',
    showAsBackground: false,
  },
  {
    id: 'villa',
    name: 'Villa',
    hdriPath: '/hdri/villa_1k.hdr',
    showAsBackground: true,
  },
];

export class EnvironmentManager {
  private scene: Scene;
  private pmremGenerator: PMREMGenerator;
  private loader: RGBELoader;
  private envMapCache = new Map<string, Texture>();
  private currentPreset: EnvironmentPreset | null = null;
  public onEnvironmentChange?: (preset: EnvironmentPreset) => void;

  constructor(scene: Scene, renderer: WebGLRenderer) {
    this.scene = scene;
    this.pmremGenerator = new PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.loader = new RGBELoader();
  }

  async loadEnvironment(preset: EnvironmentPreset): Promise<Texture> {
    if (this.envMapCache.has(preset.hdriPath)) {
      const envMap = this.envMapCache.get(preset.hdriPath)!;
      this.applyEnvironment(envMap, preset);
      return envMap;
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        preset.hdriPath,
        (hdrTexture) => {
          hdrTexture.mapping = EquirectangularReflectionMapping;
          const envMap = this.pmremGenerator.fromEquirectangular(hdrTexture).texture;
          hdrTexture.dispose();
          this.envMapCache.set(preset.hdriPath, envMap);
          this.applyEnvironment(envMap, preset);
          resolve(envMap);
        },
        undefined,
        reject
      );
    });
  }

  async preloadOnly(preset: EnvironmentPreset): Promise<void> {
    if (this.envMapCache.has(preset.hdriPath)) return;
    return new Promise((resolve, reject) => {
      this.loader.load(
        preset.hdriPath,
        (hdrTexture) => {
          hdrTexture.mapping = EquirectangularReflectionMapping;
          const envMap = this.pmremGenerator.fromEquirectangular(hdrTexture).texture;
          hdrTexture.dispose();
          this.envMapCache.set(preset.hdriPath, envMap);
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  private applyEnvironment(envMap: Texture, preset: EnvironmentPreset) {
    this.scene.environment = envMap;
    this.currentPreset = preset;

    if (preset.showAsBackground) {
      this.scene.background = envMap;
      this.scene.environmentIntensity = 1.0;
    } else if (preset.lightMode) {
      this.scene.background = new Color(0xfaf9f8);
      this.scene.environmentIntensity = 0.28;
    } else {
      this.scene.background = new Color(0x050505);
      this.scene.environmentIntensity = 0.25;
    }

    this.onEnvironmentChange?.(preset);
  }

  getCurrentPreset() {
    return this.currentPreset;
  }

  dispose() {
    this.envMapCache.forEach((tex) => tex.dispose());
    this.pmremGenerator.dispose();
  }
}
