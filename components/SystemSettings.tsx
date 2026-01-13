import React, { useState } from 'react';
import { db } from '../services/database';
import { supabase } from '../lib/supabase'; // Import direct client for testing
import { Card } from './ui/Card';
import { Download, CloudCheck, ShieldCheck, Wifi, WifiOff, Loader2, Image as ImageIcon, Camera, Upload } from 'lucide-react';

interface SystemSettingsProps {
    onLogoUpdate?: (newLogo: string) => void;
    currentLogo?: string;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onLogoUpdate, currentLogo }) => {
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [previewLogo, setPreviewLogo] = useState<string | null>(currentLogo || null);

  const handleDownload = async () => {
    try {
        const dataStr = await db.exportDatabase();
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `brastech_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        setMsg({ type: 'success', text: 'Backup da Nuvem gerado com sucesso!' });
        setTimeout(() => setMsg(null), 3000);
    } catch (e) {
        setMsg({ type: 'error', text: 'Erro ao gerar backup.' });
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    try {
        // Tenta buscar a tabela de usuários (apenas 1 linha para testar)
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error) throw error;
        
        setTestStatus('success');
        setMsg({ type: 'success', text: 'Conexão com Supabase estabelecida com sucesso!' });
    } catch (err: any) {
        console.error(err);
        setTestStatus('error');
        setMsg({ type: 'error', text: `Falha na conexão: ${err.message || 'Verifique as chaves API'}` });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // Limite aumentado para ~900KB
          if (file.size > 921600) { 
              setMsg({ type: 'error', text: 'A imagem deve ter no máximo 900KB.' });
              return;
          }

          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              setPreviewLogo(base64);
              
              // Save to DB/Local
              await db.updateSettings({ logoUrl: base64 });
              if (onLogoUpdate) onLogoUpdate(base64); // Update App state
              setMsg({ type: 'success', text: 'Logo atualizada com sucesso!' });
              setTimeout(() => setMsg(null), 3000);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-800 flex justify-center items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-2xl">
            <CloudCheck className="text-blue-600 w-8 h-8" />
          </div>
          Configurações do Sistema
        </h2>
        <p className="text-slate-500 mt-2 font-medium">Gerencie a aparência e a conexão de dados.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-center font-bold animate-in fade-in slide-in-from-top-2 border ${msg.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
            {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Personalization Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <ImageIcon className="text-purple-600" /> Personalização Visual
            </h3>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                    <div className="w-64 h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {previewLogo ? (
                            <img src={previewLogo} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                        ) : (
                            <span className="text-slate-400 font-bold">Sem Logo</span>
                        )}
                    </div>
                    
                    <label htmlFor="logo-upload" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer rounded-xl font-bold">
                        <Camera size={24} className="mb-1" />
                        Trocar Logo
                    </label>
                    <input 
                        type="file" 
                        id="logo-upload" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoUpload}
                    />
                </div>

                <div className="flex-1">
                    <h4 className="font-bold text-lg text-slate-700">Logo da Empresa</h4>
                    <p className="text-slate-500 text-sm mb-4">
                        Faça upload da sua logomarca para personalizar a barra de navegação e a tela de login. 
                        <br/>Recomendado: Imagem PNG com fundo transparente (Max 900KB).
                    </p>
                    <label htmlFor="logo-upload" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg cursor-pointer transition-colors shadow-lg">
                        <Upload size={18} /> Carregar Imagem
                    </label>
                </div>
            </div>
        </div>

        {/* Cloud Status Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center col-span-1 md:col-span-2">
            <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full transition-colors ${testStatus === 'success' ? 'bg-green-100' : testStatus === 'error' ? 'bg-red-100' : 'bg-blue-50'}`}>
                    {testStatus === 'loading' ? <Loader2 size={48} className="text-blue-600 animate-spin" /> :
                     testStatus === 'success' ? <ShieldCheck size={48} className="text-green-600" /> :
                     testStatus === 'error' ? <WifiOff size={48} className="text-red-600" /> :
                     <CloudCheck size={48} className="text-blue-600" />}
                </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Conexão com Banco de Dados</h3>
            <p className="text-slate-500 max-w-lg mx-auto mt-2 mb-6">
                Gerencie a conexão e faça backups dos dados hospedados.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                    onClick={handleTestConnection}
                    className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    <Wifi size={20} /> Testar Conexão
                </button>

                <button 
                    onClick={handleDownload}
                    className="py-3 px-8 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    <Download size={20} /> Backup (JSON)
                </button>
            </div>
        </div>

      </div>

      <div className="text-center mt-12 text-slate-400 text-sm">
        <p className="font-medium">BrasTech Database System v2.0 (Cloud)</p>
        <p>Powered by Supabase & Vercel</p>
      </div>

    </div>
  );
};