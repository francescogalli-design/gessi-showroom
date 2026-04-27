/**
 * BluetoothNFCService — connects to the ESP32 NFC-Reader via Web Bluetooth.
 *
 * The ESP32 exposes one BLE characteristic that notifies when an NFC tag
 * is scanned. The raw value is either a plain UID string or JSON { uid: "..." }.
 *
 * Service UUID  : 4fafc201-1fb5-459e-8fcc-c5c9c331914b
 * Characteristic: beb5483e-36e1-4688-b7f5-ea07361b26a8
 *
 * Usage (requires a user-gesture to call connect()):
 *   const svc = new BluetoothNFCService({ tagMap: { ... } });
 *   svc.onFinishDetected = (id) => materialSwapper.setFinish(id, model);
 *   svc.onConnectionChange = (connected) => ui.setBluetoothStatus(connected);
 *   await svc.connect(); // opens browser BT picker
 */

const SERVICE_UUID        = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

// Default mapping — NFC tag UID → finish ID
// Keys match the UIDs the ESP32 sends (dash-separated uppercase bytes).
const DEFAULT_TAG_MAP: Record<string, string> = {
  '04-7B-AF-6F-B3-2A-81': 'chrome',
  '04-7A-AF-6F-B3-2A-81': 'brushed-nickel',
  '04-71-AF-6F-B3-2A-81': 'copper',
  '04-7C-AF-6F-B3-2A-81': 'brushed-gold',
};

export interface BluetoothNFCConfig {
  tagMap?: Record<string, string>;
}

export class BluetoothNFCService {
  private tagMap: Record<string, string>;
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private _connected = false;

  onFinishDetected: ((finishId: string) => void) | null = null;
  onConnectionChange: ((connected: boolean) => void) | null = null;
  onTagScanned: ((uid: string, finishId: string | null) => void) | null = null;

  constructor(config: BluetoothNFCConfig = {}) {
    this.tagMap = { ...DEFAULT_TAG_MAP, ...(config.tagMap ?? {}) };
  }

  get connected() {
    return this._connected;
  }

  get isAvailable() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('Web Bluetooth not supported in this browser.');
    }

    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'NFC-Reader' }],
      optionalServices: [SERVICE_UUID],
    });

    this.device.addEventListener('gattserverdisconnected', () => {
      this.setConnected(false);
    });

    await this.connectGATT();
  }

  disconnect() {
    this.characteristic?.removeEventListener('characteristicvaluechanged', this.onValue);
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.setConnected(false);
  }

  updateTagMap(map: Record<string, string>) {
    this.tagMap = { ...this.tagMap, ...map };
  }

  private async connectGATT() {
    if (!this.device?.gatt) return;

    const server  = await this.device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    this.characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    this.characteristic.addEventListener('characteristicvaluechanged', this.onValue);
    await this.characteristic.startNotifications();

    this.setConnected(true);
  }

  private onValue = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const raw = new TextDecoder().decode(target.value!);

    let uid = raw.trim();
    try {
      const parsed = JSON.parse(raw);
      if (parsed.uid) uid = parsed.uid;
    } catch {
      // raw string — use as-is
    }

    this.handleTag(uid);
  };

  private handleTag(uid: string) {
    // Normalize: uppercase, trim whitespace
    const normalized = uid.toUpperCase().trim();
    const finishId = this.tagMap[normalized] ?? null;

    this.onTagScanned?.(normalized, finishId);
    if (finishId) {
      this.onFinishDetected?.(finishId);
    }
  }

  private setConnected(value: boolean) {
    if (this._connected !== value) {
      this._connected = value;
      this.onConnectionChange?.(value);
    }
  }
}
