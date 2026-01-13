import React, { useState } from 'react';
import { db } from '../services/database';
import { User } from '../types';
import { Lock, User as UserIcon, ArrowRight, Loader2, TrendingUp, ShieldCheck, MapPin } from 'lucide-react';

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
            setError('Credenciais inválidas. Verifique seu login e senha.');
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Erro de conexão. Tente novamente.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 font-sans overflow-hidden">
      
      {/* Lado Esquerdo - Visual e Animações (Visível apenas em Desktop) */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        
        {/* Background Image - Truck/Monitoring Theme */}
        <div className="absolute inset-0 z-0">
            <img 
                src="/background.png" 
                alt="Fundo Rastreamento" 
                className="w-full h-full object-cover animate-in fade-in duration-1000"
                onError={(e) => {
                    // Fallback se a imagem não existir
                    e.currentTarget.style.display = 'none';
                }}
            />
            {/* Dark Overlay Gradient to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-blue-900/40 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        {/* Animated Blobs (Subtle behind content) */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse z-0"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000 z-0"></div>

        {/* Floating Financial/Tracking Widgets (Decorative) */}
        <div className="absolute top-1/4 left-16 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl transform -rotate-6 animate-bounce duration-[3000ms] z-10">
            <div className="flex items-center gap-3 text-white mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><TrendingUp size={20} /></div>
                <div>
                    <p className="text-xs text-slate-300">Frota Ativa</p>
                    <p className="font-bold text-lg">98.5%</p>
                </div>
            </div>
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-full h-full bg-green-500 rounded-full"></div>
            </div>
        </div>

        <div className="absolute bottom-1/4 right-16 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl transform rotate-3 animate-bounce duration-[4000ms] z-10">
             <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><MapPin size={24} /></div>
                <div>
                    <p className="text-xs text-slate-300">Rastreamento</p>
                    <p className="font-bold">Tempo Real</p>
                </div>
            </div>
        </div>

        {/* Central Brand Content */}
        <div className="relative z-20 text-center px-12 flex flex-col items-center">
            <img 
                src="/logo.png" 
                alt="BrasTech Rastreamento" 
                className="w-96 h-auto mb-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML += `
                        <h1 class="text-5xl font-black text-white mb-4 tracking-tight">
                            Bras<span class="text-blue-500">Tech</span>
                        </h1>
                    `;
                }}
            />
            <p className="text-slate-300 text-lg max-w-md mx-auto leading-relaxed font-medium drop-shadow-md">
                Tecnologia avançada em rastreamento veicular e gestão logística para sua empresa ir mais longe.
            </p>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-white lg:bg-slate-50">
         
         {/* Mobile Background Decoration (Image blurred) */}
         <div className="lg:hidden absolute inset-0 z-0 overflow-hidden">
             <img 
                src="/background.png" 
                className="w-full h-full object-cover blur-sm scale-110"
                alt="background"
             />
             <div className="absolute inset-0 bg-slate-900/80"></div>
         </div>

         <div className="bg-white/95 backdrop-blur-sm w-full max-w-md p-8 md:p-12 rounded-3xl shadow-2xl lg:shadow-none lg:bg-transparent relative z-10 border lg:border-none border-slate-100/50">
            
            <div className="mb-10">
                <div className="lg:hidden flex justify-center mb-6">
                     <img 
                        src="/logo.png" 
                        alt="BrasTech" 
                        className="h-24 w-auto object-contain drop-shadow-md"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                     />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 text-center lg:text-left">Bem-vindo</h2>
                <p className="text-slate-500 text-center lg:text-left">Acesse o painel de monitoramento e gestão.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider ml-1">Usuário / Email</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            placeholder="Seu usuário de acesso"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Senha</label>
                    </div>
                    <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="password"
                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full shrink-0"></div>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                        <>
                            ACESSAR SISTEMA <ArrowRight className="h-5 w-5" />
                        </>
                    )}
                </button>

            </form>
            
            <div className="mt-8 text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase">Ambiente Seguro</span>
                </div>
                <p className="text-xs text-slate-400">
                    &copy; 2025 BrasTech Rastreamento. Todos os direitos reservados.
                </p>
            </div>
         </div>
      </div>
    </div>
  );
};