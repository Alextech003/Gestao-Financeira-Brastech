import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerColor?: string; // Optional header gradient
  centerTitle?: boolean; // Optional center text alignment
  onBack?: () => void; // Optional back action
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, headerColor, centerTitle, onBack }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-2xl ${className}`}>
      {title && (
        <div className={`px-6 py-4 border-b border-slate-100 flex items-center gap-3 ${headerColor ? headerColor : 'bg-gradient-to-r from-slate-50 to-white'}`}>
          {onBack && (
            <button 
              onClick={onBack}
              className={`p-1.5 rounded-full transition-colors ${headerColor ? 'text-white/80 hover:bg-white/20 hover:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}
              title="Voltar"
              type="button"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h3 className={`text-lg font-bold tracking-tight flex-1 ${headerColor ? 'text-white' : 'text-slate-800'} ${centerTitle ? 'text-center' : ''}`}>
            {title}
          </h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};