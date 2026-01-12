import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Card } from './ui/Card';
import { Calendar, ChevronDown } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  // Inicializa com o ano e mês atuais para mostrar dados relevantes imediatamente
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
  ];

  // Calculate Yearly Data for Chart & Bottom Table
  const yearlyData = useMemo(() => {
    const data = Array(12).fill(0).map((_, idx) => ({
      name: months[idx],
      index: idx,
      Entrada: 0,
      Saida: 0,
      Saldo: 0,
      Balanco: 0
    }));

    transactions.forEach(t => {
      // Parse YYYY-MM-DD manually to avoid timezone shifts
      let year, month;
      
      try {
        if (typeof t.date === 'string' && t.date.includes('-')) {
            const parts = t.date.split('T')[0].split('-'); // Handle both YYYY-MM-DD and ISO
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1; // 0-indexed for array access
        } else {
             const d = new Date(t.date);
             year = d.getFullYear();
             month = d.getMonth();
        }

        if (year === selectedYear) {
            // Removida a restrição 'PAGO'. Agora mostra previsão total (Competência)
            if (t.type === 'ENTRADA') {
                data[month].Entrada += t.amount;
            } else if (t.type === 'SAIDA') {
                data[month].Saida += t.amount;
            }
        }
      } catch (e) {
          console.error("Error parsing date for transaction", t);
      }
    });

    // Calculate balances
    data.forEach(m => {
      m.Saldo = m.Entrada - m.Saida;
      m.Balanco = m.Saldo; 
    });

    return data;
  }, [transactions, selectedYear]);

  // Calculate Selected Month Data for Side Tables
  const monthData = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
       let year, month;
       try {
            if (typeof t.date === 'string' && t.date.includes('-')) {
                const parts = t.date.split('T')[0].split('-');
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
            } else {
                const d = new Date(t.date);
                year = d.getFullYear();
                month = d.getMonth();
            }

            if (year === selectedYear && month === selectedMonth) {
                // Inclui todas as transações do mês selecionado (Pagas e Pendentes)
                if (t.type === 'ENTRADA') {
                    incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
                    totalIncome += t.amount;
                } else if (t.type === 'SAIDA') {
                    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
                    totalExpense += t.amount;
                }
            }
       } catch (e) {
           // ignore bad dates
       }
    });

    return { incomeByCategory, expenseByCategory, totalIncome, totalExpense };
  }, [transactions, selectedYear, selectedMonth]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Top Controls Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Selectors & Summaries */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Selectors - Modern Cards */}
          <div className="bg-white rounded-2xl shadow-xl p-4 border border-slate-100 flex flex-col gap-3">
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                    <Calendar size={18} />
                </div>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-slate-50 text-slate-800 font-bold rounded-xl pl-10 pr-8 py-3 appearance-none border-2 border-transparent focus:border-blue-500 outline-none cursor-pointer transition-colors hover:bg-blue-50"
                >
                  {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                </div>
             </div>

             <div className="relative">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full bg-blue-600 text-white font-bold rounded-xl pl-4 pr-8 py-3 appearance-none border-none outline-none cursor-pointer shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors text-center uppercase tracking-wider"
                >
                  {months.map((m, i) => <option key={i} value={i} className="text-slate-800 bg-white">{m}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-blue-200">
                    <ChevronDown size={16} />
                </div>
             </div>
          </div>

          {/* Entradas Summary Table */}
          <Card className="!p-0 border-none" headerColor="bg-gradient-to-r from-green-600 to-emerald-500" title="Entradas (Previsto)" centerTitle>
            <div className="divide-y divide-slate-100 bg-white">
              {Object.entries(monthData.incomeByCategory).map(([cat, val]) => (
                <div key={cat} className="flex justify-between px-6 py-3 text-sm hover:bg-green-50/50 transition-colors">
                  <span className="font-semibold text-slate-600">{cat}</span>
                  <span className="font-bold text-green-700">{formatCurrency(val as number)}</span>
                </div>
              ))}
              {Object.keys(monthData.incomeByCategory).length === 0 && (
                 <div className="p-6 text-center text-slate-400 text-xs italic">Nenhum recebimento este mês</div>
              )}
              <div className="flex justify-between px-6 py-4 bg-green-50/80 font-black border-t border-green-100 text-green-800">
                <span>TOTAL</span>
                <span>{formatCurrency(monthData.totalIncome)}</span>
              </div>
            </div>
          </Card>

           {/* Despesas Summary Table */}
           <Card className="!p-0 border-none" headerColor="bg-gradient-to-r from-red-600 to-rose-500" title="Despesas (Previsto)" centerTitle>
            <div className="divide-y divide-slate-100 bg-white">
              {Object.entries(monthData.expenseByCategory).map(([cat, val]) => (
                <div key={cat} className="flex justify-between px-6 py-3 text-sm hover:bg-red-50/50 transition-colors">
                  <span className="font-semibold text-slate-600">{cat}</span>
                  <span className="font-bold text-red-700">{formatCurrency(val as number)}</span>
                </div>
              ))}
               {Object.keys(monthData.expenseByCategory).length === 0 && (
                 <div className="p-6 text-center text-slate-400 text-xs italic">Nenhum pagamento este mês</div>
              )}
              <div className="flex justify-between px-6 py-4 bg-red-50/80 font-black border-t border-red-100 text-red-800">
                <span>TOTAL</span>
                <span>{formatCurrency(monthData.totalExpense)}</span>
              </div>
            </div>
          </Card>

        </div>

        {/* Right Side: Chart */}
        <div className="lg:col-span-9">
          <Card className="h-full min-h-[450px] relative flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-slate-800">Fluxo Financeiro (Geral)</h2>
                </div>
                <div className="px-4 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                    {selectedYear}
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value) => formatCurrency(Number(value))} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                    <Area type="monotone" name="Entradas" dataKey="Entrada" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorEntrada)" />
                    <Area type="monotone" name="Despesas" dataKey="Saida" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorSaida)" />
                </AreaChart>
                </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Year Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 mt-6">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Calendar size={20} className="text-yellow-400" />
                Resumo Detalhado {selectedYear}
            </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-4 pl-6 pr-3 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">Categoria</th>
                {months.map(m => (
                  <th key={m} className="px-2 py-4 text-center text-xs font-extrabold text-slate-500 uppercase">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              <tr className="hover:bg-green-50/30 transition-colors">
                <td className="py-4 pl-6 pr-3 text-sm font-bold text-green-700 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Entradas
                </td>
                {yearlyData.map(d => (
                  <td key={d.name} className="px-2 py-4 text-xs text-center text-slate-600 font-medium">{d.Entrada > 0 ? formatCurrency(d.Entrada) : '-'}</td>
                ))}
              </tr>
              <tr className="hover:bg-red-50/30 transition-colors">
                <td className="py-4 pl-6 pr-3 text-sm font-bold text-red-700 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Despesas
                </td>
                {yearlyData.map(d => (
                  <td key={d.name} className="px-2 py-4 text-xs text-center text-slate-600 font-medium">{d.Saida > 0 ? formatCurrency(d.Saida) : '-'}</td>
                ))}
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-4 pl-6 pr-3 text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div> Saldo
                </td>
                {yearlyData.map(d => (
                  <td key={d.name} className={`px-2 py-4 text-xs text-center font-bold ${d.Saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
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