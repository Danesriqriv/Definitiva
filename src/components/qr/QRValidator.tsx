
import React, { useState, useRef, useEffect } from 'react';
import { User, QRValidationResult } from '../../types';
import { Scan, CheckCircle, XCircle, User as UserIcon, Calendar, Camera, AlertTriangle, Hash, Sparkles } from 'lucide-react';
import jsQR from 'jsqr';
import { formatDate } from '../../utils/formatters';
import { qrService } from '../../services/qrService';
import { geminiService } from '../../services/gemini.service';

interface QRValidatorProps {
  user: User;
}

const QRValidator: React.FC<QRValidatorProps> = ({ user }) => {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'valid' | 'invalid'>('idle');
  const [resultData, setResultData] = useState<QRValidationResult | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<{ riskLevel: string, reason: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (!['X', 'A'].includes(user.role)) return <div className="p-4 text-red-500">Acceso denegado.</div>;

  const startScan = async () => {
    setScanStatus('scanning');
    setResultData(null);
    setRiskAssessment(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Error opening camera:", err);
      setResultData({ valid: false, message: "No se pudo acceder a la cámara." });
      setScanStatus('invalid');
    }
  };

  const stopCamera = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.height = videoRef.current.videoHeight;
      canvas.width = videoRef.current.videoWidth;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

        if (code) {
          stopCamera();
          processCode(code.data);
          return;
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  const processCode = async (rawData: string) => {
    // 1. Validación Lógica (Local/Servicio)
    const result = qrService.validateAndConsumeQR(rawData, user);
    setResultData(result);
    setScanStatus(result.valid ? 'valid' : 'invalid');

    // 2. Evaluación Contextual con AI (Si es válido)
    if (result.valid && result.data) {
       const assessment = await geminiService.evaluateAccessRisk(result.data, user);
       setRiskAssessment(assessment);
    }
  };

  const resetScanner = () => {
    stopCamera();
    setScanStatus('idle');
    setResultData(null);
    setRiskAssessment(null);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Validar Acceso</h2>
        <p className="text-gray-500">Escáner de Recepción</p>
      </div>

      <div className="relative aspect-square bg-gray-900 rounded-2xl overflow-hidden mb-6 group shadow-inner">
        {scanStatus === 'scanning' ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                 <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                 <canvas ref={canvasRef} className="hidden" />
                 <div className="w-64 h-64 border-2 border-green-500 rounded-lg opacity-50 z-20 relative">
                    <div className="w-full h-0.5 bg-green-500 absolute top-1/2 shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-pulse" />
                 </div>
                 <p className="text-white font-mono mt-4 z-20 bg-black/50 px-3 py-1 rounded">Buscando QR...</p>
             </div>
        ) : (
             <div className="absolute inset-0 flex items-center justify-center">
                 <img 
                    src="https://picsum.photos/seed/camera/600" 
                    className="w-full h-full object-cover opacity-60" 
                    alt="Camera Placeholder"
                 />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Scan className="text-white/50 w-48 h-48" strokeWidth={1} />
                 </div>
             </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        {scanStatus === 'idle' && (
          <button 
            onClick={startScan}
            className="bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Camera size={20} /> Activar Cámara
          </button>
        )}

        {scanStatus === 'scanning' && (
           <button 
             onClick={resetScanner}
             className="bg-red-500/80 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-all flex items-center gap-2"
           >
             Detener
           </button>
        )}

        {scanStatus === 'valid' && resultData?.data && (
          <div className="w-full animate-in zoom-in duration-300 bg-green-50 rounded-xl p-5 border border-green-200">
            <div className="flex items-center justify-center gap-2 text-green-700 text-xl font-bold mb-4">
                <CheckCircle size={28} /> Acceso Permitido
            </div>
            
            <div className="space-y-3 text-sm text-gray-700">
               <div className="flex justify-between border-b border-green-200 pb-2">
                 <span className="text-gray-500">Visitante:</span>
                 <span className="font-bold">{resultData.data.visitorName}</span>
               </div>
               <div className="flex justify-between border-b border-green-200 pb-2">
                 <span className="text-gray-500">A residencia:</span>
                 <span>{resultData.data.residentName} ({resultData.data.residentUnit})</span>
               </div>

               {/* AI RISK ASSESSMENT */}
               {riskAssessment && (
                 <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs mt-2 ${
                   riskAssessment.riskLevel === 'Alto' ? 'bg-red-50 border-red-200 text-red-800' :
                   riskAssessment.riskLevel === 'Medio' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                   'bg-blue-50 border-blue-200 text-blue-800'
                 }`}>
                    <Sparkles size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Análisis IA: Riesgo {riskAssessment.riskLevel}</p>
                      <p className="opacity-90">{riskAssessment.reason}</p>
                    </div>
                 </div>
               )}

               <div className="bg-white p-3 rounded-lg border border-green-100 mt-2 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Usos Restantes</p>
                    <p className="text-lg font-bold text-blue-600">{resultData.remainingUses}</p>
                  </div>
                  <Hash className="text-blue-200" size={24} />
               </div>

               <div className="flex items-center justify-end gap-1 text-xs text-gray-500 pt-1">
                 <Calendar size={12} />
                 Vence: <span className="font-mono text-gray-700">{formatDate(resultData.data.expiresAt)}</span>
               </div>
            </div>

            <button onClick={resetScanner} className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm">
              Escanear otro
            </button>
          </div>
        )}

        {scanStatus === 'invalid' && (
           <div className="w-full animate-in shake duration-300 bg-red-50 rounded-xl p-5 border border-red-200 text-center">
             <div className="flex items-center justify-center gap-2 text-red-600 text-xl font-bold mb-2">
                 <XCircle size={28} /> Acceso Rechazado
             </div>
             <div className="flex flex-col items-center gap-2 mb-4">
               <AlertTriangle className="text-orange-500" size={32} />
               <p className="text-sm text-gray-800 font-bold">{resultData?.message}</p>
             </div>
             
             <button onClick={resetScanner} className="text-sm underline text-red-500 hover:text-red-700">
               Intentar de nuevo
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default QRValidator;
