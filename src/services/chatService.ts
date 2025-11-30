import { GoogleGenAI } from "@google/genai";
import { User, Resident } from '../types';
import { MASTER_PROMPT } from '../constants';

// Nota: En una arquitectura profesional ideal, estas llamadas deberían pasar 
// por tu propio backend (dataService) para no exponer la API KEY en el cliente.
// Sin embargo, para este proyecto Serverless/Client-side, mantenemos la implementación SDK.

export const chatService = {
  /**
   * Envía un mensaje a Gemini con el contexto del sistema
   */
  sendMessage: async (input: string, user: User, residentsContext: Resident[]): Promise<string> => {
    // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contextPrompt = `
      CONTEXTO ACTUAL DEL SISTEMA:
      - Tenant ID: ${user.tenantId}
      - Usuario Actual: ${user.name} (Rol: ${user.role})
      - Datos de Residentes (JSON simplificado): ${JSON.stringify(residentsContext)}
      
      INSTRUCCIÓN DEL USUARIO:
      ${input}
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
        config: {
          systemInstruction: MASTER_PROMPT,
        }
      });
      
      return response.text || "Lo siento, la IA no devolvió una respuesta de texto.";
    } catch (error) {
      console.error("Error en chatService:", error);
      throw new Error("Error de comunicación con el servicio de IA.");
    }
  }
};