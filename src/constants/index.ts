import { User, Resident, Visit, Tenant } from '../types';

export const MASTER_PROMPT = `
Eres la inteligencia artificial central de una aplicación multiplataforma para seguridad de condominios, construida con arquitectura multi-tenant.

ROLES DE USUARIO:
1. Administrador (Rol X): Dueño de Condominio / Admin. Tiene todos los permisos. Puede crear, editar, eliminar y visualizar todo.
2. Recepción (Rol A): Portería / Seguridad. Se encarga de validar accesos y visualizar datos en tiempo real. NO puede editar ni eliminar datos (solo valida QR).
3. Residente (Rol B): Propietario. Gestiona su propia unidad. Puede agregar y ELIMINAR a su familia/residentes de su unidad. Genera códigos QR para visitas.

REGLAS GENERALES:
- Trabaja siempre dentro del tenant_id del usuario actual.
- Nunca accedas ni muestres datos de otro tenant.
- El usuario A (Recepción) es los "ojos" del condominio: consulta residentes y valida visitas.
- El usuario B (Residente) gestiona su núcleo familiar y sus visitas.
- El usuario X (Administrador) supervisa todo.

FORMATO OBLIGATORIO DE RESPUESTA:
1. Resumen breve (1–2 líneas)
2. Respuesta completa adaptada al rol del usuario
3. Opciones o próximos pasos
`;

export const MOCK_TENANTS: Tenant[] = [
  { id: 't1', name: 'Edificio Los Alerces', domain: 'alerces.condoguard.com', accessCode: '123456' },
  { id: 't2', name: 'Torres del Parque', domain: 'torres.condoguard.com', accessCode: '888888' }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Carlos Admin', email: 'carlos@alerces.com', role: 'X', tenantId: 't1', avatar: 'https://picsum.photos/seed/u1/200' },
  { id: 'u2', name: 'Ana Recepción', email: 'ana@alerces.com', role: 'A', tenantId: 't1', avatar: 'https://picsum.photos/seed/u2/200' },
  { id: 'u3', name: 'Beto Residente', email: 'beto@alerces.com', role: 'B', tenantId: 't1', avatar: 'https://picsum.photos/seed/u3/200', unit: '101' },
];

export const INITIAL_RESIDENTS: Resident[] = [
  { id: '1', tenantId: 't1', name: 'Juan Perez', unit: '101', type: 'Resident', status: 'Active', licensePlate: 'GH-45-22' },
  { id: '2', tenantId: 't1', name: 'Maria Lopez', unit: '202', type: 'Resident', status: 'Active' },
  { id: '3', tenantId: 't1', name: 'Hijo de Beto', unit: '101', type: 'Family', status: 'Active' },
  { id: '4', tenantId: 't1', name: 'Pedro Repartidor', unit: '101', type: 'Delivery', status: 'Active', licensePlate: 'DL-99-00' }, 
];

export const INITIAL_VISITS: Visit[] = [
  { id: 'v1', tenantId: 't1', residentId: '1', visitorName: 'Pedro Delivery', date: new Date().toISOString().split('T')[0], status: 'Completed', code: '123' }
];