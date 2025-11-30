
import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../contexts/TenantContext';

/**
 * Hook de persistencia con soporte Multi-Tenant.
 * Prefija automáticamente las claves con el ID del tenant actual.
 * Ejemplo: 'residents' -> 't1_residents'
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const { tenant } = useTenant();
  
  // Si no hay tenant cargado, usamos una clave genérica temporal (o null)
  const namespacedKey = tenant ? `${tenant.id}_${key}` : `global_${key}`;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(namespacedKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${namespacedKey}”:`, error);
      return initialValue;
    }
  });

  // Escuchar cambios en el tenant para recargar datos
  useEffect(() => {
    if (typeof window !== 'undefined' && tenant) {
      try {
        const item = window.localStorage.getItem(namespacedKey);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      } catch (e) {
        setStoredValue(initialValue);
      }
    }
  }, [namespacedKey, tenant, initialValue]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(namespacedKey, JSON.stringify(storedValue));
      } catch (error) {
        console.warn(`Error writing localStorage key “${namespacedKey}”:`, error);
      }
    }
  }, [namespacedKey, storedValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(value);
  }, []);

  return [storedValue, setValue] as const;
}
