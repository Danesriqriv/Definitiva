import React, { useState, useEffect, useMemo } from 'react';
import { User, Resident, Visit, QRCodeEntry } from './types/index';
import { MOCK_USERS, INITIAL_RESIDENTS, INITIAL_VISITS } from './constants/index';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TenantProvider, useTenant } from './contexts/TenantContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import TenantSelector from './components/auth/TenantSelector';

// Features
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/users/UserManagement';
import UserProfile from './components/users/UserProfile';
// IMPORTS ACTUALIZADOS
import QRGenerator from './components/qr/QRGenerator';
import QRValidator from './components/qr/QRValidator';
import ChatAssistant from './components/chat/ChatAssistant';

import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { tenant, isLoading: isTenantLoading } = useTenant();

  // State Persistence
  const [residents, setResidents] = useLocalStorage<Resident[]>('residents', INITIAL_RESIDENTS);
  const [visits, setVisits] = useLocalStorage<Visit[]>('visits', INITIAL_VISITS);
  const [systemUsers, setSystemUsers] = useLocalStorage<User[]>('users', MOCK_USERS);
  
  // QR Storage
  const [qrCodes, setQrCodes] = useLocalStorage<QRCodeEntry[]>('qr_codes', []);

  // Auth & UI State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (currentUser) {
      const updatedUser = systemUsers.find(u => u.id === currentUser.id);
      if (updatedUser && (updatedUser.name !== currentUser.name || updatedUser.avatar !== currentUser.avatar || updatedUser.role !== currentUser.role)) {
        setCurrentUser(updatedUser);
      }
    }
  }, [systemUsers, currentUser]);
  
  useEffect(() => {
    if (!tenant) return; 

    const checkExpiration = () => {
      setResidents(currentResidents => {
        const now = new Date();
        let hasChanges = false;
        
        const validResidents = currentResidents.filter(r => {
          if (!r.expirationDate) return true;
          const expDate = new Date(r.expirationDate);
          const isExpired = expDate <= now;
          if (isExpired) hasChanges = true;
          return !isExpired;
        });

        if (hasChanges) {
          console.log(`[${tenant.name}] Registros vencidos eliminados.`);
          return validResidents;
        }
        return currentResidents;
      });
    };

    checkExpiration();
    const intervalId = setInterval(checkExpiration, 10000); 
    return () => clearInterval(intervalId);
  }, [setResidents, tenant]);

  const tenantResidents = useMemo(() => 
    (currentUser && tenant) ? residents.filter(r => r.tenantId === tenant.id) : [],
    [residents, currentUser, tenant]
  );

  const tenantVisits = useMemo(() => 
    (currentUser && tenant) ? visits.filter(v => v.tenantId === tenant.id) : [],
    [visits, currentUser, tenant]
  );

  if (isTenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
      </div>
    );
  }

  if (!tenant) {
    return <TenantSelector />;
  }

  if (!currentUser) {
    const availableUsers = systemUsers.filter(u => u.tenantId === tenant.id);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 animate-in fade-in duration-500 border-t-4 border-blue-600">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-900">MiVilla</h1>
            <p className="text-gray-500 mt-1 font-medium">{tenant.name}</p>
            <p className="text-xs text-gray-400 mt-2">Acceso Seguro Multi-Plataforma</p>
          </div>
          <div className="space-y-3">
            {availableUsers.length > 0 ? availableUsers.map(u => (
              <button 
                key={u.id}
                onClick={() => {
                  setCurrentUser(u);
                  setIsSidebarOpen(true);
                  setIsChatOpen(true);
                  setActiveTab('dashboard');
                }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all group text-left transform active:scale-98 duration-200"
              >
                <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full bg-gray-200 shadow-sm object-cover" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-700">{u.name}</h3>
                    {u.unit && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">U: {u.unit}</span>}
                  </div>
                  <p className="text-xs text-gray-500">
                    {u.role === 'X' && 'Admin'}
                    {u.role === 'A' && 'Portería'}
                    {u.role === 'B' && 'Residente'} 
                  </p>
                </div>
              </button>
            )) : (
              <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg">
                No hay usuarios configurados para este condominio.
              </div>
            )}
          </div>
          <div className="text-center">
             <button onClick={() => window.location.reload()} className="text-xs text-blue-500 hover:underline">Cambiar Condominio</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      <Sidebar 
        user={currentUser} 
        isOpen={isSidebarOpen} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={() => setCurrentUser(null)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col h-full relative transition-all duration-300">
        <Header 
          user={currentUser}
          activeTab={activeTab}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isChatOpen={isChatOpen}
          onOpenChat={() => setIsChatOpen(true)}
        />

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === 'dashboard' && <Dashboard user={currentUser} residents={tenantResidents} visits={tenantVisits} />}
              {activeTab === 'users' && <UserManagement user={currentUser} residents={residents} setResidents={setResidents} />}
              {activeTab === 'generate-qr' && <QRGenerator user={currentUser} residents={tenantResidents} />}
              {activeTab === 'validate-qr' && <QRValidator user={currentUser} />}
              {activeTab === 'profile' && <UserProfile currentUser={currentUser} systemUsers={systemUsers} setSystemUsers={setSystemUsers} />}
            </div>
          </div>

          {isChatOpen && (
            <div className="w-full lg:w-80 border-l border-gray-200 bg-white shadow-xl lg:shadow-none flex flex-col h-1/3 lg:h-full z-10 transition-all duration-300">
              <ChatAssistant user={currentUser} mockResidents={tenantResidents} onClose={() => setIsChatOpen(false)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
};

export default App;