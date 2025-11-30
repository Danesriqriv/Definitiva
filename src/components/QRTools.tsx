import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Resident, QRPayload, QRValidationResult } from '../types';
import { QrCode, Scan, CheckCircle, XCircle, Clock, Hash, ShieldCheck, User as UserIcon, Calendar, Share2, Camera, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { qrService } from '../services/qrService';
import { formatDate } from '../utils/formatters';

// --- GENERATOR COMPONENT (Legacy File Wrapper / Fallback) ---
export const QRGenerator: React.FC<{ user: User, residents: Resident[] }> = ({ user, residents }) => {
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  
  // LOGIC UPDATED: Max Uses instead of Quantity
  const [maxUses, setMaxUses] = useState(1);
  
  const [isSharing, setIsSharing] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  const availableResidents = useMemo(() => 
    user.role === 'B' 
      ? residents.filter(r => r.unit === user.unit) 
      : residents
  , [residents, user.role, user.unit]);

  if (user.role !== 'B' && user.role !== 'X') return <div className="p-4 text-red-500">Acceso denegado. Solo Rol X o B.</div>;

  const handleGenerate = () => {
    if (!selectedResidentId) return;

    const selectedResident = residents.find(r => r.id === selectedResidentId);
    if (!selectedResident) return;

    // Default expiration: 24 hours
    const finalExpiration = expirationDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const validMaxUses = Math.max(1, maxUses);

    // Call Service
    const qrPayloadString = qrService.createQR(user, selectedResident, validMaxUses, finalExpiration);
    setGeneratedQR(qrPayloadString);
  };

  const handleShare = async () => {
    if (!generatedQR) return;
    setIsSharing(true);
    const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedQR)}`;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `acceso-mivilla.png`, { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          title: 'Acceso MiVilla',
          text: `Código QR de acceso válido por ${maxUses} uso(s).`,
          files: [file],
        });
      } else {
        window.open(imageUrl, '_blank');
        alert("Tu dispositivo no soporta compartir nativo.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const resetForm = () => {
    setGeneratedQR(null);
    setExpirationDate('');
    setMaxUses(1);
    setSelectedResidentId('');
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-6">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
          <QrCode size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Generar Acceso</h2>
        <p className="text-gray-500">Configura un código QR único y dinámico</p>
      </div>

      {!generatedQR ? (
        <div className="space-y-5 animate-in fade-in">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Residente Anfitrión</label>
            <select 
              className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              value={selectedResidentId}
              onChange={(e) => setSelectedResidentId(e.target.value)}
            >
              <option value="">Seleccionar residente...</option>
              {availableResidents.map(r => (
                <option key={r.id} value={r.id}>{r.name} - {r.unit}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caducidad (Fecha)</label>
              <div className="relative">
                <input 
                  type="datetime-local" 
                  className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={expirationDate} 
                  onChange={(e) => setExpirationDate(e.target.value)} 
                />
                <Clock className="absolute left-3 top-3.5 text-gray-400" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Usos</label>
              <div className="relative">
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={maxUses} 
                  onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))} 
                />
                <Hash className="absolute left-3 top-3.5 text-gray-400" size={16} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Válido para {maxUses} accesos.</p>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-xs text-blue-800 border border-blue-100">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>
              Estás generando un <strong>único código QR</strong>. El sistema contará cada vez que sea escaneado y lo invalidará automáticamente al llegar a {maxUses} usos.
            </p>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={!selectedResidentId} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            Generar Código Dinámico
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center animate-in zoom-in duration-300">
           <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100 text-sm text-green-800 mb-6 w-full">
             <ShieldCheck size={20} className="mx-auto mb-1" />
             Código activo para <strong>{user.tenantId}</strong>
          </div>

          <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl mb-6">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatedQR)}`} 
              alt="QR Code" 
              className="w-48 h-48" 
            />
          </div>

          <div className="text-center mb-6">
            <p className="text-sm font-bold text-gray-800">Válido por {maxUses} {maxUses === 1 ? 'uso' : 'usos'}</p>
            <p className="text-xs text-gray-500">Se invalidará automáticamente al completarse el límite.</p>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={resetForm} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-sm font-medium">
              <RefreshCw size={16} /> Nuevo
            </button>
            <button onClick={handleShare} disabled={isSharing} className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm">
              <Share2 size={16} /> Compartir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VALIDATOR COMPONENT (Legacy Wrapper) ---
export const QRValidator: React.FC<{ user: User }> = ({ user }) => {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'valid' | 'invalid'>('idle');
  const [resultData, setResultData] = useState<QRValidationResult | null>(null);
  
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
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

  const processCode = (rawData: string) => {
    // Call Service
    const result = qrService.validateAndConsumeQR(rawData, user);
    setResultData(result);
    setScanStatus(result.valid ? 'valid' : 'invalid');
  };

  const resetScanner = () => {
    stopCamera();
    setScanStatus('idle');
    setResultData(null);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Validar Acceso</h2>
        <p className="text-gray-500">Escáner de Portería</p>
      </div>
      <div className="relative aspect-square bg-gray-900 rounded-2xl overflow-hidden mb-6 group shadow-inner">
        {scanStatus === 'scanning' ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                 <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                 <canvas ref={canvasRef} className="hidden" />
                 <div className="w-64 h-64 border-2 border-green-500 rounded-lg opacity-50 z-20 relative"><div className="w-full h-0.5 bg-green-500 absolute top-1/2 animate-pulse" /></div>
                 <p className="text-white font-mono mt-4 z-20 bg-black/50 px-3 py-1 rounded">Buscando QR...</p>
             </div>
        ) : (
             <div className="absolute inset-0 flex items-center justify-center">
                 <img src="https://picsum.photos/seed/camera/600" className="w-full h-full object-cover opacity-60" alt="Camera" />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Scan className="text-white/50 w-48 h-48" strokeWidth={1} /></div>
             </div>
        )}
      </div>
      <div className="flex flex-col items-center">
        {scanStatus === 'idle' && (
          <button onClick={startScan} className="bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-700 transition-all flex items-center gap-2 shadow-lg"><Camera size={20} /> Activar Cámara</button>
        )}
        {scanStatus === 'scanning' && <button onClick={resetScanner} className="bg-red-500/80 text-white px-6 py-2 rounded-full hover:bg-red-600">Detener</button>}
        {scanStatus === 'valid' && resultData?.data && (
          <div className="w-full animate-in zoom-in duration-300 bg-green-50 rounded-xl p-5 border border-green-200">
            <div className="flex items-center justify-center gap-2 text-green-700 text-xl font-bold mb-4"><CheckCircle size={28} /> Permitido</div>
            <div className="space-y-3 text-sm text-gray-700">
               <div className="flex justify-between border-b border-green-200 pb-2"><span className="text-gray-500">Residente:</span><span className="font-bold">{resultData.data.residentName}</span></div>
               <div className="bg-white p-3 rounded-lg border border-green-100 mt-2 flex justify-between items-center">
                  <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Usos Restantes</p><p className="text-lg font-bold text-blue-600">{resultData.remainingUses}</p></div>
                  <Hash className="text-blue-200" size={24} />
               </div>
               <div className="flex items-center justify-end gap-1 text-xs text-gray-500 pt-1"><Calendar size={12} /> Vence: <span className="font-mono text-gray-700">{formatDate(resultData.data.expiresAt)}</span></div>
            </div>
            <button onClick={resetScanner} className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm">Escanear otro</button>
          </div>
        )}
        {scanStatus === 'invalid' && (
           <div className="w-full animate-in shake duration-300 bg-red-50 rounded-xl p-5 border border-red-200 text-center">
             <div className="flex items-center justify-center gap-2 text-red-600 text-xl font-bold mb-2"><XCircle size={28} /> Rechazado</div>
             <p className="text-sm text-gray-800 font-bold mb-4">{resultData?.message}</p>
             <button onClick={resetScanner} className="text-sm underline text-red-500">Intentar de nuevo</button>
           </div>
        )}
      </div>
    </div>
  );
};
