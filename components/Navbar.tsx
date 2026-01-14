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

  // Estilos de animação inline para o efeito de tráfego
  const styles = `
    @keyframes traffic-move {
      0% { transform: translateX(-150%) skewX(-20deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateX(150vw) skewX(-20deg); opacity: 0; }
    }
    .traffic-lane {
      position: absolute;
      height: 2px;
      width: 100%;
      opacity: 0.1;
      background: rgba(255,255,255,0.1);
    }
    .car-light {
      position: absolute;
      border-radius: 99px;
      filter: blur(4px);
      animation: traffic-move linear infinite;
    }
  `;

  return (
    <div className="relative bg-slate-900 text-white shadow-2xl sticky top-0 z-50 border-b border-slate-700 overflow-hidden">
      <style>{styles}</style>

      {/* --- BACKGROUND ANIMATION LAYER (Traffic Effect) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        
        {/* Fundo Base Escuro */}
        <div className="absolute inset-0 bg-slate-900"></div>
        
        {/* Textura de Grid (Mapa GPS) */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }}>
        </div>

        {/* Efeito de Luzes (Carros passando) */}
        <div className="absolute inset-0 opacity-60">
            {/* Faixa 1: Lenta (Topo) */}
            <div className="absolute top-[20%] w-full h-[1px] bg-white/5"></div>
            <div className="car-light bg-blue-500 w-32 h-1 top-[20%]" style={{ animationDuration: '7s', animationDelay: '0s' }}></div>
            
            {/* Faixa 2: Rápida (Meio - Ida) */}
            <div className="absolute top-[45%] w-full h-[1px] bg-white/5"></div>
            <div className="car-light bg-cyan-400 w-64 h-2 top-[44%] shadow-[0_0_15px_rgba(34,211,238,0.8)]" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
            <div className="car-light bg-white w-20 h-1 top-[46%]" style={{ animationDuration: '5s', animationDelay: '3s' }}></div>

            {/* Faixa 3: Rápida (Meio - Volta/Lanternas Vermelhas) */}
            <div className="absolute top-[55%] w-full h-[1px] bg-white/5"></div>
            <div className="car-light bg-red-600 w-48 h-2 top-[54%] shadow-[0_0_15px_rgba(220,38,38,0.8)]" style={{ animationDuration: '3.5s', animationDelay: '0.5s', animationDirection: 'reverse' }}></div>
            
            {/* Faixa 4: Lenta (Baixo) */}
            <div className="absolute top-[80%] w-full h-[1px] bg-white/5"></div>
            <div className="car-light bg-blue-600 w-40 h-1 top-[80%]" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
        </div>
        
        {/* Vignette para focar no centro */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900"></div>
      </div>

      {/* --- MAIN CONTENT (z-10 para ficar acima da animação) --- */}
      <div className="relative z-10 container mx-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center gap-6">
          
          {/* Logo CSS-based (BR-Green, AS-Yellow, TECH-White on Blue) */}
          <div 
            className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-200" 
            onClick={() => setActiveTab('dashboard')}
          >
             <div className="flex items-center text-4xl md:text-5xl font-black tracking-tighter select-none gap-0.5">
                {/* BR - Verde */}
                <span 
                    className="text-green-500" 
                    style={{ textShadow: '1px 1px 0 #15803d, 2px 2px 0 #14532d, 3px 3px 4px rgba(0,0,0,0.5)' }}
                >
                    BR
                </span>
                {/* AS - Amarelo */}
                <span 
                    className="text-yellow-400"
                    style={{ textShadow: '1px 1px 0 #ca8a04, 2px 2px 0 #a16207, 3px 3px 4px rgba(0,0,0,0.5)' }}
                >
                    AS
                </span>
                {/* TECH - Branco com Fundo Azul */}
                <div className="ml-1 bg-blue-600 rounded-lg px-2 py-0 shadow-lg transform -skew-x-3 border-b-4 border-blue-800 relative overflow-hidden">
                    {/* Brilho no Tech */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-pulse"></div>
                    <span 
                        className="text-white block transform skew-x-3"
                        style={{ textShadow: 'none' }}
                    >
                        TECH
                    </span>
                </div>
             </div>
             <span className="text-[0.6rem] md:text-xs font-bold text-blue-300 tracking-[0.3em] mt-1 uppercase opacity-90 drop-shadow-md">
                Rastreamento Veicular
             </span>
          </div>

          {/* Navigation Pills */}
          <nav className="flex flex-wrap justify-center gap-2 md:gap-3 w-full max-w-4xl">
            {navItems.map((item) => {
              if (item.id === 'users' && currentUser?.name !== 'Adm Master') {
                return null;
              }

              return (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all duration-300 shadow-lg border backdrop-blur-md
                    ${activeTab === item.id 
                        ? 'bg-blue-600/90 text-white border-blue-400 scale-105 shadow-blue-500/50 ring-2 ring-blue-400/30' 
                        : 'bg-slate-800/60 text-slate-300 border-slate-600/50 hover:bg-slate-700/80 hover:text-white hover:border-slate-500'
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