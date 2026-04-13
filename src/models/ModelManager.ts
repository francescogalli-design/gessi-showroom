import { Scene, Group, Vector3 } from 'three';
import { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ModelLoader } from './ModelLoader';
import { ModelEntry, MODELS } from '../utils/AssetManifest';
import { MaterialSwapper } from '../materials/MaterialSwapper';

export class ModelManager {
  private scene: Scene;
  private loader: ModelLoader;
  private currentModel: Group | null = null;
  private currentEntry: ModelEntry | null = null;
  private materialSwapper: MaterialSwapper;
  private gltfCache = new Map<string, GLTF>();
  public onModelChange?: (entry: ModelEntry) => void;

  constructor(scene: Scene, loader: ModelLoader, materialSwapper: MaterialSwapper) {
    this.scene = scene;
    this.loader = loader;
    this.materialSwapper = materialSwapper;
  }

  async preloadAll(onProgress?: (loaded: number, total: number) => void) {
    const urls = MODELS.map((m) => m.file);
    const gltfs = await this.loader.preloadAll(urls, onProgress);
    MODELS.forEach((entry, i) => {
      this.gltfCache.set(entry.id, gltfs[i]);
    });
  }

  async switchModel(entryId: string) {
    const entry = MODELS.find((m) => m.id === entryId);
    if (!entry) return;

    const gltf = this.gltfCache.get(entry.id);
    if (!gltf) return;

    // Fade out current model
    if (this.currentModel) {
      const oldModel = this.currentModel;
      gsap.to(oldModel.scale, {
        x: 0.9,
        y: 0.9,
        z: 0.9,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          this.scene.remove(oldModel);
        },
      });
      gsap.to(oldModel, {
        duration: 0.3,
        onUpdate: () => {
          oldModel.traverse((child) => {
            if ((child as any).isMesh && (child as any).material) {
              const mat = (child as any).material;
              if (mat.transparent !== undefined) {
                mat.transparent = true;
                mat.opacity = Math.max(0, mat.opacity - 0.05);
              }
            }
          });
        },
      });
    }

    // Clone the scene so we can reuse the cached original
    const newModel = gltf.scene.clone(true);

    // Apply current finish
    this.materialSwapper.applyCurrentFinish(newModel);

    // Start small and transparent
    newModel.scale.set(0.9, 0.9, 0.9);
    this.scene.add(newModel);

    // Fade in
    gsap.to(newModel.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.5,
      ease: 'power2.out',
      delay: 0.2,
    });

    this.currentModel = newModel;
    this.currentEntry = entry;
    this.onModelChange?.(entry);
  }

  getCurrentModel(): Group | null {
    return this.currentModel;
  }

  getCurrentEntry(): ModelEntry | null {
    return this.currentEntry;
  }

  reapplyMaterials() {
    if (this.currentModel) {
      this.materialSwapper.applyCurrentFinish(this.currentModel);
    }
  }
}
