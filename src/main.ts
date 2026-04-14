import { Scene } from 'three';
import { Renderer } from './engine/Renderer';
import { CameraController } from './engine/CameraController';
import { PostProcessingPipeline } from './engine/PostProcessing';
import { EnvironmentManager, ENVIRONMENTS } from './scene/EnvironmentManager';
import { LightingRig } from './scene/LightingRig';
import { ShowroomEnvironment } from './scene/ShowroomEnvironment';
import { ModelLoader } from './models/ModelLoader';
import { ModelManager } from './models/ModelManager';
import { MaterialSwapper } from './materials/MaterialSwapper';
import { FINISHES } from './materials/FinishLibrary';
import { MODELS } from './utils/AssetManifest';
import { UIOverlay } from './ui/UIOverlay';
import { LoadingScreen } from './ui/LoadingScreen';
import { DustParticles } from './scene/DustParticles';
import { RfidService } from './services/RfidService';
import './styles/main.css';

class App {
  private renderer!: Renderer;
  private scene!: Scene;
  private cameraController!: CameraController;
  private postProcessing!: PostProcessingPipeline;
  private environmentManager!: EnvironmentManager;
  private showroom!: ShowroomEnvironment;
  private modelManager!: ModelManager;
  private materialSwapper!: MaterialSwapper;
  private ui!: UIOverlay;
  private loadingScreen!: LoadingScreen;
  private dustParticles!: DustParticles;
  private rfidService: RfidService | null = null;
  private clock = 0;
  private lastTime = performance.now();

  async init() {
    const container = document.getElementById('app')!;

    // Core systems
    this.scene = new Scene();
    this.renderer = new Renderer(container);
    this.cameraController = new CameraController(
      this.renderer.instance.domElement,
      container
    );

    // Post-processing
    this.postProcessing = new PostProcessingPipeline(
      this.renderer.instance,
      this.scene,
      this.cameraController.camera
    );

    // Handle resize for post-processing
    window.addEventListener('resize', () => {
      this.postProcessing.setSize(container.clientWidth, container.clientHeight);
    });

    // Loading screen
    this.loadingScreen = new LoadingScreen();

    // Environment
    this.loadingScreen.setProgress(5, 'Loading environments...');
    this.environmentManager = new EnvironmentManager(this.scene, this.renderer.instance);

    // Showroom geometry
    this.showroom = new ShowroomEnvironment(this.scene);

    // Connect environment changes to showroom mode
    this.environmentManager.onEnvironmentChange = (preset) => {
      if (preset.showAsBackground) {
        this.showroom.setVisible(false);
      } else {
        this.showroom.setVisible(true);
        this.showroom.setMode(preset.lightMode ? 'light' : 'dark');
      }
    };

    // Load and apply the studio environment first
    // Default: Studio Light (index 1)
    await this.environmentManager.loadEnvironment(ENVIRONMENTS[1]);
    this.loadingScreen.setProgress(25, 'Loading environments...');

    // Preload remaining environments in background
    for (let i = 0; i < ENVIRONMENTS.length; i++) {
      if (i !== 1) this.environmentManager.preloadOnly(ENVIRONMENTS[i]);
    }

    this.loadingScreen.setProgress(35, 'Loading lighting...');

    // Lighting
    new LightingRig(this.scene);

    // Atmospheric dust particles
    this.dustParticles = new DustParticles(this.scene, 80);

    // Materials
    this.materialSwapper = new MaterialSwapper();

    // Model loading
    this.loadingScreen.setProgress(40, 'Loading 3D models...');
    const modelLoader = new ModelLoader();
    this.modelManager = new ModelManager(this.scene, modelLoader, this.materialSwapper);

    await this.modelManager.preloadAll((loaded, total) => {
      const progress = 40 + (loaded / total) * 50;
      this.loadingScreen.setProgress(progress, `Loading model ${loaded}/${total}...`);
    });

    this.loadingScreen.setProgress(92, 'Preparing showroom...');

    // Show first model
    await this.modelManager.switchModel(MODELS[0].id);

    // UI
    this.ui = new UIOverlay({
      onModelSelect: (id) => this.onModelSelect(id),
      onFinishSelect: (id) => this.onFinishSelect(id),
      onEnvironmentSelect: (id) => this.onEnvironmentSelect(id),
      onExposureChange: (value) => this.onExposureChange(value),
      onCameraPreset: (preset) => this.cameraController.goToPreset(preset),
      onAutoRotateToggle: (enabled) => this.cameraController.setAutoRotate(enabled),
      onScreenshot: () => this.takeScreenshot(),
      onFullscreen: () => this.toggleFullscreen(),
    });

    this.modelManager.onModelChange = (entry) => {
      this.ui.updateModelInfo(entry);
    };

    this.materialSwapper.onFinishChange = (finish) => {
      this.ui.updateFinishInfo(finish);
    };

    // RFID — initialize from URL params or config
    this.initRfid();

    // Start
    this.loadingScreen.setProgress(100, 'Ready');
    this.loadingScreen.hide();
    setTimeout(() => this.ui.show(), 600);

    this.animate();
  }

  private onModelSelect(id: string) {
    this.modelManager.switchModel(id);
  }

  private onFinishSelect(id: string) {
    const model = this.modelManager.getCurrentModel();
    this.materialSwapper.setFinish(id, model);
  }

  private async onEnvironmentSelect(id: string) {
    const preset = ENVIRONMENTS.find((e) => e.id === id);
    if (preset) {
      await this.environmentManager.loadEnvironment(preset);
    }
  }

  private onExposureChange(value: number) {
    this.renderer.instance.toneMappingExposure = value;
  }

  /**
   * Screenshot — renders one frame with preserveDrawingBuffer,
   * captures as PNG, and downloads.
   */
  private takeScreenshot() {
    // Force a clean render
    this.postProcessing.render();

    // Get the canvas data
    const canvas = this.renderer.instance.domElement;

    // Use toBlob for better quality
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      a.download = `gessi-showroom-${timestamp}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');

    // Flash effect
    const flash = document.createElement('div');
    flash.className = 'screenshot-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    this.ui.showToast('Screenshot saved');
  }

  private toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      document.body.classList.add('fullscreen');
    } else {
      document.exitFullscreen();
      document.body.classList.remove('fullscreen');
    }
  }

  /**
   * RFID initialization.
   * Pass ?rfid=192.168.1.xx in URL to auto-connect,
   * or call window.__connectRfid('host') from console.
   */
  private initRfid() {
    const params = new URLSearchParams(window.location.search);
    const rfidHost = params.get('rfid');

    // Expose global API for runtime configuration
    (window as any).__connectRfid = (host: string, port?: number) => {
      this.connectRfid(host, port);
    };

    (window as any).__updateTagMap = (map: Record<string, string>) => {
      if (this.rfidService) {
        this.rfidService.updateTagMap(map);
        this.ui.showToast('Tag map updated');
      }
    };

    if (rfidHost) {
      const rfidPort = parseInt(params.get('rfid_port') || '80');
      this.connectRfid(rfidHost, rfidPort);
    }
  }

  private connectRfid(host: string, port = 80) {
    if (this.rfidService) {
      this.rfidService.disconnect();
    }

    this.rfidService = new RfidService({ host, port });

    this.rfidService.onConnectionChange = (connected) => {
      this.ui.setRfidStatus(connected, connected ? 'RFID Connected' : 'RFID Disconnected');
    };

    this.rfidService.onFinishDetected = (finishId) => {
      this.ui.triggerFinishSelect(finishId);
      const finish = FINISHES.find((f) => f.id === finishId);
      if (finish) {
        this.ui.showToast(`RFID → ${finish.name}`);
      }
    };

    this.rfidService.onTagScanned = (uid, finishId) => {
      if (!finishId) {
        this.ui.showToast(`Unknown tag: ${uid}`);
      }
    };

    this.rfidService.connect();
    this.ui.setRfidStatus(false, 'RFID Connecting...');
    this.ui.showToast(`Connecting to RFID at ${host}...`);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.cameraController.update();
    this.dustParticles.update(delta);
    this.postProcessing.render();
  };
}

const app = new App();
app.init().catch(console.error);
