import React, { useState, useMemo } from 'react';
import { User, Resident } from '../../types';
import { QrCode, Clock, Share2, ShieldCheck, Hash, RefreshCw, AlertCircle } from 'lucide-react';
import { qrService } from '../../services/qrService';

interface QRGeneratorProps {
  user: User;
  residents: Resident[];
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ user, residents }) => {
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [isSharing, setIsSharing] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  const availableResidents = useMemo(() => 
    user.role === 'B' 
      ? residents.filter(r => r.unit === user.unit) 
      : residents
  , [residents, user.role, user.unit]);

  if (user.role !== 'B' && user.role !== 'X') return <div className="p-4 text-red-500">Acceso denegado. Solo Administrador o Residente.</div>;

  const handleGenerate = () => {
    if (!selectedResidentId) return;

    const selectedResident = residents.find(r => r.id === selectedResidentId);
    if (!selectedResident) return;

    const finalExpiration = expirationDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const validMaxUses = Math.max(1, maxUses);

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
              <p className="text-xs text-gray-400 mt-1">Válido para {maxUses} {maxUses === 1 ? 'entrada' : 'entradas'}.</p>
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

export default QRGenerator;