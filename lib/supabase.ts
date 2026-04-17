import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE)
// ------------------------------------------------------------------

// Prioriza as chaves das Variáveis de Ambiente (Configurações do Google AI Studio)
// Se não houver, usa as chaves fixas abaixo como fallback.
const FALLBACK_URL = 'https://duapakdmebalyajpgbav.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1YXBha2RtZWJhbHlhanBnYmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODQ1NjksImV4cCI6MjA4Mzc2MDU2OX0.M-6iqqBoKgSa-tdBmda66CftzxpeibTSXtmgFYQXvw4';

const YOUR_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const YOUR_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Lógica de verificação
const isValid = YOUR_SUPABASE_URL?.startsWith('http' ) && YOUR_SUPABASE_KEY?.length > 20;

const url = isValid ? YOUR_SUPABASE_URL : 'https://placeholder.supabase.co';
const key = isValid ? YOUR_SUPABASE_KEY : 'placeholder';

if (!isValid) {
    console.warn('⚠️ Supabase não configurado corretamente. Verifique as variáveis de ambiente.');
}

export const supabase = createClient(url, key);
