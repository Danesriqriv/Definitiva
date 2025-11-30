
import { GoogleGenAI } from "@google/genai";
import { User, Resident, Visit, QRCodeEntry } from '../types';
import { MASTER_PROMPT } from '../constants';

// Inicialización segura del cliente
// Se asume que process.env.API_KEY está disponible vía configuración de build o .env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * 1. GENERAR CONTENIDO / CHAT
   * Maneja la interacción principal con el asistente virtual.
   */
  generateChatResponse: async (input: string, user: User, contextData: any): Promise<string> => {
    try {
      const model = 'gemini-2.5-flash';
      
      const contextPrompt = `
        ${MASTER_PROMPT}
        
        CONTEXTO DE LA SESIÓN:
        - Tenant ID: ${user.tenantId}
        - Usuario: ${user.name} (${user.role})
        - Datos Relevantes del Sistema: ${JSON.stringify(contextData).substring(0, 2000)}...
        
        PREGUNTA DEL USUARIO:
        "${input}"
        
        Instrucción: Responde de manera concisa, profesional y orientada a la seguridad.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: contextPrompt,
      });

      return response.text || "No se pudo generar una respuesta.";
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Lo siento, el servicio de IA no está disponible en este momento. Verifica tu conexión o API Key.";
    }
  },

  /**
   * 2. INTERPRETAR DATOS (Dashboard)
   * Analiza estadísticas de visitas y residentes para generar reportes.
   */
  analyzeDashboardStats: async (stats: any): Promise<string> => {
    try {
      const prompt = `
        Actúa como un Analista de Seguridad Senior. Analiza los siguientes datos del condominio y dame un resumen ejecutivo de 3 puntos clave (Tendencias, Anomalías, Recomendaciones):
        
        DATOS ACTUALES:
        - Total Residentes: ${stats.totalResidents}
        - Visitas Hoy: ${stats.todayVisits}
        - Desglose por hora (ejemplo): ${JSON.stringify(stats.chartData)}
        
        Formato: Markdown simple. Sé breve.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "No se pudo generar el análisis.";
    } catch (error) {
      return "Error al analizar datos.";
    }
  },

  /**
   * 3. VALIDAR CONTEXTO DE QR (Seguridad)
   * Evalúa el riesgo de un acceso basándose en la hora, tipo de visita y datos históricos.
   * Retorna: 'Bajo', 'Medio', 'Alto' y una razón.
   */
  evaluateAccessRisk: async (qrData: QRCodeEntry, scannerUser: User): Promise<{ riskLevel: string, reason: string }> => {
    try {
      const now = new Date();
      const hour = now.getHours();
      
      const prompt = `
        Evalúa el riesgo de seguridad para este acceso (Solo responde JSON):
        
        CONTEXTO:
        - Hora actual: ${hour}:00
        - Visitante: ${qrData.visitorName}
        - Unidad Destino: ${qrData.residentUnit}
        - Creado por: ${qrData.createdByUserName}
        - Usos actuales del QR: ${qrData.currentUses} / ${qrData.maxUses}
        
        REGLAS:
        - Madrugada (00-06) es riesgo Medio/Alto si no es residente.
        - Múltiples usos rápidos es riesgo Medio.
        
        Output JSON esperado: { "riskLevel": "Bajo" | "Medio" | "Alto", "reason": "Breve explicación" }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("Empty response");
      
      return JSON.parse(jsonText);
    } catch (error) {
      // Fallback seguro en caso de error de IA
      return { riskLevel: "Desconocido", reason: "Análisis IA no disponible." };
    }
  },

  /**
   * 4. PROCESAR PETICIONES DE DATOS
   * Detecta anomalías en la lista de residentes (ej. exceso de personas en una unidad).
   */
  detectResidentAnomalies: async (residents: Resident[]): Promise<string[]> => {
    try {
      // Agrupar datos para minimizar tokens
      const unitCounts = residents.reduce((acc, r) => {
        acc[r.unit] = (acc[r.unit] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const prompt = `
        Revisa estos conteos de habitantes por unidad y lista SOLO las unidades sospechosas (más de 8 personas es inusual, o nombres duplicados).
        Datos: ${JSON.stringify(unitCounts)}
        Nombres: ${JSON.stringify(residents.map(r => r.name))}
        
        Responde con una lista de strings (alertas). Si todo está bien, responde lista vacía.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      return [];
    }
  }
};
