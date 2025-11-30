export type Role = 'X' | 'A' | 'B';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  accessCode: string; // Password required to enter the tenant
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  avatar: string;
  unit?: string;
}

export interface Resident {
  id: string;
  tenantId: string;
  name: string;
  unit: string;
  type: 'Resident' | 'Family' | 'Visitor' | 'Delivery';
  status: 'Active' | 'Inactive';
  licensePlate?: string;
  expirationDate?: string;
}

export interface Visit {
  id: string;
  tenantId: string;
  visitorName: string;
  residentId: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Completed';
  code: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Payload ligero dentro del QR (Solo referencias)
export interface QRPayload {
  id: string; // ID único del QR en base de datos
  tenantId: string; // Security Lock
  v: number; // Version del protocolo
}

// Entidad completa en Base de Datos
export interface QRCodeEntry {
  id: string;
  tenantId: string;
  residentId: string;
  residentName: string;
  residentUnit: string;
  visitorName: string; // "Invitado" o nombre específico si se implementa
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number; // REPLACED maxScans -> maxUses
  currentUses: number; // REPLACED currentScans -> currentUses
  status: 'Active' | 'Expired' | 'Depleted'; // Depleted = Sin usos
}

export interface QRValidationResult {
  valid: boolean;
  message: string;
  data?: QRCodeEntry;
  remainingUses?: number; // REPLACED remainingScans -> remainingUses
}