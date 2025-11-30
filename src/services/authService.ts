import { apiClient } from './api/client';
import { User, Tenant } from '../types';
import { MOCK_TENANTS } from '../constants';

interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  /**
   * Simula el inicio de sesión con Google.
   * En producción, esto usaría Firebase Auth o Google Identity Services.
   */
  loginWithGoogle: async (): Promise<{ email: string; name: string; avatar: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          email: 'usuario@gmail.com', // Simulación de cuenta retornada por Google
          name: 'Usuario Google',
          avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
        });
      }, 1500);
    });
  },

  /**
   * Valida el acceso a un condominio específico (Dominio + Contraseña)
   */
  verifyTenantAccess: (domainOrId: string, accessCode: string): Tenant | null => {
    // 1. Recuperar tenants (incluyendo actualizaciones locales si el admin cambió la clave)
    const storedTenants = localStorage.getItem('mivilla_tenants');
    const tenants: Tenant[] = storedTenants ? JSON.parse(storedTenants) : MOCK_TENANTS;

    // 2. Buscar tenant
    const tenant = tenants.find(t => t.id === domainOrId || t.domain === domainOrId || t.name === domainOrId);

    if (!tenant) return null;

    // 3. Validar contraseña
    if (tenant.accessCode === accessCode) {
      return tenant;
    }

    return null;
  },

  /**
   * Actualiza la contraseña de acceso del condominio (Solo Admin)
   */
  updateTenantPassword: (tenantId: string, newCode: string) => {
    const storedTenants = localStorage.getItem('mivilla_tenants');
    let tenants: Tenant[] = storedTenants ? JSON.parse(storedTenants) : MOCK_TENANTS;

    tenants = tenants.map(t => {
      if (t.id === tenantId) {
        return { ...t, accessCode: newCode };
      }
      return t;
    });

    localStorage.setItem('mivilla_tenants', JSON.stringify(tenants));
  },

  /**
   * Inicia sesión en el sistema (Legacy/Simulado)
   */
  login: async (credentials: { email: string }): Promise<LoginResponse> => {
    return Promise.resolve({
      token: 'mock-jwt-token-123',
      user: { id: 'mock', name: 'Mock User', email: credentials.email, role: 'X', tenantId: 't1', avatar: '' }
    });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
};