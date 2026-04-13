import { MODELS, ModelEntry } from '../utils/AssetManifest';
import { FINISHES, FinishPreset } from '../materials/FinishLibrary';
import { ENVIRONMENTS, EnvironmentPreset } from '../scene/EnvironmentManager';

export interface UICallbacks {
  onModelSelect: (id: string) => void;
  onFinishSelect: (id: string) => void;
  onEnvironmentSelect: (id: string) => void;
  onExposureChange: (value: number) => void;
  onCameraPreset: (preset: string) => void;
  onAutoRotateToggle: (enabled: boolean) => void;
  onScreenshot: () => void;
  onFullscreen: () => void;
}

export class UIOverlay {
  private overlay: HTMLElement;
  private callbacks: UICallbacks;
  private modelInfoName!: HTMLElement;
  private modelInfoCategory!: HTMLElement;
  private modelInfoSku!: HTMLElement;
  private finishBadgeName!: HTMLElement;
  private finishBadgeDot!: HTMLElement;
  private panelOpen = false;
  private autoRotate = true;
  private currentModelId = MODELS[0].id;
  private currentFinishId = FINISHES[0].id;
  private exposureValue = 1.0;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;
    this.overlay = document.getElementById('ui-overlay')!;
    this.buildUI();
    this.bindKeyboard();
  }

  private buildUI() {
    this.overlay.innerHTML = `
      <div class="top-bar">
        <div class="brand-container">
          <img src="/asset/logo.svg" alt="GESSI" class="brand-logo" />
          <div class="brand-sub">Virtual Showroom</div>
        </div>
        <div class="top-actions">
          <button class="action-btn" id="btn-autorotate" title="Auto Rotate">
            <svg viewBox="0 0 24 24"><path d="M21.5 2v6h-6"/><path d="M21.34 13.72A10 10 0 1 1 18.57 4.53l2.93-2.53"/></svg>
            <span class="tooltip">Rotate</span>
          </button>
          <button class="action-btn" id="btn-screenshot" title="Screenshot">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
            <span class="tooltip">Screenshot</span>
          </button>
          <button class="action-btn" id="btn-fullscreen" title="Fullscreen">
            <svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
            <span class="tooltip">Fullscreen</span>
          </button>
          <button class="panel-toggle" id="btn-panel" title="Settings">
            <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>

      <div class="model-info">
        <div class="model-collection">Perle Collection</div>
        <div class="model-name" id="model-name">${MODELS[0].name}</div>
        <div class="model-category" id="model-category">${MODELS[0].category}</div>
        <div class="model-sku" id="model-sku">${MODELS[0].id}</div>
        <div class="finish-badge">
          <span class="finish-badge-dot" id="finish-badge-dot" style="background: ${FINISHES[0].swatchColor}"></span>
          <span class="finish-badge-name" id="finish-badge-name">${FINISHES[0].name}</span>
        </div>
      </div>

      <div class="side-panel" id="side-panel">
        <div class="side-panel-inner">

          <div class="panel-section">
            <div class="panel-section-title">Model</div>
            <div class="model-grid">
              ${MODELS.map(
                (m, i) =>
                  `<div class="model-card ${i === 0 ? 'active' : ''}" data-model="${m.id}">
                    <div class="model-card-name">${m.name}</div>
                  </div>`
              ).join('')}
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-section-title">Finish</div>
            <div class="finish-grid">
              ${FINISHES.map(
                (f, i) =>
                  `<div class="finish-option ${i === 0 ? 'active' : ''}" data-finish="${f.id}">
                    <div class="finish-swatch" style="background: ${f.swatchColor}"></div>
                    <span class="finish-label">${f.name}</span>
                  </div>`
              ).join('')}
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-section-title">Scene</div>
            <div class="scene-list">
              ${ENVIRONMENTS.map(
                (e, i) =>
                  `<button class="scene-btn ${i === 0 ? 'active' : ''}" data-env="${e.id}">
                    <span class="scene-icon"></span>
                    ${e.name}
                  </button>`
              ).join('')}
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-section-title">Camera</div>
            <div class="camera-grid">
              <button class="camera-btn" data-camera="front">Front</button>
              <button class="camera-btn" data-camera="side">Side</button>
              <button class="camera-btn" data-camera="top">Top</button>
              <button class="camera-btn" data-camera="detail">Detail</button>
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-section-title">Exposure</div>
            <div class="exposure-control">
              <input type="range" class="exposure-slider" id="exposure-slider" min="0.3" max="2.5" step="0.05" value="1.0" />
              <span class="exposure-label" id="exposure-label">1.0</span>
            </div>
          </div>

        </div>
      </div>

      <div class="bottom-controls">
        ${FINISHES.map(
          (f, i) =>
            `<button class="bottom-btn ${i === 0 ? 'active' : ''}" data-quick-finish="${f.id}" title="${f.name}">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="${f.swatchColor}" stroke="none"/></svg>
              <span class="tooltip">${f.name}</span>
            </button>`
        ).join('')}
        <div class="bottom-separator"></div>
        ${MODELS.map(
          (m, i) =>
            `<button class="bottom-btn ${i === 0 ? 'active' : ''}" data-quick-model="${m.id}" title="${m.name}">
              <svg viewBox="0 0 24 24"><text x="12" y="16" text-anchor="middle" fill="currentColor" stroke="none" font-size="12" font-family="DM Sans">${i + 1}</text></svg>
              <span class="tooltip">${m.name}</span>
            </button>`
        ).join('')}
      </div>

      <div class="rfid-indicator" id="rfid-indicator">
        <span class="rfid-dot"></span>
        <span class="rfid-label" id="rfid-label">RFID</span>
      </div>

      <div class="kbd-hint">
        <div class="kbd-item"><span class="kbd-key">R</span><span class="kbd-desc">Rotate</span></div>
        <div class="kbd-item"><span class="kbd-key">S</span><span class="kbd-desc">Screenshot</span></div>
        <div class="kbd-item"><span class="kbd-key">F</span><span class="kbd-desc">Fullscreen</span></div>
        <div class="kbd-item"><span class="kbd-key">P</span><span class="kbd-desc">Panel</span></div>
      </div>
    `;

    this.modelInfoName = document.getElementById('model-name')!;
    this.modelInfoCategory = document.getElementById('model-category')!;
    this.modelInfoSku = document.getElementById('model-sku')!;
    this.finishBadgeName = document.getElementById('finish-badge-name')!;
    this.finishBadgeDot = document.getElementById('finish-badge-dot')!;

    this.bindEvents();
  }

  private bindEvents() {
    // Panel toggle
    const panelBtn = document.getElementById('btn-panel')!;
    panelBtn.addEventListener('click', () => this.togglePanel());

    // Auto-rotate
    const rotateBtn = document.getElementById('btn-autorotate')!;
    rotateBtn.classList.add('active');
    rotateBtn.addEventListener('click', () => {
      this.autoRotate = !this.autoRotate;
      rotateBtn.classList.toggle('active', this.autoRotate);
      this.callbacks.onAutoRotateToggle(this.autoRotate);
    });

    // Screenshot
    document.getElementById('btn-screenshot')!.addEventListener('click', () => {
      this.callbacks.onScreenshot();
    });

    // Fullscreen
    document.getElementById('btn-fullscreen')!.addEventListener('click', () => {
      this.callbacks.onFullscreen();
    });

    // Model cards (panel)
    this.overlay.querySelectorAll('.model-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.model!;
        this.selectModel(id);
      });
    });

    // Quick model buttons (bottom)
    this.overlay.querySelectorAll('[data-quick-model]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.quickModel!;
        this.selectModel(id);
      });
    });

    // Finish options (panel)
    this.overlay.querySelectorAll('.finish-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const id = (opt as HTMLElement).dataset.finish!;
        this.selectFinish(id);
      });
    });

    // Quick finish buttons (bottom)
    this.overlay.querySelectorAll('[data-quick-finish]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.quickFinish!;
        this.selectFinish(id);
      });
    });

    // Scene buttons
    this.overlay.querySelectorAll('.scene-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.overlay.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onEnvironmentSelect((btn as HTMLElement).dataset.env!);
      });
    });

    // Camera presets
    this.overlay.querySelectorAll('.camera-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.overlay.querySelectorAll('.camera-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onCameraPreset((btn as HTMLElement).dataset.camera!);
        // Remove active after animation
        setTimeout(() => btn.classList.remove('active'), 1200);
      });
    });

    // Exposure slider
    const slider = document.getElementById('exposure-slider') as HTMLInputElement;
    const label = document.getElementById('exposure-label')!;
    slider?.addEventListener('input', () => {
      this.exposureValue = parseFloat(slider.value);
      label.textContent = this.exposureValue.toFixed(1);
      this.callbacks.onExposureChange(this.exposureValue);
    });
  }

  private selectModel(id: string) {
    this.currentModelId = id;
    // Update panel cards
    this.overlay.querySelectorAll('.model-card').forEach((c) => {
      c.classList.toggle('active', (c as HTMLElement).dataset.model === id);
    });
    // Update bottom buttons
    this.overlay.querySelectorAll('[data-quick-model]').forEach((b) => {
      b.classList.toggle('active', (b as HTMLElement).dataset.quickModel === id);
    });
    this.callbacks.onModelSelect(id);
  }

  private selectFinish(id: string) {
    this.currentFinishId = id;
    // Update panel options
    this.overlay.querySelectorAll('.finish-option').forEach((o) => {
      o.classList.toggle('active', (o as HTMLElement).dataset.finish === id);
    });
    // Update bottom buttons
    this.overlay.querySelectorAll('[data-quick-finish]').forEach((b) => {
      b.classList.toggle('active', (b as HTMLElement).dataset.quickFinish === id);
    });
    this.callbacks.onFinishSelect(id);
  }

  private togglePanel() {
    this.panelOpen = !this.panelOpen;
    document.getElementById('side-panel')!.classList.toggle('open', this.panelOpen);
    document.getElementById('btn-panel')!.classList.toggle('active', this.panelOpen);
  }

  private bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger on input elements
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case 'r':
          this.autoRotate = !this.autoRotate;
          document.getElementById('btn-autorotate')!.classList.toggle('active', this.autoRotate);
          this.callbacks.onAutoRotateToggle(this.autoRotate);
          break;
        case 's':
          this.callbacks.onScreenshot();
          break;
        case 'f':
          this.callbacks.onFullscreen();
          break;
        case 'p':
          this.togglePanel();
          break;
        case '1': case '2': case '3': case '4':
          const idx = parseInt(e.key) - 1;
          if (idx < MODELS.length) this.selectModel(MODELS[idx].id);
          break;
        case 'escape':
          if (this.panelOpen) this.togglePanel();
          break;
      }
    });
  }

  updateModelInfo(entry: ModelEntry) {
    this.modelInfoName.textContent = entry.name;
    this.modelInfoCategory.textContent = entry.category;
    this.modelInfoSku.textContent = entry.id;
  }

  updateFinishInfo(finish: FinishPreset) {
    this.finishBadgeName.textContent = finish.name;
    this.finishBadgeDot.style.background = finish.swatchColor;
  }

  /** Called by RFID service to update indicator */
  setRfidStatus(connected: boolean, label?: string) {
    const el = document.getElementById('rfid-indicator')!;
    el.classList.toggle('visible', true);
    el.classList.toggle('connected', connected);
    if (label) {
      document.getElementById('rfid-label')!.textContent = label;
    }
  }

  /** Programmatically select a finish (e.g., from RFID) */
  triggerFinishSelect(finishId: string) {
    this.selectFinish(finishId);
  }

  showToast(message: string) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 2000);
  }

  show() {
    this.overlay.classList.add('visible');
  }
}
