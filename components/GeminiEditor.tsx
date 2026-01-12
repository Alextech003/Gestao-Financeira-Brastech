import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Wand2, Loader2, ImageIcon, Download } from 'lucide-react';
import { Card } from './ui/Card';

// Helper seguro para pegar a chave API sem quebrar se process não existir
const getApiKey = () => {
    try {
        // @ts-ignore
        return process?.env?.API_KEY;
    } catch {
        return undefined;
    }
};

export const GeminiEditor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setGeneratedImage(null);
      setError(null);
    }
  };

  const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1];
        resolve({
          inlineData: {
            data: base64Content,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    const apiKey = getApiKey();
    
    if (!file) {
        setError("Selecione um arquivo primeiro.");
        return;
    }

    if (!apiKey) {
        setError("API Key do Google Gemini não configurada no ambiente.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const imagePart = await fileToGenerativePart(file);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            imagePart,
            { text: prompt || "Analyze this image and improve its quality." }
          ]
        }
      });

      console.log("Gemini Response:", response);
      
      let foundImage = false;
      const parts = response.candidates?.[0]?.content?.parts;
      
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            setGeneratedImage(`data:${mimeType};base64,${base64Data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        setError("O modelo não retornou uma imagem editada. Tente ajustar o prompt.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao gerar imagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex justify-center items-center gap-2">
          <SparklesIcon className="text-purple-600" />
          Editor Inteligente
        </h2>
        <p className="text-gray-500 mt-2">Use a IA para editar recibos, logotipos ou analisar documentos visuais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card title="1. Imagem e Instrução" className="h-full">
            <div className="space-y-4">
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                        id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded shadow-sm object-contain" />
                        ) : (
                            <div className="flex flex-col items-center text-gray-400 py-8">
                                <Upload size={48} className="mb-2" />
                                <span className="font-medium">Clique para carregar imagem</span>
                            </div>
                        )}
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Como você quer editar?</label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                        rows={3}
                        placeholder="Ex: Remova o fundo, melhore o contraste, ou extraia o texto..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={!file || loading}
                    className={`w-full py-3 rounded-lg font-bold text-white flex justify-center items-center gap-2 shadow-lg transition-all
                        ${!file || loading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02]'
                        }`}
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    {loading ? 'Processando...' : 'Gerar com IA'}
                </button>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
        </Card>

        {/* Output Section */}
        <Card title="2. Resultado" className="h-full min-h-[400px] flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 m-2">
                {generatedImage ? (
                    <div className="relative group w-full h-full flex items-center justify-center p-2">
                        <img src={generatedImage} alt="Generated" className="max-h-[500px] w-full object-contain rounded shadow-lg" />
                        <a 
                            href={generatedImage} 
                            download="editado-gemini.png"
                            className="absolute bottom-4 right-4 bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                            title="Baixar Imagem"
                        >
                            <Download size={20} />
                        </a>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">
                        <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                        <p>O resultado aparecerá aqui</p>
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
  );
};

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={`w-8 h-8 ${className}`}
  >
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 15.03a.75.75 0 011.06 0l1.97 1.97a.75.75 0 11-1.06 1.06l-1.97-1.97a.75.75 0 010-1.06zm9.97-9.97a.75.75 0 010 1.06l-1.97 1.97a.75.75 0 11-1.06-1.06l1.97-1.97a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);