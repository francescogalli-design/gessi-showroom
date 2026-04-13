import {
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from 'three';
import { FinishPreset, FINISHES } from './FinishLibrary';

// Material name patterns that represent the main metal surface
const METAL_MATERIAL_PATTERNS = [
  /Main$/i,
  /Perno$/i,
  /Maniglia$/i,
  /Bocca$/i,
  /Corpo$/i,
  /Cartuccia$/i,
  /Rosone$/i,
];

// Material names to skip (accent pieces, non-metal parts)
const SKIP_PATTERNS = [
  /Logo/i,
  /Filtro/i,
  /Retino/i,
  /Onice/i,
  /Plastica/i,
  /Guarnizione/i,
  /Glass/i,
  /Vetro/i,
];

export class MaterialSwapper {
  private currentFinish: FinishPreset;
  public onFinishChange?: (finish: FinishPreset) => void;

  constructor() {
    this.currentFinish = FINISHES[0]; // Default to Chrome
  }

  private isMetalMaterial(name: string): boolean {
    // Skip known non-metal materials
    if (SKIP_PATTERNS.some((p) => p.test(name))) return false;
    // Match known metal material names
    if (METAL_MATERIAL_PATTERNS.some((p) => p.test(name))) return true;
    // If no pattern matches, check if it looks metallic by name
    if (/metal/i.test(name) || /chrome/i.test(name) || /steel/i.test(name)) return true;
    return false;
  }

  applyFinish(model: Group, finish: FinishPreset) {
    this.currentFinish = finish;

    model.traverse((child) => {
      if (!(child as Mesh).isMesh) return;
      const mesh = child as Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((mat, index) => {
        if (!(mat instanceof MeshStandardMaterial) && !(mat instanceof MeshPhysicalMaterial)) return;

        const name = mat.name || '';

        // For metals with matching names, apply finish
        // Also apply to unnamed materials or materials with metalness > 0.5 (likely metal)
        const shouldSwap = this.isMetalMaterial(name) ||
          (!name && mat.metalness > 0.5) ||
          (mat.metalness > 0.8 && !SKIP_PATTERNS.some((p) => p.test(name)));

        if (!shouldSwap) return;

        const newMat = new MeshPhysicalMaterial({
          color: finish.color,
          metalness: finish.metalness,
          roughness: finish.roughness,
          envMapIntensity: finish.envMapIntensity,
          clearcoat: finish.clearcoat,
          clearcoatRoughness: finish.clearcoatRoughness,
          // Preserve original normal map for surface detail
          normalMap: mat.normalMap,
          normalScale: mat.normalScale.clone(),
        });

        if (Array.isArray(mesh.material)) {
          mesh.material[index] = newMat;
        } else {
          mesh.material = newMat;
        }
      });
    });

    this.onFinishChange?.(finish);
  }

  applyCurrentFinish(model: Group) {
    this.applyFinish(model, this.currentFinish);
  }

  setFinish(finishId: string, model?: Group | null) {
    const finish = FINISHES.find((f) => f.id === finishId);
    if (!finish) return;
    this.currentFinish = finish;
    if (model) {
      this.applyFinish(model, finish);
    }
  }

  getCurrentFinish(): FinishPreset {
    return this.currentFinish;
  }
}
