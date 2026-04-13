/**
 * RFID Service — connects to ESPHome device via WebSocket/REST
 * to receive NFC/RFID tag scans and map them to finish presets.
 *
 * ESPHome exposes a native API or can be configured with
 * a web_server component that provides events via EventSource (SSE).
 *
 * Usage:
 *   const rfid = new RfidService({ host: '192.168.1.xx' });
 *   rfid.onFinishDetected = (finishId) => { ... };
 *   rfid.connect();
 */

export interface RfidConfig {
  host: string;          // ESPHome device IP/hostname
  port?: number;         // Default 80
  protocol?: 'ws' | 'sse'; // WebSocket or Server-Sent Events (default: sse)
  tagMap?: Record<string, string>; // RFID UID → finish ID mapping
}

const DEFAULT_TAG_MAP: Record<string, string> = {
  // Example mappings — will be configured later with real UIDs
  'A1:B2:C3:D4': 'chrome',
  'E5:F6:G7:H8': 'brushed-gold',
  'I9:J0:K1:L2': 'matte-black',
  'M3:N4:O5:P6': 'copper',
  'Q7:R8:S9:T0': 'brushed-nickel',
  'U1:V2:W3:X4': 'warm-bronze',
};

export class RfidService {
  private config: Required<RfidConfig>;
  private eventSource: EventSource | null = null;
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _connected = false;

  /** Called when a valid finish is detected from RFID scan */
  onFinishDetected: ((finishId: string) => void) | null = null;

  /** Called when connection status changes */
  onConnectionChange: ((connected: boolean) => void) | null = null;

  /** Called when any tag is scanned (even unmapped) */
  onTagScanned: ((uid: string, finishId: string | null) => void) | null = null;

  constructor(config: RfidConfig) {
    this.config = {
      host: config.host,
      port: config.port ?? 80,
      protocol: config.protocol ?? 'sse',
      tagMap: config.tagMap ?? DEFAULT_TAG_MAP,
    };
  }

  get connected() {
    return this._connected;
  }

  connect() {
    if (this.config.protocol === 'sse') {
      this.connectSSE();
    } else {
      this.connectWebSocket();
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnected(false);
  }

  updateTagMap(map: Record<string, string>) {
    this.config.tagMap = { ...this.config.tagMap, ...map };
  }

  /**
   * SSE connection to ESPHome web_server events endpoint.
   * ESPHome fires 'state' events for tag sensors.
   */
  private connectSSE() {
    const url = `http://${this.config.host}:${this.config.port}/events`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.addEventListener('state', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          // ESPHome tag_scanned event or text_sensor with RFID UID
          if (data.id && data.id.includes('rfid') || data.id && data.id.includes('nfc') || data.id && data.id.includes('tag')) {
            this.handleTag(data.value || data.state);
          }
        } catch {
          // ignore malformed events
        }
      });

      this.eventSource.addEventListener('ping', () => {
        // keep-alive, connection is good
        if (!this._connected) this.setConnected(true);
      });

      this.eventSource.onopen = () => {
        this.setConnected(true);
      };

      this.eventSource.onerror = () => {
        this.setConnected(false);
        this.eventSource?.close();
        this.scheduleReconnect();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  /**
   * WebSocket connection for custom ESPHome firmware
   * that sends JSON messages: { "type": "tag", "uid": "XX:XX:XX:XX" }
   */
  private connectWebSocket() {
    const url = `ws://${this.config.host}:${this.config.port}/ws`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setConnected(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'tag' && data.uid) {
            this.handleTag(data.uid);
          }
        } catch {
          // raw UID string
          if (typeof event.data === 'string' && event.data.includes(':')) {
            this.handleTag(event.data.trim());
          }
        }
      };

      this.ws.onclose = () => {
        this.setConnected(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setConnected(false);
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private handleTag(uid: string) {
    const normalized = uid.toUpperCase().trim();
    const finishId = this.config.tagMap[normalized] || null;

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

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }
}
