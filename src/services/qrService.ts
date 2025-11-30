import { QRCodeEntry, QRPayload, QRValidationResult, Resident, User } from '../types';

/**
 * Servicio que simula la lógica de Backend para gestión de QRs.
 * Maneja la persistencia, validación y conteo de escaneos.
 */
export const qrService = {
  
  /**
   * Genera un nuevo código QR dinámico y lo guarda en la "Base de Datos"
   */
  createQR: (
    user: User, 
    resident: Resident, 
    maxUses: number, // RENAMED
    expirationDate: string
  ): string => {
    
    const qrId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newEntry: QRCodeEntry = {
      id: qrId,
      tenantId: user.tenantId,
      residentId: resident.id,
      residentName: resident.name,
      residentUnit: resident.unit,
      visitorName: 'Invitado', // Podría ser dinámico en el futuro
      createdByUserId: user.id,
      createdByUserName: user.name,
      createdAt: now,
      expiresAt: expirationDate,
      maxUses: maxUses, // RENAMED
      currentUses: 0, // RENAMED
      status: 'Active'
    };

    // Persistencia: Leer, Agregar, Guardar
    // Usamos la misma lógica de key que useLocalStorage: `${tenantId}_qr_codes`
    const storageKey = `${user.tenantId}_qr_codes`;
    const existingData = localStorage.getItem(storageKey);
    const qrList: QRCodeEntry[] = existingData ? JSON.parse(existingData) : [];
    
    qrList.push(newEntry);
    localStorage.setItem(storageKey, JSON.stringify(qrList));

    // Retornar el payload ligero que irá en la imagen
    const payload: QRPayload = {
      id: qrId,
      tenantId: user.tenantId,
      v: 1
    };

    return JSON.stringify(payload);
  },

  /**
   * Valida un QR escaneado y registra el uso (decrementa quota)
   */
  validateAndConsumeQR: (payloadRaw: string, validatorUser: User): QRValidationResult => {
    try {
      const payload: QRPayload = JSON.parse(payloadRaw);

      // 1. Validación de Integridad Básica
      if (!payload.id || !payload.tenantId) {
        return { valid: false, message: 'Código QR no reconocido o formato inválido.' };
      }

      // 2. Validación de Tenant (Seguridad de Dominio)
      if (payload.tenantId !== validatorUser.tenantId) {
        return { valid: false, message: `Código perteneciente a otro condominio (${payload.tenantId}).` };
      }

      // 3. Buscar en "Base de Datos"
      const storageKey = `${validatorUser.tenantId}_qr_codes`;
      const existingData = localStorage.getItem(storageKey);
      const qrList: QRCodeEntry[] = existingData ? JSON.parse(existingData) : [];
      
      const qrEntryIndex = qrList.findIndex(q => q.id === payload.id);
      
      if (qrEntryIndex === -1) {
        return { valid: false, message: 'El código QR no existe en el sistema.' };
      }

      const qrEntry = qrList[qrEntryIndex];

      // 4. Verificar Expiración por Fecha
      if (new Date(qrEntry.expiresAt) < new Date()) {
        return { valid: false, message: 'El código QR ha caducado por fecha.' };
      }

      // 5. Verificar Límite de Usos (Quota)
      // RENAMED properties
      if (qrEntry.currentUses >= qrEntry.maxUses) {
        return { valid: false, message: 'El código QR ha agotado su límite de usos.' };
      }

      // 6. CONSUMO: Incrementar contador
      qrEntry.currentUses += 1;
      
      // Actualizar estado si se agotó
      if (qrEntry.currentUses >= qrEntry.maxUses) {
        qrEntry.status = 'Depleted';
      }

      // Guardar cambios en BD
      qrList[qrEntryIndex] = qrEntry;
      localStorage.setItem(storageKey, JSON.stringify(qrList));

      return { 
        valid: true, 
        message: 'Acceso Autorizado', 
        data: qrEntry,
        remainingUses: qrEntry.maxUses - qrEntry.currentUses // RENAMED
      };

    } catch (error) {
      console.error(error);
      return { valid: false, message: 'Error al procesar el código QR.' };
    }
  }
};