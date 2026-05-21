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
    if (!entry || entry.id === this.currentEntry?.id) return;

    const gltf = this.gltfCache.get(entry.id);
    if (!gltf) return;

    const oldModel = this.currentModel;

    type MatEntry = { mat: any; origTransparent: boolean; origDepthWrite: boolean };

    const collectMats = (group: Group): MatEntry[] => {
      const entries: MatEntry[] = [];
      group.traverse((child: any) => {
        if (!child.isMesh || !child.material) return;
        const rawMats: any[] = Array.isArray(child.material) ? child.material : [child.material];
        const clonedMats = rawMats.map((m: any) => {
          const entry: MatEntry = { mat: m.clone(), origTransparent: m.transparent, origDepthWrite: m.depthWrite };
          entry.mat.transparent = true;
          entry.mat.depthWrite = false;
          entry.mat.needsUpdate = true;
          entries.push(entry);
          return entry.mat;
        });
        child.material = Array.isArray(child.material) ? clonedMats : clonedMats[0];
      });
      return entries;
    };

    // Fade out old model
    if (oldModel) {
      const oldEntries = collectMats(oldModel);
      const out = { t: 1 };
      gsap.to(out, {
        t: 0,
        duration: 0.38,
        ease: 'power2.in',
        onUpdate: () => oldEntries.forEach(({ mat }) => (mat.opacity = out.t)),
        onComplete: () => { this.scene.remove(oldModel); },
      });
      gsap.to(oldModel.position, { y: 0.06, duration: 0.38, ease: 'power2.in' });
    }

    // Prepare new model
    const newModel = gltf.scene.clone(true);
    this.materialSwapper.applyCurrentFinish(newModel);
    const newEntries = collectMats(newModel);
    newEntries.forEach(({ mat }) => (mat.opacity = 0));
    newModel.position.y = -0.06;
    this.scene.add(newModel);

    const delay = oldModel ? 0.18 : 0;
    const into = { t: 0 };
    gsap.to(into, {
      t: 1,
      duration: 0.65,
      ease: 'power2.out',
      delay,
      onUpdate: () => newEntries.forEach(({ mat }) => (mat.opacity = into.t)),
      onComplete: () => {
        // Restore original material state after fade-in completes
        newEntries.forEach(({ mat, origTransparent, origDepthWrite }) => {
          mat.transparent = origTransparent;
          mat.depthWrite = origDepthWrite;
          mat.opacity = 1;
          mat.needsUpdate = true;
        });
      },
    });
    gsap.to(newModel.position, { y: 0, duration: 0.75, ease: 'power3.out', delay });

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
