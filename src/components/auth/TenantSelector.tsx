import React, { useState } from 'react';
import { Building2, ArrowRight, ShieldCheck, Lock, Globe, CheckCircle } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { authService } from '../../services/authService';

const TenantSelector: React.FC = () => {
  const { setTenantManual, error: contextError } = useTenant();
  
  // Steps: 'google' -> 'security'
  const [step, setStep] = useState<'google' | 'security'>('google');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Form State
  const [googleUser, setGoogleUser] = useState<{name: string, email: string} | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Simular proceso de Google
      const gUser = await authService.loginWithGoogle();
      setGoogleUser(gUser);
      setStep('security');
    } catch (e) {
      setLoginError('No se pudo conectar con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    setTimeout(() => {
      // Validar credenciales del condominio
      const tenant = authService.verifyTenantAccess(domainInput, passwordInput);

      if (tenant) {
        setTenantManual(tenant.id);
        // Aquí normalmente mapearíamos el googleUser.email a un usuario real de la BD
      } else {
        setLoginError('Dominio incorrecto o contraseña inválida.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-30">
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 rounded-full bg-white/20 blur-2xl"></div>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm relative z-10">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight relative z-10">MiVilla</h1>
          <p className="text-blue-100 mt-2 text-sm relative z-10">Acceso Seguro a tu Comunidad</p>
        </div>

        <div className="p-8">
          
          {/* STEP 1: GOOGLE LOGIN */}
          {step === 'google' && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="text-center space-y-2">
                <h2 className="text-gray-800 font-bold text-xl">Iniciar Sesión</h2>
                <p className="text-gray-500 text-sm">Utiliza tu cuenta para identificarte.</p>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                   <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" className="w-5 h-5" />
                    <span>Continuar con Google</span>
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">Acceso Seguro</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="text-center text-xs text-gray-400">
                Al continuar, aceptas los términos de servicio de MiVilla.
              </div>
            </div>
          )}

          {/* STEP 2: TENANT SECURITY */}
          {step === 'security' && (
            <form onSubmit={handleSecurityVerification} className="space-y-5 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                  {googleUser?.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-gray-500">Identificado como:</p>
                  <p className="text-sm font-semibold text-blue-900 truncate">{googleUser?.email}</p>
                </div>
                <CheckCircle size={16} className="text-green-500" />
              </div>

              <div className="text-center mb-4">
                <h2 className="text-gray-800 font-bold text-lg">Seguridad del Condominio</h2>
                <p className="text-gray-500 text-xs">Ingresa los datos proporcionados por tu administración.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">ID o Dominio del Condominio</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                      type="text"
                      placeholder="Ej. alerces.condoguard.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Contraseña de Acceso</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-mono tracking-widest"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {(loginError || contextError) && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg text-center font-medium animate-pulse border border-red-100">
                  {loginError || contextError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? 'Verificando...' : 'Ingresar al Condominio'}
                {!isLoading && <ArrowRight size={18} />}
              </button>

              <button 
                type="button"
                onClick={() => setStep('google')}
                className="w-full text-center text-xs text-gray-500 hover:text-blue-600 mt-2"
              >
                Volver / Cambiar cuenta
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default TenantSelector;