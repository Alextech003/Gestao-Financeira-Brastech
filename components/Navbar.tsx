import React from 'react';
import { BarChart3, ArrowDownCircle, ArrowUpCircle, Users, Sparkles, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
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
          
          {/* Logo Image - Centralizada */}
          <div 
            className="flex items-center justify-center cursor-pointer transition-transform hover:scale-105" 
            onClick={() => setActiveTab('dashboard')}
          >
             <img 
                src="/logo.png" 
                alt="BrasTech" 
                className="h-16 md:h-20 w-auto object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] filter brightness-110"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl font-black text-white tracking-wider">BRAS<span class="text-yellow-400">TECH</span></span>';
                }}
             />
          </div>

          {/* Navigation Pills - Centralizados */}
          <nav className="flex flex-wrap justify-center gap-2 md:gap-3 w-full max-w-4xl">
            {navItems.map((item) => (
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
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};