import { apiClient } from './api/client';
import { Resident, Visit } from '../types';

export const dataService = {
  // --- Residentes ---
  
  getResidents: async (tenantId: string): Promise<Resident[]> => {
    return apiClient.get<Resident[]>(`/tenants/${tenantId}/residents`);
  },

  createResident: async (resident: Omit<Resident, 'id'>): Promise<Resident> => {
    return apiClient.post<Resident>('/residents', resident);
  },

  updateResident: async (id: string, data: Partial<Resident>): Promise<Resident> => {
    return apiClient.patch<Resident>(`/residents/${id}`, data);
  },

  deleteResident: async (id: string): Promise<void> => {
    return apiClient.delete(`/residents/${id}`);
  },

  // --- Visitas ---

  getVisits: async (tenantId: string): Promise<Visit[]> => {
    return apiClient.get<Visit[]>(`/tenants/${tenantId}/visits`);
  },

  logVisit: async (visitData: Omit<Visit, 'id'>): Promise<Visit> => {
    return apiClient.post<Visit>('/visits', visitData);
  }
};
