import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { Calendar, ChevronDown, TrendingUp, TrendingDown, DollarSign, Wallet, Clock, Activity, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  const getTransactionDate = (dateStr: string) => {
    try {
        if (!dateStr) return { year: 0, month: -1 };
        if (dateStr.includes('-')) {
            const cleanDate = dateStr.split('T')[0];
            const parts = cleanDate.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            return { year, month };
        }
        const d = new Date(dateStr);
        return { year: d.getFullYear(), month: d.getMonth() };
    } catch (e) {
        return { year: 0, month: -1 };
    }
  };

  const previousBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
        const { year } = getTransactionDate(t.date);
        if (year < selectedYear) {
            const amount = Number(t.amount) || 0;
            const type = t.type?.toUpperCase();
            if (t.status === 'PAGO') {
                if (type === 'ENTRADA') return acc + amount;
                if (type === 'SAIDA') return acc - amount;
            }
        }
        return acc;
    }, 0);
  }, [transactions, selectedYear]);

  const yearlyData = useMemo(() => {
    const data = Array(12).fill(0).map((_, idx) => ({
      name: months[idx],
      index: idx,
      Entrada: 0,
      Saida: 0,
      Saldo: 0
    }));

    if (previousBalance !== 0) {
        data[0].Entrada += previousBalance;
    }

    transactions.forEach(t => {
      const { year, month } = getTransactionDate(t.date);
      const amount = Number(t.amount) || 0;

      if (year === selectedYear && month >= 0 && month <= 11) {
          const type = t.type?.toUpperCase();
          if (type === 'ENTRADA' && t.status === 'PAGO') {
                data[month].Entrada += amount;
          } else if (type === 'SAIDA' && t.status === 'PAGO') {
                data[month].Saida += amount;
          }
      }
    });

    for (let i = 0; i < 12; i++) {
        if (i > 0) {
            data[i].Entrada += data[i-1].Saldo;
        }
        data[i].Saldo = data[i].Entrada - data[i].Saida;
    }

    return data;
  }, [transactions, selectedYear, previousBalance]);

  const monthData = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;
    let pendingIncome = 0;
    let currentYearPreviousMonthsBalance = 0;

    if (selectedMonth > 0) {
        transactions.forEach(t => {
            const { year, month } = getTransactionDate(t.date);
            if (year === selectedYear && month < selectedMonth && t.status === 'PAGO') {
                const amount = Number(t.amount) || 0;
                const type = t.type?.toUpperCase();
                if (type === 'ENTRADA') currentYearPreviousMonthsBalance += amount;
                else if (type === 'SAIDA') currentYearPreviousMonthsBalance -= amount;
            }
        });
    }

    const startingBalance = previousBalance + currentYearPreviousMonthsBalance;

    if (startingBalance !== 0) {
        const label = selectedMonth === 0 ? 'Saldo Ano Anterior' : 'Saldo Mês Anterior';
        incomeByCategory[label] = startingBalance;
        totalIncome += startingBalance;
    }

    transactions.forEach(t => {
       const { year, month } = getTransactionDate(t.date);
       const amount = Number(t.amount) || 0;

       if (year === selectedYear && month === selectedMonth) {
            const type = t.type?.toUpperCase();
            const category = t.category || 'Geral';

            if (type === 'ENTRADA') {
                if (t.status === 'PAGO') {
                    incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
                    totalIncome += amount;
                } else {
                    pendingIncome += amount;
                }
            } else if (type === 'SAIDA') {
                if (t.status === 'PAGO') {
                    expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
                    totalExpense += amount;
                }
            }
       }
    });

    return { incomeByCategory, expenseByCategory, totalIncome, totalExpense, startingBalance, pendingIncome };
  }, [transactions, selectedYear, selectedMonth, previousBalance]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalYearIncome = yearlyData.reduce((acc, curr) => acc + curr.Entrada, 0);
  const totalYearExpense = yearlyData.reduce((acc, curr) => acc + curr.Saida, 0);

  // Colors for PieChart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  const categoryData = Object.entries(monthData.expenseByCategory).map(([name, value], index) => ({
      name, value, color: COLORS[index % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-7xl mx-auto font-sans">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
             <Activity className="text-blue-600" size={28} />
             Visão Analítica
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Acompanhe seus resultados e fluxo de caixa.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 transition-shadow hover:shadow-md">
             <div className="relative">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none bg-transparent pl-4 pr-10 py-2.5 font-semibold text-slate-700 outline-none cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
             <div className="w-px h-6 bg-slate-200"></div>
             <div className="relative">
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="appearance-none bg-transparent pl-4 pr-10 py-2.5 font-semibold text-slate-700 outline-none cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp size={80} />
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Entradas (Mês)</span>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <ArrowUpRight size={20} />
                    </div>
                </div>
                <div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(monthData.totalIncome)}</h3>
                   {previousBalance !== 0 && (
                      <p className="text-xs text-slate-400 mt-1 font-medium italic flex items-center gap-1">
                        *Inclui saldo anterior
                      </p>
                   )}
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <TrendingDown size={80} />
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Saídas (Mês)</span>
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                        <ArrowDownRight size={20} />
                    </div>
                </div>
                <div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(monthData.totalExpense)}</h3>
                </div>
            </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
            <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-400 group-hover:scale-110 transition-transform duration-500">
                <Wallet size={80} />
            </div>
            <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Saldo Mensal Total</span>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
                        <DollarSign size={20} />
                    </div>
                </div>
                <div>
                   <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(monthData.totalIncome - monthData.totalExpense)}</h3>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aguardando Recebimento</span>
                    <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                        <Clock size={20} />
                    </div>
                </div>
                <div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(monthData.pendingIncome)}</h3>
                   <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                       <div className="bg-yellow-400 h-full rounded-full w-1/3 animate-pulse"></div>
                   </div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Big Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="text-blue-600" size={20} /> Fluxo Anual
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Evolução de entradas e despesas ao longo do ano.</p>
                </div>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', padding: '12px 16px' }}
                            formatter={(value) => formatCurrency(Number(value))}
                        />
                        <Area type="monotone" name="Entradas" dataKey="Entrada" stroke="#3b82f6" strokeWidth={4} fill="url(#colorIn)" activeDot={{ r: 6, strokeWidth: 0 }} />
                        <Area type="monotone" name="Saídas" dataKey="Saida" stroke="#ef4444" strokeWidth={4} fill="url(#colorOut)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Categories / Breakdown */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                Despesas Mensais
            </h3>
            
            {categoryData.length > 0 ? (
                <div className="flex-1 flex flex-col items-center">
                    <div className="h-[200px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="w-full mt-8 space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {categoryData.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">{cat.name}</span>
                                </div>
                                <span className="text-sm font-extrabold text-slate-900">{formatCurrency(cat.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center flex-col text-slate-400">
                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <TrendingDown size={32} className="text-slate-300" />
                    </div>
                    <p className="font-medium text-sm">Nenhuma despesa no mês</p>
                </div>
            )}
        </div>
      </div>

      {/* Year Resumo Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Resumo de Caixa Anual Consolidado
            </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 uppercase font-extrabold text-xs tracking-wider">
                <th className="py-4 px-6 sm:px-8 rounded-tl-xl border-b border-slate-200">Visão Geral</th>
                {months.map(m => (
                  <th key={m} className="px-3 py-4 text-center border-b border-slate-200">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="group hover:bg-slate-50 transition-colors">
                <td className="py-5 px-6 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <ArrowUpRight size={16} />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">Entradas Totais</span>
                    </div>
                </td>
                {yearlyData.map((d, i) => (
                  <td key={d.name} className="px-3 py-4 text-xs text-center font-bold text-slate-600">
                      {d.Entrada !== 0 ? formatCurrency(d.Entrada) : <span className="text-slate-300">-</span>}
                  </td>
                ))}
              </tr>
              <tr className="group hover:bg-slate-50 transition-colors">
                <td className="py-5 px-6 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                            <ArrowDownRight size={16} />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">Despesas Totais</span>
                    </div>
                </td>
                {yearlyData.map(d => (
                  <td key={d.name} className="px-3 py-4 text-xs text-center font-bold text-slate-600">
                      {d.Saida > 0 ? formatCurrency(d.Saida) : <span className="text-slate-300">-</span>}
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-black">
                <td className="py-5 px-6 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md">
                            <DollarSign size={16} />
                        </div>
                        <span className="text-slate-900 text-sm">Saldo Financeiro Final</span>
                    </div>
                </td>
                {yearlyData.map(d => (
                  <td key={d.name} className={`px-3 py-4 text-xs text-center font-black ${d.Saldo >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                   {d.Saldo !== 0 ? formatCurrency(d.Saldo) : '-'}
                </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
