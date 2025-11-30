
import { ENV } from '../../config/env';
import { getSavedTenantPreference, getTenantFromSubdomain } from '../../utils/tenant';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

/**
 * Obtiene el Tenant ID actual para inyectarlo en los headers.
 * Combina lógica de subdominio y almacenamiento local.
 */
const getCurrentTenantId = () => {
  return getTenantFromSubdomain() || getSavedTenantPreference() || '';
};

async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, headers, ...restOptions } = options;

  const tenantId = getCurrentTenantId();

  // 1. Configurar Headers Base y Específicos del Tenant
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-tenant-id': tenantId, // Header crítico para Multi-Tenancy
  };

  // 2. Inyectar Token
  if (!skipAuth) {
    const token = localStorage.getItem(`auth_token_${tenantId}`); // Token aislado por tenant
    if (token) {
      (defaultHeaders as any)['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...restOptions,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };

  try {
    // Usamos ENV.API_URL
    const response = await fetch(`${ENV.API_URL}${path}`, config);

    if (response.status === 204) return {} as T;

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        // Manejo de expiración de sesión
      }
      throw new ApiError(response.status, data.message || 'Error en la petición', data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(0, 'No hay conexión a internet.', null);
    }
    throw error;
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => http<T>(path, { method: 'GET', ...options }),
  post: <T>(path: string, body: any, options?: RequestOptions) => 
    http<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(path: string, body: any, options?: RequestOptions) => 
    http<T>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: <T>(path: string, body: any, options?: RequestOptions) => 
    http<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: <T>(path: string, options?: RequestOptions) => http<T>(path, { method: 'DELETE', ...options }),
};
