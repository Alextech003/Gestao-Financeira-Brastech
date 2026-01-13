import React from 'react';
import { BarChart3, ArrowDownCircle, ArrowUpCircle, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, currentUser }) => {
  const navItems = [
    { id: 'dashboard', label: 'ANÁLISES', icon: BarChart3 },
    { id: 'receivables', label: 'ENTRADAS', icon: ArrowUpCircle },
    { id: 'payables', label: 'SAÍDAS', icon: ArrowDownCircle },
    { id: 'clients', label: 'CLIENTES', icon: Users },
    { id: 'users', label: 'USUÁRIOS', icon: ShieldCheck },
    { id: 'ai-editor', label: 'IA EDITOR', icon: Sparkles },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl sticky top-0 z-50 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        {/* Alterado para flex-col e items-center para centralizar tudo verticalmente */}
        <div className="flex flex-col items-center justify-center gap-6">
          
          {/* Logo CSS-based (Updated Colors: BR-Green, AS-Yellow, TECH-White on Blue) */}
          <div 
            className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-200" 
            onClick={() => setActiveTab('dashboard')}
          >
             <div className="flex items-center text-4xl md:text-5xl font-black tracking-tighter select-none gap-0.5">
                {/* BR - Verde */}
                <span 
                    className="text-green-500" 
                    style={{ textShadow: '1px 1px 0 #15803d, 2px 2px 0 #14532d, 3px 3px 4px rgba(0,0,0,0.3)' }}
                >
                    BR
                </span>
                {/* AS - Amarelo */}
                <span 
                    className="text-yellow-400"
                    style={{ textShadow: '1px 1px 0 #ca8a04, 2px 2px 0 #a16207, 3px 3px 4px rgba(0,0,0,0.3)' }}
                >
                    AS
                </span>
                {/* TECH - Branco com Fundo Azul */}
                <div className="ml-1 bg-blue-600 rounded-lg px-2 py-0 shadow-lg transform -skew-x-3 border-b-4 border-blue-800">
                    <span 
                        className="text-white block transform skew-x-3"
                        style={{ textShadow: 'none' }}
                    >
                        TECH
                    </span>
                </div>
             </div>
             <span className="text-[0.6rem] md:text-xs font-bold text-blue-300 tracking-[0.3em] mt-1 uppercase opacity-80">
                Rastreamento Veicular
             </span>
          </div>

          {/* Navigation Pills - Centralizados */}
          <nav className="flex flex-wrap justify-center gap-2 md:gap-3 w-full max-w-4xl">
            {navItems.map((item) => {
              // Regra de Visibilidade: A aba Usuários só aparece para o Master
              if (item.id === 'users' && currentUser?.name !== 'Adm Master') {
                return null;
              }

              return (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all duration-300 shadow-lg border backdrop-blur-sm
                    ${activeTab === item.id 
                        ? 'bg-blue-600 text-white border-blue-400 scale-105 shadow-blue-500/50 ring-2 ring-blue-400/30' 
                        : 'bg-slate-700/40 text-slate-300 border-slate-600/50 hover:bg-slate-600 hover:text-white hover:border-slate-500'
                    }
                    `}
                >
                    <item.icon size={16} />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};