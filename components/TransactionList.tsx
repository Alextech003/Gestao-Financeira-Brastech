import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, PayerOption, TransactionStatus } from '../types';
import { CheckCircle2, Clock, AlertCircle, Plus, Trash2, Edit, Calendar, DollarSign, Tag, User, FileText, UserCheck, Lock } from 'lucide-react';
import { Card } from './ui/Card';

interface TransactionListProps {
  type: TransactionType;
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onUpdateStatus: (id: string, status: TransactionStatus) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean; // New prop for Access Control
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  type, transactions, onAddTransaction, onUpdateTransaction, onUpdateStatus, onDelete, readOnly = false
}) => {
  // Ordenar (Mais novos primeiro) e Agrupar por dia
  const groupedTransactions = useMemo(() => {
    // 1. Filtrar pelo tipo e Ordenar decrescente (data mais nova em cima)
    const sorted = transactions
      .filter(t => t.type === type)
      .sort((a, b) => b.date.localeCompare(a.date)); // String comparison is safer for YYYY-MM-DD

    // 2. Agrupar
    const groups: { date: string; items: Transaction[] }[] = [];
    
    sorted.forEach(t => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === t.date) {
        lastGroup.items.push(t);
      } else {
        groups.push({ date: t.date, items: [t] });
      }
    });

    return groups;
  }, [transactions, type]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const isEntry = type === 'ENTRADA';
  
  // Helper para obter data local YYYY-MM-DD
  const getLocalToday = () => {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  };

  // New transaction state
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
    date: getLocalToday(),
    description: '',
    entity: '',
    amount: 0,
    category: 'Geral',
    status: isEntry ? 'AGUARDANDO' : 'PENDENTE',
    payer: undefined,
    paymentDate: ''
  });

  const handleEdit = (t: Transaction) => {
    if (readOnly) return;
    setEditingId(t.id);
    setNewTrans({
      date: t.date,
      description: t.description,
      entity: t.entity,
      amount: t.amount,
      category: t.category,
      status: t.status,
      payer: t.payer,
      paymentDate: t.paymentDate || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setNewTrans({
      date: getLocalToday(),
      description: '',
      entity: '',
      amount: 0,
      category: 'Geral',
      status: isEntry ? 'AGUARDANDO' : 'PENDENTE',
      payer: undefined,
      paymentDate: ''
    });
  };

  // Lógica Automática: Mudança na Data de Vencimento
  const handleDueDateChange = (date: string) => {
    // Atualiza a data no estado
    setNewTrans(prev => {
        const updated = { ...prev, date: date };

        // Se for Contas a Pagar (SAIDA) e NÃO tiver data de pagamento preenchida
        if (!isEntry && !prev.paymentDate) {
            const today = getLocalToday();
            // Se a nova data de vencimento for menor que hoje -> ATRASADO, senão -> PENDENTE
            updated.status = date < today ? 'ATRASADO' : 'PENDENTE';
        }
        
        return updated;
    });
  };

  // Lógica Automática: Mudança na Data de Pagamento
  const handlePaymentDateChange = (date: string) => {
    if (!isEntry) {
        if (date) {
            // Se preencheu data de pagamento -> PAGO
            setNewTrans(prev => ({ ...prev, paymentDate: date, status: 'PAGO' }));
        } else {
            // Se limpou a data de pagamento -> Recalcula com base no vencimento
            setNewTrans(prev => {
                const today = getLocalToday();
                const dueDate = prev.date || today;
                const newStatus = dueDate < today ? 'ATRASADO' : 'PENDENTE';
                return { ...prev, paymentDate: date, status: newStatus };
            });
        }
    } else {
        setNewTrans(prev => ({ ...prev, paymentDate: date }));
    }
  };

  // Máscara de moeda para o input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    const amount = rawValue ? parseInt(rawValue, 10) / 100 : 0;
    setNewTrans({ ...newTrans, amount });
  };

  const handleQuickPaymentDateChange = (t: Transaction, newDate: string) => {
      if (readOnly) return;
      let newStatus: TransactionStatus = t.status;
      
      if (newDate) {
          // Se colocou data -> PAGO
          newStatus = 'PAGO';
      } else {
          // Se tirou data -> Verifica vencimento
          const today = getLocalToday();
          if (t.date < today) {
              newStatus = 'ATRASADO';
          } else {
              newStatus = 'PENDENTE';
          }
      }

      const updatedT = { 
          ...t, 
          paymentDate: newDate,
          status: newStatus 
      } as Transaction;
      onUpdateTransaction(updatedT);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    
    // Validate minimally if amount is provided, otherwise default to 0
    const finalAmount = newTrans.amount ? Number(newTrans.amount) : 0;

    const transactionData = {
      date: newTrans.date!,
      description: newTrans.description || '',
      entity: newTrans.entity || '',
      amount: finalAmount,
      category: newTrans.category || 'Geral',
      status: newTrans.status as TransactionStatus,
      type: type,
      payer: newTrans.payer,
      paymentDate: newTrans.paymentDate
    };

    if (editingId) {
      onUpdateTransaction({ ...transactionData, id: editingId });
    } else {
      onAddTransaction(transactionData);
    }
    
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
        onDelete(id);
    }
  };

  const headerGradient = isEntry ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-rose-600';
  const buttonGradient = isEntry ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700';

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'PAGO': return 'bg-green-100 text-green-700 border-green-200';
      case 'AGUARDANDO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ATRASADO': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Helper para formatar data do separador (Corrigido para evitar timezone UTC)
  const formatHeaderDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const parts = dateStr.split('-');
      // Cria a data localmente usando o construtor (Ano, Mês-1, Dia)
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Helper para formatar data curta na tabela (dd/mm) - Sem Timezone issue
  const formatShortDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const parts = dateStr.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
  };
  
  // Helper para formatar data completa na tabela (dd/mm/aaaa)
  const formatFullDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const parts = dateStr.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-lg border border-slate-100 gap-4">
        <div>
           <div className="flex items-center gap-3">
              <h2 className={`text-3xl font-black tracking-tight ${isEntry ? 'text-green-700' : 'text-red-700'}`}>
                {isEntry ? 'Contas a Receber' : 'Contas a Pagar'}
              </h2>
              {readOnly && (
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200 flex items-center gap-1">
                    <Lock size={12} /> Visualização
                </span>
              )}
           </div>
          <p className="text-slate-500 text-sm mt-1">
            {isEntry ? 'Gerencie recebimentos e datas de entrada.' : 'Controle pagamentos, vencimentos e responsáveis.'}
          </p>
        </div>
       
        {!readOnly && !showForm && (
            <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className={`group flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-1 ${buttonGradient}`}
            >
            <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                <Plus size={20} /> 
            </div>
            <span>Novo Lançamento</span>
            </button>
        )}
      </div>

      {/* Modern Form */}
      {showForm && !readOnly && (
        <Card 
            title={editingId ? "Editar Lançamento" : (isEntry ? "Novo Recebimento" : "Nova Despesa")} 
            className={`border-t-4 ${isEntry ? 'border-t-green-500' : 'border-t-red-500'}`}
            onBack={resetForm}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-2 group">
               <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                 <Calendar size={14} /> {isEntry ? 'Data Entrada' : 'Vencimento'}
               </label>
               <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={newTrans.date} 
                  onChange={e => handleDueDateChange(e.target.value)} 
                />
            </div>

            <div className="lg:col-span-4 group">
               <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                 <User size={14} /> {isEntry ? 'Remetente' : 'Destinatário'}
               </label>
               <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder={isEntry ? "Quem pagou?" : "Quem recebe?"}
                  value={newTrans.entity} 
                  onChange={e => setNewTrans({...newTrans, entity: e.target.value})} 
                />
            </div>

            <div className="lg:col-span-3 group">
               <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                 <FileText size={14} /> Descrição
               </label>
               <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Descrição do lançamento" 
                  value={newTrans.description} 
                  onChange={e => setNewTrans({...newTrans, description: e.target.value})} 
                />
            </div>

             <div className="lg:col-span-3 group">
               <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                 <Tag size={14} /> Categoria (Análise)
               </label>
               <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Ex: Aluguel, Vendas" 
                  value={newTrans.category} 
                  onChange={e => setNewTrans({...newTrans, category: e.target.value})} 
                />
            </div>

            <div className="lg:col-span-3 group">
               <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                 <DollarSign size={14} /> Valor (R$)
               </label>
               <div className="relative">
                 <span className="absolute left-4 top-3.5 text-slate-400 font-bold">R$</span>
                 <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="0,00"
                    // Formata para o padrão brasileiro visualmente
                    value={newTrans.amount ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(newTrans.amount) : ''} 
                    onChange={handleAmountChange} 
                  />
               </div>
            </div>

            <div className="lg:col-span-3 group">
               <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                 <AlertCircle size={14} /> Status
               </label>
               <select 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTrans.status}
                  onChange={e => setNewTrans({...newTrans, status: e.target.value as TransactionStatus})}
               >
                 {isEntry ? (
                    <>
                        <option value="AGUARDANDO">Aguardando</option>
                        <option value="PAGO">Pago</option>
                        <option value="ATRASADO">Atrasado</option>
                    </>
                 ) : (
                    <>
                        <option value="PENDENTE">Pendente</option>
                        <option value="PAGO">Pago</option>
                        <option value="ATRASADO">Atrasado</option>
                    </>
                 )}
               </select>
            </div>

            {!isEntry && (
                <>
                    <div className="lg:col-span-3 group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                            <UserCheck size={14} /> Quem Pagou?
                        </label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            value={newTrans.payer || ''}
                            onChange={e => setNewTrans({...newTrans, payer: e.target.value as PayerOption})}
                        >
                            <option value="">Selecione...</option>
                            <option value="Alex">Alex</option>
                            <option value="André">André</option>
                            <option value="Bruno">Bruno</option>
                            <option value="Karol">Karol</option>
                        </select>
                    </div>
                    <div className="lg:col-span-3 group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                            <Calendar size={14} /> Data Pagamento
                        </label>
                        <input 
                            type="date" 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                            value={newTrans.paymentDate || ''} 
                            onChange={e => handlePaymentDateChange(e.target.value)} 
                        />
                    </div>
                </>
            )}

            <div className="lg:col-span-12 flex justify-end gap-3 mt-2">
               <button 
                  type="button" 
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
               >
                 Cancelar
               </button>
               <button 
                  type="submit" 
                  className={`text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5 ${isEntry ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                 {editingId ? "Atualizar" : "Salvar"}
               </button>
            </div>
          </form>
        </Card>
      )}

      {/* Modern Table - Compact Layout */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className={`${headerGradient} text-white text-left`}>
                {isEntry ? (
                    // Headers for Contas a Receber
                    <>
                        <th className="px-3 py-3 text-xs font-extrabold uppercase tracking-wider first:rounded-tl-2xl">Data</th>
                        <th className="px-3 py-3 text-xs font-extrabold uppercase tracking-wider">Remetente</th>
                        <th className="px-3 py-3 text-xs font-extrabold uppercase tracking-wider">Valor</th>
                        <th className="px-3 py-3 text-xs font-extrabold uppercase tracking-wider w-1/3">Descrição</th>
                        <th className="px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wider">Status</th>
                        {!readOnly && <th className="px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wider last:rounded-tr-2xl">Ações</th>}
                    </>
                ) : (
                    // Headers for Contas a Pagar
                    <>
                        <th className="px-3 py-3 text-xs font-extrabold uppercase tracking-wider first:rounded-tl-2xl">Vencimento</th>
                        <th className="px-3 py-3 text-xs font-extrabold uppercase tracking-wider">Destinatário</th>
                        <th className="px-3 py-3 text-xs font-extrabold uppercase tracking-wider w-1/3">Descrição</th>
                        <th className="px-3 py-3 text-xs font-extrabold uppercase tracking-wider">Valor</th>
                        <th className="px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wider">Status</th>
                        <th className="px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wider">Data de Pagamento</th>
                        <th className="px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wider">Quem</th>
                        {!readOnly && <th className="px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wider last:rounded-tr-2xl">Ações</th>}
                    </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groupedTransactions.map((group) => (
                <React.Fragment key={group.date}>
                    {/* Linha Separadora de Data */}
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                        <td colSpan={10} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                            {formatHeaderDate(group.date)}
                        </td>
                    </tr>
                    
                    {/* Itens do grupo */}
                    {group.items.map(t => (
                        <tr key={t.id} className="group hover:bg-blue-50/30 transition-colors duration-200">
                        
                        {isEntry ? (
                            // Row for Contas a Receber
                            <>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">
                                    {formatShortDate(t.date)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-slate-800">
                                    {t.entity}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-green-700">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-500 whitespace-normal break-words">
                                    {t.description}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                    {readOnly ? (
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(t.status)}`}>
                                            {t.status}
                                        </span>
                                    ) : (
                                        <div className="relative inline-block">
                                            <select 
                                                value={t.status}
                                                onChange={(e) => onUpdateStatus(t.id, e.target.value as TransactionStatus)}
                                                className={`appearance-none cursor-pointer pl-2 pr-6 py-0.5 rounded-full text-[10px] font-bold border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${getStatusColor(t.status)}`}
                                            >
                                                <option value="AGUARDANDO">Aguardando</option>
                                                <option value="PAGO">Pago</option>
                                                <option value="ATRASADO">Atrasado</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-current opacity-60">
                                                <svg className="fill-current h-2 w-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </>
                        ) : (
                            // Row for Contas a Pagar
                            <>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">
                                    {formatShortDate(t.date)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-slate-800">
                                    {t.entity}
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-500 whitespace-normal break-words">
                                    {t.description}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-red-700">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                    {readOnly ? (
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(t.status)}`}>
                                            {t.status}
                                        </span>
                                    ) : (
                                        <div className="relative inline-block">
                                            <select 
                                                value={t.status}
                                                onChange={(e) => onUpdateStatus(t.id, e.target.value as TransactionStatus)}
                                                className={`appearance-none cursor-pointer pl-2 pr-6 py-0.5 rounded-full text-[10px] font-bold border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${getStatusColor(t.status)}`}
                                            >
                                                <option value="PENDENTE">Pendente</option>
                                                <option value="PAGO">Pago</option>
                                                <option value="ATRASADO">Atrasado</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-current opacity-60">
                                                <svg className="fill-current h-2 w-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-slate-500">
                                    <div className="flex items-center justify-center">
                                        {readOnly ? (
                                            <span className={`text-xs ${t.paymentDate ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                                {formatFullDate(t.paymentDate || '')}
                                            </span>
                                        ) : (
                                            <div className={`relative flex items-center justify-center gap-1 px-1 py-1 rounded-lg border transition-all ${t.paymentDate ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}>
                                                <Calendar size={12} className={t.paymentDate ? 'text-blue-600' : 'text-slate-400'} />
                                                <input 
                                                    type="date" 
                                                    value={t.paymentDate || ''}
                                                    onChange={(e) => handleQuickPaymentDateChange(t, e.target.value)}
                                                    className="bg-transparent border-none p-0 text-[10px] focus:ring-0 outline-none w-20 text-center font-medium cursor-pointer"
                                                    style={{ color: 'inherit' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                    {t.payer ? (
                                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                                            {t.payer}
                                        </span>
                                    ) : '-'}
                                </td>
                            </>
                        )}

                        {/* Actions Column (Shared) */}
                        {!readOnly && (
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1 relative z-10">
                                    <button 
                                        type="button"
                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Editar"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(t); }}
                                    >
                                        <Edit size={14} className="pointer-events-none" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation(); 
                                            setTimeout(() => handleDelete(t.id), 0);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Excluir"
                                    >
                                        <Trash2 size={14} className="pointer-events-none" />
                                    </button>
                                </div>
                            </td>
                        )}
                        </tr>
                    ))}
                </React.Fragment>
              ))}
              
              {groupedTransactions.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? (isEntry ? 5 : 7) : (isEntry ? 6 : 8)} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <DollarSign size={40} className="opacity-20" />
                        <p>Nenhum lançamento encontrado.</p>
                    </div>
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