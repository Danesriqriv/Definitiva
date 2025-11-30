
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant } from '../types';
import { MOCK_TENANTS } from '../constants';
import { getTenantFromSubdomain, getSavedTenantPreference, saveTenantPreference, clearTenantPreference } from '../utils/tenant';

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  setTenantManual: (tenantId: string) => void;
  clearTenant: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initTenant = () => {
      setIsLoading(true);
      setError(null);

      // 1. Intentar detectar por Subdominio (Prioridad Web)
      const subdomainTenantId = getTenantFromSubdomain();

      // 2. Intentar recuperar preferencia guardada (Prioridad Mobile/Dev)
      const savedTenantId = getSavedTenantPreference();

      const targetId = subdomainTenantId || savedTenantId;

      if (targetId) {
        // Simulación: Buscar en lista de tenants permitidos (o llamar a API real)
        const foundTenant = MOCK_TENANTS.find(t => t.id === targetId || t.domain.startsWith(targetId));
        
        if (foundTenant) {
          setTenant(foundTenant);
          // Si estamos en móvil (no subdominio), aseguramos persistencia
          if (!subdomainTenantId) {
            saveTenantPreference(foundTenant.id);
          }
        } else {
          setError('El condominio especificado no existe o no tienes acceso.');
        }
      } else {
        // No hay tenant seleccionado (Flujo inicial App Móvil)
        setTenant(null);
      }
      setIsLoading(false);
    };

    initTenant();
  }, []);

  const setTenantManual = (tenantId: string) => {
    const found = MOCK_TENANTS.find(t => t.id === tenantId);
    if (found) {
      setTenant(found);
      saveTenantPreference(tenantId);
      setError(null);
      // Forzar recarga para limpiar estados de memoria antiguos si es necesario
      window.location.reload(); 
    } else {
      setError('Condominio no válido');
    }
  };

  const clearTenant = () => {
    clearTenantPreference();
    setTenant(null);
    window.location.reload();
  };

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error, setTenantManual, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe ser usado dentro de un TenantProvider');
  }
  return context;
};
