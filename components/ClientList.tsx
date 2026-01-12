import React, { useState } from 'react';
import { Client, ClientStatus } from '../types';
import { Plus, Trash2, Edit, Search, User, MapPin, Phone, Calendar, FileText, BadgeCheck, DollarSign, ChevronDown, Lock } from 'lucide-react';
import { Card } from './ui/Card';

interface ClientListProps {
  clients: Client[];
  onAddClient: (c: Omit<Client, 'id'>) => void;
  onUpdateClient: (c: Client) => void;
  onDeleteClient: (id: string) => void;
  readOnly?: boolean;
}

export const ClientList: React.FC<ClientListProps> = ({ 
  clients, onAddClient, onUpdateClient, onDeleteClient, readOnly = false
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    registrationDate: new Date().toISOString().split('T')[0],
    name: '',
    phone: '',
    cpf: '',
    address: '',
    status: 'ATIVO',
    observation: '',
    dueDate: '',
    consultant: '',
    planValue: 0,
  });

  const handleEdit = (c: Client) => {
    if (readOnly) return;
    setEditingId(c.id);
    setNewClient({
        registrationDate: c.registrationDate,
        name: c.name,
        phone: c.phone,
        cpf: c.cpf,
        address: c.address,
        status: c.status,
        observation: c.observation,
        dueDate: c.dueDate,
        consultant: c.consultant,
        planValue: c.planValue || 0,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setNewClient({
        registrationDate: new Date().toISOString().split('T')[0],
        name: '',
        phone: '',
        cpf: '',
        address: '',
        status: 'ATIVO',
        observation: '',
        dueDate: '',
        consultant: '',
        planValue: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    if (editingId) {
        onUpdateClient({ ...newClient, id: editingId });
    } else {
        onAddClient(newClient);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
        onDeleteClient(id);
    }
  };

  const handleQuickStatusChange = (c: Client, newStatus: ClientStatus) => {
      if (readOnly) return;
      onUpdateClient({ ...c, status: newStatus });
  };

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-700 border-green-200';
      case 'INATIVO': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'SUSPENSO': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-50';
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-lg border border-slate-100 gap-4">
        <div>
           <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-blue-800">
                Gestão de Clientes
              </h2>
              {readOnly && (
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200 flex items-center gap-1">
                    <Lock size={12} /> Visualização
                </span>
              )}
           </div>
          <p className="text-slate-500 text-sm mt-1">Base de dados completa dos seus clientes.</p>
        </div>
       
        {!readOnly && !showForm && (
            <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
            <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                <Plus size={20} /> 
            </div>
            <span>Novo Cliente</span>
            </button>
        )}
      </div>

      {/* Form */}
      {showForm && !readOnly && (
        <Card 
            title={editingId ? "Editar Cliente" : "Cadastrar Cliente"} 
            className="border-t-4 border-t-blue-600"
            onBack={resetForm}
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Data Cadastro</label>
                    <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                        value={newClient.registrationDate} onChange={e => setNewClient({...newClient, registrationDate: e.target.value})} />
                </div>
                <div className="lg:col-span-6">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome do Cliente</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome Completo"
                        value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                </div>
                <div className="lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CPF/CNPJ</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="000.000.000-00"
                        value={newClient.cpf} onChange={e => setNewClient({...newClient, cpf: e.target.value})} />
                </div>

                <div className="lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Telefone</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="(00) 00000-0000"
                        value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                </div>
                <div className="lg:col-span-6">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Endereço</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rua, Número, Bairro..."
                        value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} />
                </div>
                 <div className="lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={newClient.status} onChange={e => setNewClient({...newClient, status: e.target.value as ClientStatus})}>
                        <option value="ATIVO">ATIVO</option>
                        <option value="INATIVO">INATIVO</option>
                        <option value="SUSPENSO">SUSPENSO</option>
                    </select>
                </div>

                <div className="lg:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Consultor Responsável</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={newClient.consultant} onChange={e => setNewClient({...newClient, consultant: e.target.value})} />
                </div>
                <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Dia Vencimento</label>
                    <input required type="number" min="1" max="31" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dia"
                        value={newClient.dueDate} onChange={e => setNewClient({...newClient, dueDate: e.target.value})} />
                </div>
                <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Valor Plano</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400 text-xs font-bold">R$</span>
                        <input required type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                            value={newClient.planValue} onChange={e => setNewClient({...newClient, planValue: Number(e.target.value)})} />
                    </div>
                </div>
                 <div className="lg:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Observação</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={newClient.observation} onChange={e => setNewClient({...newClient, observation: e.target.value})} />
                </div>

                <div className="lg:col-span-12 flex justify-end gap-3 mt-4">
                     <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
                     <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg">
                        {editingId ? "Atualizar Cliente" : "Salvar Cliente"}
                     </button>
                </div>
            </form>
        </Card>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white text-left">
                <th className="px-6 py-5 text-xs font-extrabold uppercase tracking-wider first:rounded-tl-2xl">Cadastro</th>
                <th className="px-6 py-5 text-xs font-extrabold uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-5 text-xs font-extrabold uppercase tracking-wider">Contato</th>
                <th className="px-6 py-5 text-xs font-extrabold uppercase tracking-wider">Consultor</th>
                <th className="px-6 py-5 text-xs font-extrabold uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-5 text-xs font-extrabold uppercase tracking-wider">Valor Plano</th>
                <th className="px-6 py-5 text-center text-xs font-extrabold uppercase tracking-wider">Status</th>
                {!readOnly && <th className="px-6 py-5 text-center text-xs font-extrabold uppercase tracking-wider last:rounded-tr-2xl">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {clients.map(c => (
                    <tr key={c.id} className="group hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {new Date(c.registrationDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{c.name}</span>
                                <span className="text-xs text-slate-400">{c.cpf}</span>
                            </div>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                                <span className="text-sm text-slate-600">{c.phone}</span>
                                <span className="text-xs text-slate-400 truncate max-w-[150px]" title={c.address}>{c.address}</span>
                            </div>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                            {c.consultant}
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-slate-600">
                            Dia {c.dueDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                            {formatCurrency(c.planValue || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                            {/* Quick Status Change for Clients */}
                            {readOnly ? (
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(c.status)}`}>
                                    {c.status}
                                </span>
                            ) : (
                                <div className="relative inline-block">
                                    <select 
                                        value={c.status}
                                        onChange={(e) => handleQuickStatusChange(c, e.target.value as ClientStatus)}
                                        className={`appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${getStatusColor(c.status)}`}
                                    >
                                        <option value="ATIVO">ATIVO</option>
                                        <option value="INATIVO">INATIVO</option>
                                        <option value="SUSPENSO">SUSPENSO</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
                                        <ChevronDown className="h-3 w-3" />
                                    </div>
                                </div>
                            )}
                        </td>
                        {!readOnly && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2 relative z-10">
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(c); }} 
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" 
                                        title="Editar"
                                    >
                                        <Edit size={16} className="pointer-events-none" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation(); 
                                            setTimeout(() => handleDelete(c.id), 0);
                                        }} 
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} className="pointer-events-none" />
                                    </button>
                                </div>
                            </td>
                        )}
                    </tr>
                ))}
                 {clients.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 7 : 8} className="px-6 py-12 text-center text-slate-400">
                    <p>Nenhum cliente cadastrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};