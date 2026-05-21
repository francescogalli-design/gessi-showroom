import gsap from 'gsap';
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
  onBluetoothConnect: () => void;
  onDayNightCycle: () => void;
}

export class UIOverlay {
  private overlay: HTMLElement;
  private callbacks: UICallbacks;
  private modelInfoName!: HTMLElement;
  private modelInfoCategory!: HTMLElement;
  private modelInfoSku!: HTMLElement;
  private finishBadgeName!: HTMLElement;
  private finishBadgeDot!: HTMLElement;
  private vbarName!: HTMLElement;
  // Elements toggled by GSAP between visitor and admin mode
  private elTopBar!: HTMLElement;
  private elModelInfo!: HTMLElement;
  private elBottomControls!: HTMLElement;
  private elKbdHint!: HTMLElement;
  private elVisitorBar!: HTMLElement;
  private panelOpen = false;
  private autoRotate = true;
  private adminMode = false;
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
          <div class="brand-sub">
            Virtual Showroom
            <span class="beta-tag">BETA</span>
          </div>
        </div>
        <div class="top-actions">
          <button class="action-btn" id="btn-daynightcycle" title="Day / Golden Hour / Night">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <span class="tooltip">Light Cycle</span>
          </button>
          <button class="action-btn" id="btn-bluetooth" title="Connect NFC via Bluetooth">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/></svg>
            <span class="bt-led" id="bt-led"></span>
            <span class="tooltip">Connect NFC</span>
          </button>
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
                  `<button class="scene-btn ${i === 1 ? 'active' : ''}" data-env="${e.id}">
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
            `<button class="finish-dot ${i === 0 ? 'active' : ''}" data-quick-finish="${f.id}" style="--swatch:${f.swatchColor}">
              <span class="tooltip">${f.name}</span>
            </button>`
        ).join('')}
        <div class="bottom-separator"></div>
        ${MODELS.map(
          (m, i) =>
            `<button class="model-dot ${i === 0 ? 'active' : ''}" data-quick-model="${m.id}">
              <span class="tooltip">${m.name}</span>
              ${i + 1}
            </button>`
        ).join('')}
      </div>

      <div class="rfid-indicator" id="rfid-indicator">
        <span class="rfid-dot"></span>
        <span class="rfid-label" id="rfid-label">NFC</span>
      </div>

      <div class="kbd-hint">
        <div class="kbd-item"><span class="kbd-key">R</span><span class="kbd-desc">Rotate</span></div>
        <div class="kbd-item"><span class="kbd-key">S</span><span class="kbd-desc">Screenshot</span></div>
        <div class="kbd-item"><span class="kbd-key">F</span><span class="kbd-desc">Fullscreen</span></div>
        <div class="kbd-item"><span class="kbd-key">P</span><span class="kbd-desc">Panel</span></div>
        <div class="kbd-item"><span class="kbd-key">H</span><span class="kbd-desc">Hide UI</span></div>
        <div class="kbd-item"><span class="kbd-key">N</span><span class="kbd-desc">Night Cycle</span></div>
        <div class="kbd-item"><span class="kbd-key">\\</span><span class="kbd-desc">Visitor Mode</span></div>
      </div>

      <!-- ═══ VISITOR BAR — default minimal presentation mode ═══ -->
      <div class="visitor-bar" id="visitor-bar">
        <div class="vbar-model">
          <span class="vbar-collection">Perle Collection</span>
          <span class="vbar-name" id="vbar-name">${MODELS[0].name}</span>
        </div>
        <div class="vbar-pill">
          ${FINISHES.map(
            (f, i) =>
              `<button class="vbar-swatch ${i === 0 ? 'active' : ''}" data-vfinish="${f.id}" style="--sw:${f.swatchColor}"><span class="vbar-tooltip">${f.name}</span></button>`
          ).join('')}
          <div class="vbar-sep"></div>
          ${ENVIRONMENTS.map(
            (e, i) =>
              `<button class="vbar-scene-btn ${i === 1 ? 'active' : ''}" data-venv="${e.id}">${e.name}</button>`
          ).join('')}
        </div>
      </div>
    `;

    this.modelInfoName = document.getElementById('model-name')!;
    this.modelInfoCategory = document.getElementById('model-category')!;
    this.modelInfoSku = document.getElementById('model-sku')!;
    this.finishBadgeName = document.getElementById('finish-badge-name')!;
    this.finishBadgeDot = document.getElementById('finish-badge-dot')!;
    this.vbarName = document.getElementById('vbar-name')!;
    this.elTopBar = this.overlay.querySelector('.top-bar')!;
    this.elModelInfo = this.overlay.querySelector('.model-info')!;
    this.elBottomControls = this.overlay.querySelector('.bottom-controls')!;
    this.elKbdHint = this.overlay.querySelector('.kbd-hint')!;
    this.elVisitorBar = document.getElementById('visitor-bar')!;

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

    // Day/Night cycle button
    document.getElementById('btn-daynightcycle')!.addEventListener('click', () => {
      this.callbacks.onDayNightCycle();
    });

    // Bluetooth NFC connect
    document.getElementById('btn-bluetooth')!.addEventListener('click', () => {
      this.callbacks.onBluetoothConnect();
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

    // Scene buttons (admin panel)
    this.overlay.querySelectorAll('.scene-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const envId = (btn as HTMLElement).dataset.env!;
        this.overlay.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.overlay.querySelectorAll('.vbar-scene-btn').forEach((b) => {
          b.classList.toggle('active', (b as HTMLElement).dataset.venv === envId);
        });
        this.callbacks.onEnvironmentSelect(envId);
      });
    });

    // Visitor bar — finish swatches
    this.overlay.querySelectorAll('.vbar-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.vfinish!;
        this.selectFinish(id);
      });
    });

    // Visitor bar — scene buttons
    this.overlay.querySelectorAll('.vbar-scene-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const envId = (btn as HTMLElement).dataset.venv!;
        this.overlay.querySelectorAll('.vbar-scene-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.overlay.querySelectorAll('.scene-btn').forEach((b) => {
          b.classList.toggle('active', (b as HTMLElement).dataset.env === envId);
        });
        this.callbacks.onEnvironmentSelect(envId);
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
    this.overlay.querySelectorAll('.model-card').forEach((c) => {
      c.classList.toggle('active', (c as HTMLElement).dataset.model === id);
    });
    this.overlay.querySelectorAll('.model-dot').forEach((b) => {
      b.classList.toggle('active', (b as HTMLElement).dataset.quickModel === id);
    });
    this.callbacks.onModelSelect(id);
  }

  private selectFinish(id: string) {
    this.currentFinishId = id;
    this.overlay.querySelectorAll('.finish-option').forEach((o) => {
      o.classList.toggle('active', (o as HTMLElement).dataset.finish === id);
    });
    this.overlay.querySelectorAll('.finish-dot').forEach((b) => {
      b.classList.toggle('active', (b as HTMLElement).dataset.quickFinish === id);
    });
    this.overlay.querySelectorAll('.vbar-swatch').forEach((b) => {
      b.classList.toggle('active', (b as HTMLElement).dataset.vfinish === id);
    });
    this.callbacks.onFinishSelect(id);
  }

  private togglePanel() {
    this.panelOpen = !this.panelOpen;
    document.getElementById('side-panel')!.classList.toggle('open', this.panelOpen);
    document.getElementById('btn-panel')!.classList.toggle('active', this.panelOpen);
  }

  private toggleAdminMode() {
    this.adminMode = !this.adminMode;
    document.body.classList.toggle('visitor-mode', !this.adminMode);

    const adminEls = [this.elTopBar, this.elModelInfo, this.elBottomControls];

    if (this.adminMode) {
      // Entering admin: fade visitor bar out, slide admin elements in
      gsap.to(this.elVisitorBar, { opacity: 0, duration: 0.28, ease: 'power2.in' });
      gsap.to(this.elTopBar, { opacity: 1, y: 0, duration: 0.48, delay: 0.08, ease: 'power2.out' });
      gsap.to(this.elModelInfo, { opacity: 1, y: 0, duration: 0.48, delay: 0.13, ease: 'power2.out' });
      gsap.to(this.elBottomControls, { opacity: 1, y: 0, duration: 0.48, delay: 0.18, ease: 'power2.out' });
      gsap.to(this.elKbdHint, { opacity: 1, duration: 0.45, delay: 0.9, ease: 'power2.out' });
    } else {
      // Leaving admin: collapse panel, fade admin elements out, slide visitor bar in
      if (this.panelOpen) this.togglePanel();
      gsap.to(adminEls, { opacity: 0, duration: 0.32, ease: 'power2.in' });
      gsap.to(this.elKbdHint, { opacity: 0, duration: 0.22, ease: 'power2.in' });
      gsap.to(this.elTopBar, { y: -8, duration: 0.32, ease: 'power2.in' });
      gsap.to(this.elModelInfo, { y: 6, duration: 0.32, ease: 'power2.in' });
      gsap.to(this.elBottomControls, { y: 6, duration: 0.32, ease: 'power2.in' });
      gsap.to(this.elVisitorBar, { opacity: 1, duration: 0.5, delay: 0.22, ease: 'power2.out' });
    }
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
        case 'h':
          document.body.classList.toggle('ui-hidden');
          break;
        case 'n':
          this.callbacks.onDayNightCycle();
          break;
        case '1': case '2': case '3': case '4':
          const idx = parseInt(e.key) - 1;
          if (idx < MODELS.length) this.selectModel(MODELS[idx].id);
          break;
        case '\\':
          if (!e.shiftKey) {
            e.preventDefault();
            this.toggleAdminMode();
          }
          break;
        case 'escape':
          if (document.body.classList.contains('ui-hidden')) {
            document.body.classList.remove('ui-hidden');
          } else if (this.panelOpen) {
            this.togglePanel();
          } else if (this.adminMode) {
            this.toggleAdminMode(); // back to visitor mode
          }
          break;
      }
    });
  }

  updateModelInfo(entry: ModelEntry) {
    this.modelInfoName.textContent = entry.name;
    this.modelInfoCategory.textContent = entry.category;
    this.modelInfoSku.textContent = entry.id;
    if (this.vbarName) this.vbarName.textContent = entry.name;
  }

  updateFinishInfo(finish: FinishPreset) {
    this.finishBadgeName.textContent = finish.name;
    this.finishBadgeDot.style.background = finish.swatchColor;
  }

  /** Called by Bluetooth NFC service to update indicator + top-bar LED */
  setRfidStatus(connected: boolean, label?: string, connecting = false) {
    const indicator = document.getElementById('rfid-indicator')!;
    indicator.classList.add('visible');
    indicator.classList.toggle('connected', connected);
    indicator.classList.toggle('connecting', connecting && !connected);
    if (label) {
      document.getElementById('rfid-label')!.textContent = label;
    }

    // Top-bar BT LED
    const led = document.getElementById('bt-led');
    if (led) {
      led.classList.toggle('bt-led--connecting', connecting && !connected);
      led.classList.toggle('bt-led--connected', connected);
      led.classList.toggle('bt-led--off', !connected && !connecting);
    }

    const btn = document.getElementById('btn-bluetooth');
    if (btn) btn.classList.toggle('active', connected);
  }

  /** Programmatically select a finish (e.g., from RFID) */
  triggerFinishSelect(finishId: string) {
    this.selectFinish(finishId);
  }

  setTheme(light: boolean) {
    document.body.classList.toggle('theme-light', light);
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
    document.body.classList.add('visitor-mode');

    // Set initial state via GSAP — bypasses any CSS cascade fights
    gsap.set(this.elTopBar, { opacity: 0, y: -8 });
    gsap.set(this.elModelInfo, { opacity: 0, y: 6 });
    gsap.set(this.elBottomControls, { opacity: 0, y: 6 });
    gsap.set(this.elKbdHint, { opacity: 0 });
    gsap.set(this.elVisitorBar, { opacity: 1 });
  }
}
