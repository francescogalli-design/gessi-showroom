import {
  WebGLRenderer,
  ACESFilmicToneMapping,
  SRGBColorSpace,
  PCFSoftShadowMap,
} from 'three';

export class Renderer {
  public instance: WebGLRenderer;

  constructor(container: HTMLElement) {
    this.instance = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });

    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.instance.setSize(container.clientWidth, container.clientHeight);
    this.instance.outputColorSpace = SRGBColorSpace;
    this.instance.toneMapping = ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 0.8;
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = PCFSoftShadowMap;

    container.appendChild(this.instance.domElement);

    window.addEventListener('resize', () => this.onResize(container));
  }

  private onResize(container: HTMLElement) {
    this.instance.setSize(container.clientWidth, container.clientHeight);
  }

  dispose() {
    this.instance.dispose();
  }
}
