
import { ENV } from '../config/env';

/**
 * Intenta extraer el ID del tenant desde el subdominio.
 * Funciona en entorno Web. Retorna null si es localhost o IP.
 */
export const getTenantFromSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  
  // Si estamos en localhost o es una IP, no hay subdominio válido
  if (hostname.includes('localhost') || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return null;
  }

  // Si el hostname es exactamente el dominio base, no hay subdominio
  if (hostname === ENV.BASE_DOMAIN) {
    return null;
  }

  // Extraer la primera parte del host
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0]; // Retorna 'condominioA' de 'condominioA.mivilla.app'
  }

  return null;
};

/**
 * Guarda el tenant seleccionado manualmente (para Mobile/Capacitor)
 */
export const saveTenantPreference = (tenantId: string) => {
  localStorage.setItem('mivilla_tenant_id', tenantId);
};

/**
 * Obtiene el tenant guardado (para Mobile/Capacitor)
 */
export const getSavedTenantPreference = (): string | null => {
  return localStorage.getItem('mivilla_tenant_id');
};

/**
 * Limpia la preferencia (Logout de condominio)
 */
export const clearTenantPreference = () => {
  localStorage.removeItem('mivilla_tenant_id');
};
