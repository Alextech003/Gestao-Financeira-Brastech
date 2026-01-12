import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Card } from './ui/Card';
import { Calendar, ChevronDown, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  // Inicializa com o ano e mês atuais
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
  ];

  // Helper para extrair Ano e Mês sem sofrer com Fuso Horário (Timezone)
  const getTransactionDate = (dateStr: string) => {
    try {
        if (!dateStr) return { year: 0, month: -1 };
        
        // Se for formato ISO ou YYYY-MM-DD (padrão do input type="date")
        if (dateStr.includes('-')) {
            const cleanDate = dateStr.split('T')[0]; // Remove hora se houver
            const parts = cleanDate.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Mês 0-indexado
            return { year, month };
        }
        
        // Fallback para outros formatos
        const d = new Date(dateStr);
        return { year: d.getFullYear(), month: d.getMonth() };
    } catch (e) {
        return { year: 0, month: -1 };
    }
  };

  // Cálculo dos dados anuais (Gráfico e Tabela Inferior)
  const yearlyData = useMemo(() => {
    // Cria estrutura base zerada para os 12 meses
    const data = Array(12).fill(0).map((_, idx) => ({
      name: months[idx],
      index: idx,
      Entrada: 0,
      Saida: 0,
      Saldo: 0
    }));

    transactions.forEach(t => {
      const { year, month } = getTransactionDate(t.date);
      
      // Garante que amount é número
      const amount = Number(t.amount) || 0;

      if (year === selectedYear && month >= 0 && month <= 11) {
          // Normaliza o tipo para garantir match
          const type = t.type?.toUpperCase();
          
          if (type === 'ENTRADA') {
              data[month].Entrada += amount;
          } else if (type === 'SAIDA') {
              data[month].Saida += amount;
          }
      }
    });

    // Calcula saldos finais
    data.forEach(m => {
      m.Saldo = m.Entrada - m.Saida;
    });

    return data;
  }, [transactions, selectedYear]);

  // Cálculo dos dados do Mês Selecionado (Resumo Lateral)
  const monthData = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
       const { year, month } = getTransactionDate(t.date);
       const amount = Number(t.amount) || 0;

       if (year === selectedYear && month === selectedMonth) {
            const type = t.type?.toUpperCase();
            const category = t.category || 'Geral';

            if (type === 'ENTRADA') {
                incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
                totalIncome += amount;
            } else if (type === 'SAIDA') {
                expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
                totalExpense += amount;
            }
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
                  {/* Gera lista de anos dinamicamente baseada nos dados ou padrão */}
                  {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
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
          <Card className="!p-0 border-none overflow-hidden" headerColor="bg-gradient-to-r from-green-600 to-emerald-500" title="Entradas" centerTitle>
            <div className="divide-y divide-slate-100 bg-white">
              <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                  {Object.entries(monthData.incomeByCategory).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between px-6 py-3 text-sm hover:bg-green-50/50 transition-colors">
                      <span className="font-semibold text-slate-600 truncate mr-2">{cat}</span>
                      <span className="font-bold text-green-700 whitespace-nowrap">{formatCurrency(val as number)}</span>
                    </div>
                  ))}
                  {Object.keys(monthData.incomeByCategory).length === 0 && (
                     <div className="p-6 text-center text-slate-400 text-xs italic">Nenhum recebimento este mês</div>
                  )}
              </div>
              <div className="flex justify-between px-6 py-4 bg-green-50/80 font-black border-t border-green-100 text-green-800">
                <span>TOTAL</span>
                <span>{formatCurrency(monthData.totalIncome)}</span>
              </div>
            </div>
          </Card>

           {/* Despesas Summary Table */}
           <Card className="!p-0 border-none overflow-hidden" headerColor="bg-gradient-to-r from-red-600 to-rose-500" title="Despesas" centerTitle>
            <div className="divide-y divide-slate-100 bg-white">
              <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                  {Object.entries(monthData.expenseByCategory).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between px-6 py-3 text-sm hover:bg-red-50/50 transition-colors">
                      <span className="font-semibold text-slate-600 truncate mr-2">{cat}</span>
                      <span className="font-bold text-red-700 whitespace-nowrap">{formatCurrency(val as number)}</span>
                    </div>
                  ))}
                   {Object.keys(monthData.expenseByCategory).length === 0 && (
                     <div className="p-6 text-center text-slate-400 text-xs italic">Nenhum pagamento este mês</div>
                  )}
              </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full"></div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Fluxo Financeiro</h2>
                        <p className="text-xs text-slate-400 font-medium">Análise de Entradas e Saídas (Previsto + Realizado)</p>
                    </div>
                </div>
                
                {/* Mini Summary Chips for the Year */}
                <div className="flex gap-3 text-xs font-bold">
                    <div className="px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-100 flex items-center gap-2">
                        <TrendingUp size={14} />
                        {formatCurrency(yearlyData.reduce((acc, curr) => acc + curr.Entrada, 0))}
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center gap-2">
                        <TrendingDown size={14} />
                        {formatCurrency(yearlyData.reduce((acc, curr) => acc + curr.Saida, 0))}
                    </div>
                     <div className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-2">
                        {selectedYear}
                    </div>
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearlyData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
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
                        labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                    <Area type="monotone" name="Entradas" dataKey="Entrada" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorEntrada)" animationDuration={1000} />
                    <Area type="monotone" name="Despesas" dataKey="Saida" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorSaida)" animationDuration={1000} />
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