
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',
  // Dominio base para detectar subdominios (ej. 'mivilla.app')
  BASE_DOMAIN: import.meta.env.VITE_BASE_DOMAIN || 'localhost', 
};
