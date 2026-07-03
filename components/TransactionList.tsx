import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, PayerOption, TransactionStatus } from '../types';
import { CheckCircle2, Clock, AlertCircle, Plus, Trash2, Edit, Calendar, DollarSign, Tag, User, FileText, UserCheck, Lock, Layers, X, ChevronLeft, ChevronRight, Filter, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Card } from './ui/Card';

interface TransactionListProps {
  type: TransactionType;
  transactions: Transaction[];
  // Atualizado para aceitar array de transações (lote)
  onAddTransaction: (t: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onUpdateStatus: (id: string, status: TransactionStatus) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean; // New prop for Access Control
  statusFilter?: TransactionStatus[];
  defaultStatus?: TransactionStatus;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  type, transactions, onAddTransaction, onUpdateTransaction, onUpdateStatus, onDelete, readOnly = false,
  statusFilter, defaultStatus, title, subtitle, buttonLabel
}) => {
  // Estado para controlar o Mês de Visualização (Padrão: Hoje)
  const [viewDate, setViewDate] = useState(new Date());

  // Funções de Navegação de Data
  const nextMonth = () => {
    setViewDate(prev => {
        const next = new Date(prev);
        next.setMonth(prev.getMonth() + 1);
        return next;
    });
  };

  const prevMonth = () => {
    setViewDate(prev => {
        const prevDate = new Date(prev);
        prevDate.setMonth(prev.getMonth() - 1);
        return prevDate;
    });
  };

  // Helper para nome do mês
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Ordenar (Mais novos primeiro), Filtrar por Mês Selecionado e Agrupar por dia
  const groupedTransactions = useMemo(() => {
    const targetMonth = viewDate.getMonth(); // 0-11
    const targetYear = viewDate.getFullYear();

    // 1. Filtrar pelo tipo, status (se fornecido) e PELO MÊS/ANO SELECIONADO
    const filtered = transactions.filter(t => {
        const tType = t.type?.toUpperCase();
        if (tType !== type?.toUpperCase()) return false;
        if (statusFilter && !statusFilter.includes(t.status)) return false;

        // Parse da data da transação (YYYY-MM-DD ou ISO)
        try {
            if (!t.date) return false;
            let year, month;
            
            if (t.date.includes('-')) {
                const cleanDate = t.date.split('T')[0];
                const parts = cleanDate.split('-');
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
            } else {
                const d = new Date(t.date);
                year = d.getFullYear();
                month = d.getMonth();
            }

            return year === targetYear && month === targetMonth;
        } catch (e) {
            return false;
        }
    });

    // 2. Ordenar decrescente (data mais nova em cima)
    const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date));

    // 3. Agrupar
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
  }, [transactions, type, viewDate]);

  // Cálculo do Total do Mês Selecionado
  const monthTotal = useMemo(() => {
      return groupedTransactions.reduce((acc, group) => {
          return acc + group.items.reduce((sum, item) => sum + Number(item.amount), 0);
      }, 0);
  }, [groupedTransactions]);

  // Helper para obter data local YYYY-MM-DD
  const getLocalToday = () => {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Installment State
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState<number>(2);

  // Refund / Receive Loan State
  const [generateRefund, setGenerateRefund] = useState(false);
  const [refundDate, setRefundDate] = useState(getLocalToday());
  const [refundInstallments, setRefundInstallments] = useState(1);

  const isEntry = type === 'ENTRADA';

  // New transaction state
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
    date: getLocalToday(),
    description: '',
    entity: '',
    amount: 0,
    category: 'Geral',
    status: defaultStatus || (isEntry ? 'AGUARDANDO' : 'PENDENTE'),
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
    // Ao editar, desativa lógica de criar parcelas novas para evitar duplicidade
    setIsInstallment(false); 
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setIsInstallment(false);
    setInstallmentsCount(2);
    setIsSubmitting(false);
    setGenerateRefund(false);
    setRefundDate(getLocalToday());
    setRefundInstallments(1);
    setNewTrans({
      date: getLocalToday(),
      description: '',
      entity: '',
      amount: 0,
      category: 'Geral',
      status: defaultStatus || (isEntry ? 'AGUARDANDO' : 'PENDENTE'),
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

  const addMonths = (dateStr: string, monthsToAdd: number) => {
      const parts = dateStr.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      date.setMonth(date.getMonth() + monthsToAdd);
      
      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || isSubmitting) return;

    setIsSubmitting(true);
    
    // Validate minimally if amount is provided, otherwise default to 0
    const finalAmount = newTrans.amount ? Number(newTrans.amount) : 0;

    const baseData = {
      description: newTrans.description || '',
      entity: newTrans.entity || '',
      category: newTrans.category || 'Geral',
      status: newTrans.status as TransactionStatus,
      type: type,
      payer: newTrans.payer,
      paymentDate: newTrans.paymentDate
    };

    try {
        if (editingId) {
            // Edição de item único
            await onUpdateTransaction({ ...baseData, date: newTrans.date!, amount: finalAmount, id: editingId });
        } else {
            // Nova Transação
            const transactionsBatch: Omit<Transaction, 'id'>[] = [];

            if (isInstallment && installmentsCount > 1 && !isEntry) {
                const total = finalAmount;
                const count = installmentsCount;
                
                const baseValue = Math.floor((total / count) * 100) / 100;
                const remainder = Number((total - (baseValue * count)).toFixed(2));
                
                for (let i = 0; i < count; i++) {
                    const currentDate = addMonths(newTrans.date!, i);
                    const installmentValue = i === 0 ? baseValue + remainder : baseValue;
                    
                    transactionsBatch.push({
                        ...baseData,
                        date: currentDate,
                        amount: installmentValue,
                        description: `${baseData.description} (${i + 1}/${count})`,
                        installmentCurrent: i + 1,
                        installmentTotal: count,
                        status: i === 0 ? baseData.status : 'PENDENTE'
                    });
                }
            } else {
                transactionsBatch.push({ ...baseData, date: newTrans.date!, amount: finalAmount });
            }

            // Refund logic
            if (!isEntry && generateRefund) {
                const total = finalAmount;
                const count = refundInstallments;
                
                const baseValue = Math.floor((total / count) * 100) / 100;
                const remainder = Number((total - (baseValue * count)).toFixed(2));

                for (let i = 0; i < count; i++) {
                    const currentDate = addMonths(refundDate, i);
                    const installmentValue = i === 0 ? baseValue + remainder : baseValue;
                    
                    transactionsBatch.push({
                        description: `${baseData.description} (Devolução${count > 1 ? ` ${i + 1}/${count}` : ''})`,
                        entity: baseData.entity,
                        category: baseData.category,
                        status: 'AGUARDANDO',
                        type: 'ENTRADA',
                        date: currentDate,
                        amount: installmentValue,
                        payer: baseData.payer,
                        installmentCurrent: count > 1 ? i + 1 : undefined,
                        installmentTotal: count > 1 ? count : undefined,
                        paymentDate: ''
                    });
                }
            }
            
            if (transactionsBatch.length === 1) {
                await onAddTransaction(transactionsBatch[0]);
            } else if (transactionsBatch.length > 1) {
                await onAddTransaction(transactionsBatch);
            }
        }
        resetForm();
    } catch (error) {
        console.error("Erro ao salvar:", error);
        setIsSubmitting(false); // Reabilita o botão em caso de erro
    }
  };

  const handleDelete = (id: string) => {
    // Add small timeout to ensure UI updates before blocking alert
    setTimeout(() => {
        if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
            onDelete(id);
        }
    }, 50);
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

  const formatWeekday = (dateStr: string) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const formatShortDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const parts = dateStr.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
  };
  
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
                {title || (isEntry ? 'Entradas' : 'Saídas')}
              </h2>
              {readOnly && (
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200 flex items-center gap-1">
                    <Lock size={12} /> Visualização
                </span>
              )}
           </div>
          <p className="text-slate-500 text-sm mt-1">
            {subtitle || (isEntry ? 'Gerencie recebimentos e contas a receber.' : 'Controle despesas e contas a pagar.')}
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
            <span>{buttonLabel || (isEntry ? "Nova Entrada" : "Nova Saída")}</span>
            </button>
        )}
      </div>

      {/* Month Navigation & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-md p-3 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100">
         {/* Navigation */}
         <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl">
            <button 
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-slate-800"
            >
                <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2 min-w-[180px] justify-center text-slate-800 font-black uppercase tracking-wide select-none">
                <Calendar size={16} className={isEntry ? 'text-green-500' : 'text-red-500'} />
                {getMonthName(viewDate)}
            </div>

            <button 
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-slate-800"
            >
                <ChevronRight size={20} />
            </button>
         </div>

         {/* Monthly Total */}
         <div className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold border ${isEntry ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
             <div className="flex flex-col items-end leading-tight">
                 <span className="text-[10px] opacity-70 uppercase tracking-widest">Total {isEntry ? 'Recebido' : 'Devido'}</span>
                 <span className="text-xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthTotal)}</span>
             </div>
             <Filter size={24} className="opacity-20" />
         </div>
      </div>

      {/* Modern Form (MODAL OVERLAY) */}
      {showForm && !readOnly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={resetForm}></div>
            
            <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                <Card 
                    title={editingId ? "Editar Lançamento" : (title ? `Nova ${title}` : (isEntry ? "Nova Entrada" : "Nova Saída"))} 
                    className={`border-t-4 ${isEntry ? 'border-t-green-500' : 'border-t-red-500'}`}
                    onBack={resetForm}
                >
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    
                    <div className="lg:col-span-2 group">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                        <Calendar size={14} /> {title === 'Contas Pendentes' ? 'Data Saída' : (isEntry ? 'Data Entrada' : 'Vencimento')}
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
                        <User size={14} /> {title === 'Contas Pendentes' ? 'Quem Pegou' : (isEntry ? 'Remetente' : 'Destinatário')}
                    </label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder={title === 'Contas Pendentes' ? "Quem pegou?" : (isEntry ? "Quem pagou?" : "Quem recebe?")}
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
                        <DollarSign size={14} /> Valor {isInstallment ? 'TOTAL' : ''} (R$)
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={newTrans.status}
                        onChange={e => setNewTrans({...newTrans, status: e.target.value as TransactionStatus})}
                        disabled={title === 'Contas Pendentes' && !editingId}
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
                                    <UserCheck size={14} /> Responsável
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

                            {/* Installment Toggle for Expenses */}
                            {!editingId && (
                                <div className="lg:col-span-12 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center cursor-pointer gap-2">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={isInstallment}
                                                onChange={(e) => setIsInstallment(e.target.checked)}
                                            />
                                            <span className="font-bold text-slate-700 flex items-center gap-2">
                                                <Layers size={18} className="text-blue-500" />
                                                Parcelado?
                                            </span>
                                        </label>
                                    </div>
                                    
                                    {isInstallment && (
                                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                                            <span className="text-sm font-medium text-slate-600">Quantidade:</span>
                                            <div className="flex items-center">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setInstallmentsCount(Math.max(2, installmentsCount - 1))}
                                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-l-lg hover:bg-slate-100 font-bold"
                                                >
                                                    -
                                                </button>
                                                <input 
                                                    type="number" 
                                                    min="2" 
                                                    max="36" 
                                                    value={installmentsCount}
                                                    onChange={(e) => setInstallmentsCount(Math.max(2, parseInt(e.target.value) || 2))}
                                                    className="w-14 h-8 text-center border-y border-slate-300 bg-blue-600 outline-none font-bold text-white" 
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setInstallmentsCount(installmentsCount + 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-r-lg hover:bg-slate-100 font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="text-xs text-slate-400 ml-2">
                                                {newTrans.amount ? `(${installmentsCount}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(newTrans.amount) / installmentsCount)})` : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Loan Refund Toggle for Expenses */}
                            {!editingId && !isEntry && (
                                <div className="lg:col-span-12 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2 flex flex-col gap-4">
                                    <label className="flex items-center cursor-pointer gap-2 w-max">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                            checked={generateRefund}
                                            onChange={(e) => setGenerateRefund(e.target.checked)}
                                        />
                                        <span className="font-bold text-blue-800 flex items-center gap-2">
                                            <ArrowUpCircle size={18} className="text-blue-600" />
                                            Gerar cobrança nas Entradas (Empréstimo/Reembolso)?
                                        </span>
                                    </label>

                                    {generateRefund && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7 animate-in fade-in slide-in-from-top-2">
                                            <div className="group">
                                                <label className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">
                                                    <Calendar size={14} /> Data do 1º Pagamento
                                                </label>
                                                <input 
                                                    type="date" 
                                                    className="w-full bg-white border border-blue-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                                                    value={refundDate} 
                                                    onChange={e => setRefundDate(e.target.value)} 
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">
                                                    <Layers size={14} /> Receber em quantas parcelas?
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="36" 
                                                    className="w-full bg-white border border-blue-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                                                    value={refundInstallments} 
                                                    onChange={e => setRefundInstallments(Math.max(1, parseInt(e.target.value) || 1))} 
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <div className="lg:col-span-12 flex justify-end gap-3 mt-2">
                    <button 
                        type="button" 
                        onClick={resetForm}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${isEntry ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                        {isSubmitting ? "Salvando..." : (editingId ? "Atualizar" : "Salvar")}
                    </button>
                    </div>
                </form>
                </Card>
            </div>
        </div>
      )}

      {/* Modern Card List Layout */}
      <div className="space-y-6 flex flex-col items-center">
          {groupedTransactions.length === 0 ? (
            <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 py-20 text-center flex flex-col items-center justify-center">
                <Clock size={48} className="text-slate-200 mb-4" />
                <p className="font-bold text-xl text-slate-700">Nenhum lançamento encontrado</p>
                <p className="text-sm font-medium text-slate-500 mt-2">Tente mudar o mês de visualização ou adicione um novo registro.</p>
            </div>
          ) : (
            groupedTransactions.map((group) => (
                <div key={group.date} className="w-full max-w-5xl">
                    {/* Date Pill Separator */}
                    <div className="relative h-14 flex items-center justify-center mb-4 mt-2">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-200/50"></div>
                        <div className="relative z-10 bg-white border border-slate-200/80 rounded-full px-6 py-2 flex items-center gap-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-500" />
                                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                                    {formatFullDate(group.date)}
                                </span>
                            </div>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">
                                {formatWeekday(group.date)}
                            </span>
                        </div>
                    </div>

                    {/* Transaction Cards Grid/List */}
                    <div className="grid grid-cols-1 gap-3">
                        {group.items.map(t => (
                            <div key={t.id} className="group relative bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300/50 transition-all duration-300">
                                
                                {/* Left: Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${isEntry ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        {isEntry ? <ArrowUpCircle size={24} strokeWidth={2.5} /> : <ArrowDownCircle size={24} strokeWidth={2.5} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-slate-900 text-base">{t.entity}</h4>
                                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-0.5">
                                            {t.description}
                                            {t.installmentCurrent && t.installmentTotal && (
                                                <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] border border-slate-200">
                                                    <Layers size={10} /> {t.installmentCurrent}/{t.installmentTotal}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Center: Amounts & Status */}
                                <div className="flex items-center gap-6 md:gap-8 bg-slate-50/50 p-3 rounded-xl md:p-0 md:bg-transparent">
                                    <div className="flex flex-col md:items-end">
                                        <span className={`font-black text-lg tracking-tight ${isEntry ? 'text-green-600' : 'text-red-500'}`}>
                                            {isEntry ? '+' : '-'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                        </span>
                                        {!isEntry && t.payer && (
                                            <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 tracking-wider">
                                                Resp: {t.payer}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actionable Status Pill */}
                                    <div className="flex flex-col justify-center min-w-[110px]">
                                        {readOnly ? (
                                            <span className={`inline-flex justify-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(t.status)}`}>
                                                {t.status}
                                            </span>
                                        ) : (
                                            <div className="relative">
                                                <select 
                                                    value={t.status}
                                                    onChange={(e) => onUpdateStatus(t.id, e.target.value as TransactionStatus)}
                                                    className={`appearance-none cursor-pointer w-full pl-3 pr-8 py-1 rounded-full text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors shadow-sm ${getStatusColor(t.status)}`}
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
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
                                                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Payment Date & Quick Actions */}
                                <div className="flex items-center justify-between md:justify-end gap-3 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                                    {!isEntry && (
                                        <div className="flex flex-col items-start md:items-end mr-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pagamento</span>
                                            {readOnly ? (
                                                <span className={`text-xs font-bold ${t.paymentDate ? 'text-blue-600' : 'text-slate-300'}`}>
                                                    {t.paymentDate ? formatFullDate(t.paymentDate) : 'Não pago'}
                                                </span>
                                            ) : (
                                                <div className={`relative flex items-center justify-center gap-1.5 px-2 py-1 rounded border transition-all ${t.paymentDate ? 'border-blue-200 bg-blue-50/50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
                                                    <Calendar size={12} className={t.paymentDate ? 'text-blue-600' : 'text-slate-400'} />
                                                    <input 
                                                        type="date" 
                                                        value={t.paymentDate || ''}
                                                        onChange={(e) => handleQuickPaymentDateChange(t, e.target.value)}
                                                        className="bg-transparent border-none p-0 text-[11px] h-4 focus:ring-0 outline-none w-[88px] text-center font-bold cursor-pointer"
                                                        style={{ color: 'inherit' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!readOnly && (
                                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl group-hover:bg-slate-100 transition-colors">
                                            <button 
                                                type="button"
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg shadow-sm transition-all"
                                                title="Editar"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(t); }}
                                            >
                                                <Edit size={16} className="pointer-events-none" />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => { 
                                                    e.preventDefault(); 
                                                    e.stopPropagation(); 
                                                    handleDelete(t.id);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg shadow-sm transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} className="pointer-events-none" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))
          )}
      </div>
    </div>
  );
};