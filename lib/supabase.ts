import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// ÁREA DE CONFIGURAÇÃO DO BANCO DE DADOS
// ------------------------------------------------------------------
// Instruções:
// 1. Apague o texto entre aspas '...'
// 2. Cole suas chaves do Supabase dentro das aspas

const YOUR_SUPABASE_URL = 'https://duapakdmebalyajpgbav.supabase.co';
const YOUR_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1YXBha2RtZWJhbHlhanBnYmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODQ1NjksImV4cCI6MjA4Mzc2MDU2OX0.M-6iqqBoKgSa-tdBmda66CftzxpeibTSXtmgFYQXvw4';

// ------------------------------------------------------------------

// Lógica de segurança: Se você ainda não colou as chaves, usamos valores falsos
// para o aplicativo não travar (tela branca) ao carregar.
const isValid = YOUR_SUPABASE_URL.startsWith('http') && YOUR_SUPABASE_KEY.length > 20;

const url = isValid ? YOUR_SUPABASE_URL : 'https://placeholder.supabase.co';
const key = isValid ? YOUR_SUPABASE_KEY : 'placeholder';

if (!isValid) {
    console.warn('⚠️ Supabase não configurado. O sistema está rodando em modo offline/leitura.');
}

export const supabase = createClient(url, key);