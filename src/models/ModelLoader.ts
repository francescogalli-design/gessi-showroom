import { Group, Box3, Vector3 } from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class ModelLoader {
  private gltfLoader: GLTFLoader;
  private cache = new Map<string, GLTF>();

  constructor() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
    );
    dracoLoader.setDecoderConfig({ type: 'js' });

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(dracoLoader);
  }

  async load(url: string): Promise<GLTF> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.normalizeModel(gltf.scene);
          this.cache.set(url, gltf);
          resolve(gltf);
        },
        undefined,
        reject
      );
    });
  }

  private normalizeModel(model: Group) {
    // Center the model
    const box = new Box3().setFromObject(model);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());

    // Offset so model sits on the ground plane
    model.position.x = -center.x;
    model.position.z = -center.z;
    model.position.y = -box.min.y;

    // Enable shadows on all meshes
    model.traverse((child) => {
      if ((child as any).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  async preloadAll(
    urls: string[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<GLTF[]> {
    const results: GLTF[] = [];
    const total = urls.length;
    let loaded = 0;

    // Load in parallel
    const promises = urls.map(async (url) => {
      const gltf = await this.load(url);
      loaded++;
      onProgress?.(loaded, total);
      return gltf;
    });

    return Promise.all(promises);
  }
}
