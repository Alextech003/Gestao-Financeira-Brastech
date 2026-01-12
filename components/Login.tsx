import React, { useState } from 'react';
import { db } from '../services/database';
import { User } from '../types';
import { Lock, User as UserIcon, ChevronRight, Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const cleanEmail = email.trim();
        const cleanPass = password.trim();

        const user = await db.login(cleanEmail, cleanPass);
        if (user) {
            onLoginSuccess(user);
        } else {
            setError('Usuário não encontrado ou senha incorreta.');
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Erro ao conectar. Verifique sua internet.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in relative">
        
        {/* Decorative background circle */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-yellow-400 to-blue-600"></div>

        <div className="w-full p-8 md:p-12">
            <div className="flex flex-col items-center justify-center mb-8">
                {/* Logo Image with 3D Pop Effect */}
                <div className="w-full flex justify-center mb-2 transform hover:scale-105 transition-transform duration-300">
                    <img 
                        src="/logo.png" 
                        alt="BrasTech Rastreamento" 
                        className="w-auto h-28 md:h-32 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl font-black text-slate-800">BRAS<span class="text-blue-600">TECH</span></span>';
                        }}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Login / Usuário</label>
                    <div className="relative group">
                        <UserIcon className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="Ex: Adm Master"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input 
                            type="password" 
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-bold border border-red-100 animate-in fade-in slide-in-from-top-1 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600 block flex-shrink-0"></span>
                        <span className="flex-1">{error}</span>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <>ACESSAR SISTEMA <ChevronRight size={18} /></>}
                </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
                <p className="text-xs text-slate-400 font-medium">
                    Gestão Inteligente<br/>
                    <span className="opacity-70 mt-1 block">© 2025 Brastech Tecnologia</span>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};