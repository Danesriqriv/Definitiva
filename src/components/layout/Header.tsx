import React from 'react';
import { PanelLeft, PanelLeftClose, Sparkles } from 'lucide-react';
import { User } from '../../types';

interface HeaderProps {
  user: User;
  activeTab: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isChatOpen: boolean;
  onOpenChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  activeTab, 
  isSidebarOpen, 
  onToggleSidebar, 
  isChatOpen, 
  onOpenChat 
}) => {
  const getTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Inicio';
      case 'users': return user.role === 'B' ? 'Mi Familia' : 'Residentes';
      case 'generate-qr': return 'Generar Invitación';
      case 'validate-qr': return 'Recepción';
      case 'profile': return user.role === 'X' ? 'Gestión de Usuarios' : 'Mi Perfil';
      default: return 'MiVilla';
    }
  };

  return (
    <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
          title={isSidebarOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
        >
          {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeft size={24} />}
        </button>
        <h2 className="text-xl font-bold text-gray-800 hidden sm:block">
          {getTitle()}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-500 hidden md:block text-right">
          <span className="font-medium text-blue-600 block">{user.name}</span>
          <span className="text-xs">
              {user.role === 'A' ? 'Recepción' : user.role === 'B' ? `Residente ${user.unit}` : 'Admin'}
          </span>
        </div>
        {!isChatOpen && (
          <button 
            onClick={onOpenChat}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 focus:ring-2 focus:ring-indigo-100"
            title="Abrir Asistente IA"
          >
            <Sparkles size={20} />
            <span className="text-sm font-medium hidden sm:inline">Asistente</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;