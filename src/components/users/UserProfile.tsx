import React, { useState, useRef, useMemo } from 'react';
import { User, Role } from '../../types';
import { User as UserIcon, Camera, Save, Shield, Edit, Upload, Image as ImageIcon, Lock, Key } from 'lucide-react';
import { authService } from '../../services/authService';

interface UserProfileProps {
  currentUser: User;
  systemUsers: User[];
  setSystemUsers: (users: User[]) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ currentUser, systemUsers, setSystemUsers }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Admin Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordSaved, setIsPasswordSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tenantUsers = useMemo(() => 
    systemUsers.filter(u => u.tenantId === currentUser.tenantId),
  [systemUsers, currentUser.tenantId]);

  const targetUser = currentUser.role === 'B' 
    ? currentUser 
    : (tenantUsers.find(u => u.id === selectedUserId) || currentUser);

  const isSelf = targetUser.id === currentUser.id;
  const showUserList = currentUser.role === 'X' || currentUser.role === 'A';
  const canEdit = currentUser.role === 'X' || isSelf;

  const handleEditClick = () => {
    setEditForm({
      name: targetUser.name,
      avatar: targetUser.avatar,
      role: targetUser.role
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedUsers = systemUsers.map(u => {
      if (u.id === targetUser.id) {
        return { ...u, ...editForm } as User;
      }
      return u;
    });
    setSystemUsers(updatedUsers);
    setIsEditing(false);
    setEditForm({});
  };

  const handleUserSelect = (userId: string) => {
    if (currentUser.role === 'B') return;
    setSelectedUserId(userId);
    setIsEditing(false); 
    setEditForm({});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateTenantPassword = () => {
    if (newPassword.trim().length < 4) {
      alert("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    authService.updateTenantPassword(currentUser.tenantId, newPassword);
    setIsPasswordSaved(true);
    setNewPassword('');
    setTimeout(() => setIsPasswordSaved(false), 3000);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserIcon className="text-blue-600" />
            {showUserList ? 'Directorio de Usuarios' : 'Mi Perfil'}
          </h2>
          <p className="text-gray-500">
            {currentUser.role === 'X' ? 'Administra perfiles y seguridad.' : currentUser.role === 'A' ? 'Visualiza usuarios del dominio.' : 'Gestiona tu información personal.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showUserList && (
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Usuarios ({tenantUsers.length})</h3>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{currentUser.tenantId}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {tenantUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group
                    ${targetUser.id === user.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}
                  `}
                >
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                  <div className="overflow-hidden flex-1">
                    <p className={`font-medium truncate text-sm ${targetUser.id === user.id ? 'text-blue-700' : 'text-gray-800'}`}>{user.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        user.role === 'X' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        user.role === 'A' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'
                      }`}>{user.role === 'X' ? 'Admin' : user.role === 'A' ? 'Recepción' : 'Residente'}</span>
                      {user.unit && <span className="text-[10px] text-gray-400">U:{user.unit}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`${showUserList ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          
          {/* Main Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <img src={isEditing ? (editForm.avatar || targetUser.avatar) : targetUser.avatar} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-gray-200" />
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  {isEditing && (
                    <button onClick={triggerFileInput} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={24} />
                    </button>
                  )}
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">{targetUser.name}</h3>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                  <Shield size={12} />
                  {targetUser.role === 'X' ? 'Administrador' : targetUser.role === 'A' ? 'Recepción' : `Residente ${targetUser.unit ? `(U: ${targetUser.unit})` : ''}`}
                </div>
              </div>

              {!canEdit && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-800 text-sm flex items-center gap-2 justify-center">
                  <Lock size={16} /> Solo lectura.
                </div>
              )}

              <div className="space-y-5 max-w-lg mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  {isEditing ? (
                    <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 border border-gray-100">{targetUser.name}</div>
                  )}
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
                    <div className="space-y-3">
                      <button onClick={triggerFileInput} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 text-gray-500">
                        <Upload size={20} /> <span className="font-medium">Subir imagen</span>
                      </button>
                    </div>
                  </div>
                )}

                {currentUser.role === 'X' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    {isEditing ? (
                       <div className="relative">
                          <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value as Role})} className="w-full border p-3 rounded-lg bg-white" disabled={isSelf}>
                            <option value="X">Administrador</option>
                            <option value="A">Recepción</option>
                            <option value="B">Residente</option>
                          </select>
                       </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-700 border border-gray-100">{targetUser.role === 'X' ? 'Administrador' : targetUser.role === 'A' ? 'Recepción' : 'Residente'}</div>
                    )}
                  </div>
                )}

                {canEdit && (
                  <div className="pt-4 flex justify-end gap-3">
                    {isEditing ? (
                      <>
                        <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"><Save size={18} /> Guardar</button>
                      </>
                    ) : (
                      <button onClick={handleEditClick} className="w-full md:w-auto px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"><Edit size={18} /> Editar Perfil</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ADMIN SECURITY SECTION */}
          {currentUser.role === 'X' && (
            <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
               <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-800">
                 <Shield size={20} />
                 <h3 className="font-bold">Seguridad del Condominio</h3>
               </div>
               <div className="p-6">
                 <p className="text-sm text-gray-600 mb-4">
                   Cambia la contraseña general que utilizan los residentes y el personal para ingresar a este condominio (Tenant ID: {currentUser.tenantId}).
                 </p>
                 <div className="flex flex-col md:flex-row gap-4 items-end">
                   <div className="flex-1 w-full">
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Nueva Contraseña de Acceso</label>
                     <div className="relative">
                       <input 
                         type="text" 
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         placeholder="Ej. ClaveSegura2024"
                         className="w-full border border-gray-300 p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                       />
                       <Key className="absolute left-3 top-3.5 text-gray-400" size={18} />
                     </div>
                   </div>
                   <button 
                     onClick={handleUpdateTenantPassword}
                     disabled={!newPassword}
                     className="w-full md:w-auto bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                   >
                     Actualizar Clave
                   </button>
                 </div>
                 {isPasswordSaved && (
                   <div className="mt-3 text-green-600 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                     <Shield size={14} /> Contraseña actualizada exitosamente.
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;