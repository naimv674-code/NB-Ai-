export type ActiveTab = 'link' | 'config' | 'ai';

export type SessionStatus =
  | 'idle'
  | 'connecting'
  | 'pairing_code_ready'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  direction: 'system' | 'incoming' | 'outgoing';
  sender: string;
  message: string;
}

export interface WhatsAppSessionSnapshot {
  sessionId: string;
  phoneNumber: string;
  displayNumber: string;
  countryIso: string;
  status: SessionStatus;
  pairingCode: string | null;
  connectedJid: string | null;
  connectedName: string | null;
  connectedAt: string | null;
  updatedAt: string;
  error: string | null;
  logs: ActivityLogEntry[];
}

export interface HealthInfo {
  ok: boolean;
  brand: string;
  owner: string;
  aiConfigured: boolean;
  activeSessions: number;
}
