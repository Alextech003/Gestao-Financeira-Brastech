import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { Plus, Trash2, Edit, User as UserIcon, Mail, Shield, AlertTriangle, Upload, Camera, Eye, EyeOff, Lock } from 'lucide-react';
import { Card } from './ui/Card';

interface UserListProps {
  users: User[];
  onAddUser: (u: Omit<User, 'id'>) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User;
}

export const UserList: React.FC<UserListProps> = ({ 
  users, onAddUser, onUpdateUser, onDeleteUser, currentUser 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // State to manage password visibility per row
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    password: '', 
    role: 'VIEWER',
    status: 'ATIVO',
    photoUrl: ''
  });

  // Verifica se é o Master
  const isMaster = currentUser.name === 'Adm Master';

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setNewUser({
        name: u.name,
        email: u.email,
        password: u.password || '',
        role: u.role,
        status: u.status,
        photoUrl: u.photoUrl || ''
    });
    setPreviewUrl(u.photoUrl || null);
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setPreviewUrl(null);
    setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'VIEWER',
        status: 'ATIVO',
        photoUrl: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.password) {
        alert("A senha é obrigatória.");
        return;
    }

    if (editingId) {
        onUpdateUser({ ...newUser, id: editingId });
    } else {
        onAddUser(newUser);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este acesso?")) {
        onDeleteUser(id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setNewUser({ ...newUser, photoUrl: url });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getStatusColor = (status: UserStatus) => {
      if (status === 'ATIVO') return 'bg-green-100 text-green-700 border-green-200';
      return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-lg border border-slate-100 gap-4">
        <div>
           <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-100 rounded-xl">
               <Shield className="text-slate-800" size={24} />
             </div>
             <h2 className="text-3xl font-black tracking-tight text-slate-800">
                Gestão de Usuários
            </h2>
           </div>
          <p className="text-slate-500 text-sm mt-1 ml-14">Controle de acesso e permissões do sistema.</p>
        </div>
       
        <button 
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="group flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-1 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
            <Plus size={20} /> 
          </div>
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <Card 
            title={editingId ? "Editar Usuário" : "Cadastrar Usuário"} 
            className="border-t-4 border-t-slate-800"
            onBack={resetForm}
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Photo Upload */}
                <div className="lg:col-span-3 flex flex-col items-center gap-4">
                    <div className="relative w-32 h-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={40} className="text-slate-300" />
                        )}
                        <label htmlFor="photo-upload" className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera size={24} />
                            <span className="text-xs font-bold mt-1">Alterar</span>
                        </label>
                        <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Foto de Perfil</span>
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome Completo</label>
                        <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-500" placeholder="Ex: João da Silva"
                            value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Login de Acesso</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-slate-500" placeholder="Ex: Financeiro"
                                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-slate-500 font-mono" placeholder="Senha do usuário"
                                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                         {/* Role Selection */}
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nível de Acesso</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-500"
                            value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                            <option value="ADMIN">Administrador (Total)</option>
                            <option value="VIEWER">Visualizador (Apenas Leitura)</option>
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Status da Conta</label>
                         <div className="flex gap-4">
                            <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${newUser.status === 'ATIVO' ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200 text-slate-500'}`}>
                                <input type="radio" name="status" className="hidden" checked={newUser.status === 'ATIVO'} onChange={() => setNewUser({...newUser, status: 'ATIVO'})} />
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="font-bold text-sm">ATIVO</span>
                            </label>
                             <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${newUser.status === 'SUSPENSO' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200 text-slate-500'}`}>
                                <input type="radio" name="status" className="hidden" checked={newUser.status === 'SUSPENSO'} onChange={() => setNewUser({...newUser, status: 'SUSPENSO'})} />
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="font-bold text-sm">SUSPENSO</span>
                            </label>
                         </div>
                    </div>
                </div>

                <div className="lg:col-span-12 flex justify-end gap-3 pt-4 border-t border-slate-100">
                     <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
                     <button type="submit" className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 shadow-lg">
                        {editingId ? "Atualizar Acesso" : "Criar Usuário"}
                     </button>
                </div>
            </form>
        </Card>
      )}

      {/* Users List Table (Alternado para Tabela para melhor visualização das senhas) */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="bg-slate-100 text-slate-600 text-left text-xs uppercase font-bold tracking-wider">
                        <th className="px-6 py-4">Usuário</th>
                        <th className="px-6 py-4">Login</th>
                        {/* SECRET MASTER COLUMN */}
                        {isMaster && <th className="px-6 py-4 text-red-600">Senha (Master)</th>}
                        <th className="px-6 py-4 text-center">Nível</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm flex-shrink-0">
                                        {u.photoUrl ? (
                                            <img src={u.photoUrl} alt={u.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-700 text-white font-bold text-sm">
                                                {u.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-bold text-slate-800 text-sm">{u.name}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {u.email}
                            </td>
                            
                            {/* Password Column - Only for Master */}
                            {isMaster && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-1 rounded-lg w-fit">
                                        <span className="font-mono text-sm text-red-800 min-w-[80px]">
                                            {visiblePasswords.has(u.id) ? u.password : '••••••••'}
                                        </span>
                                        <button 
                                            onClick={() => togglePasswordVisibility(u.id)}
                                            className="text-red-400 hover:text-red-700 transition-colors p-1"
                                            title="Ver senha"
                                        >
                                            {visiblePasswords.has(u.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </td>
                            )}

                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(u.role)}`}>
                                    {u.role === 'ADMIN' ? 'Admin' : 'Viewer'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(u.status)}`}>
                                    {u.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                     <button 
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(u); }} 
                                        className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    {u.id !== currentUser.id && (
                                        <button 
                                            type="button"
                                            onClick={(e) => { 
                                                e.preventDefault(); 
                                                e.stopPropagation(); 
                                                setTimeout(() => handleDelete(u.id), 0);
                                            }} 
                                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};