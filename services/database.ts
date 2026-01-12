import { supabase } from '../lib/supabase';
import { Transaction, Client, User } from '../types';

// O DatabaseService agora é assíncrono para se comunicar com o Supabase
class DatabaseService {
    
    // --- Transactions ---
    async getTransactions(): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*');
        
        if (error) {
            console.error('Erro ao buscar transações:', error);
            return [];
        }
        return data as Transaction[];
    }

    async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
        // Remove ID undefined se existir para o banco gerar
        const { id, ...payload } = transaction as any;
        
        const { data, error } = await supabase
            .from('transactions')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Erro ao adicionar transação:', error);
            return null;
        }
        return data;
    }

    async updateTransaction(transaction: Transaction): Promise<boolean> {
        // Converte campos undefined para null para o banco aceitar
        const payload = {
            ...transaction,
            paymentDate: transaction.paymentDate || null,
            payer: transaction.payer || null
        };

        const { error } = await supabase
            .from('transactions')
            .update(payload)
            .eq('id', transaction.id);

        if (error) {
            console.error('Erro ao atualizar transação:', error);
            return false;
        }
        return true;
    }

    async deleteTransaction(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) return false;
        return true;
    }

    // --- Clients ---
    async getClients(): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('*');

        if (error) {
            console.error('Erro ao buscar clientes:', error);
            return [];
        }
        return data as Client[];
    }

    async addClient(client: Omit<Client, 'id'>): Promise<Client | null> {
        const { id, ...payload } = client as any;
        const { data, error } = await supabase
            .from('clients')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Erro ao adicionar cliente:', error);
            return null;
        }
        return data;
    }

    async updateClient(client: Client): Promise<boolean> {
        const { error } = await supabase
            .from('clients')
            .update(client)
            .eq('id', client.id);

        if (error) return false;
        return true;
    }

    async deleteClient(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) return false;
        return true;
    }

    // --- Users ---
    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) return [];
        return data as User[];
    }

    async addUser(user: Omit<User, 'id'>): Promise<User | null> {
        const { id, ...payload } = user as any;
        const { data, error } = await supabase
            .from('users')
            .insert([payload])
            .select()
            .single();

        if (error) return null;
        return data;
    }

    async updateUser(user: User): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .update(user)
            .eq('id', user.id);

        if (error) return false;
        return true;
    }

    async deleteUser(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) return false;
        return true;
    }

    // --- Authentication ---
    async login(email: string, pass: string): Promise<User | null> {
        // Busca usuário na tabela 'users'
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', pass)
            .single();

        if (error || !data) return null;

        const user = data as User;
        if (user.status === 'SUSPENSO') throw new Error('Conta suspensa. Contate o administrador.');
        
        // Atualiza lastAccess
        const now = new Date();
        const lastAccess = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        
        // Não esperamos o update terminar para logar o usuário, fire-and-forget
        this.updateUser({ ...user, lastAccess });
        
        // Salva sessão no LocalStorage apenas para manter o login ao dar F5
        const sessionUser = { ...user, lastAccess };
        localStorage.setItem('brastech_session', JSON.stringify(sessionUser));
        return sessionUser;
    }

    logout() {
        localStorage.removeItem('brastech_session');
    }

    getCurrentUser(): User | null {
        const session = localStorage.getItem('brastech_session');
        return session ? JSON.parse(session) : null;
    }

    // --- Export (Backup) ---
    async exportDatabase(): Promise<string> {
        const [trans, clients, users] = await Promise.all([
            this.getTransactions(),
            this.getClients(),
            this.getUsers()
        ]);

        const data = {
            transactions: trans,
            clients: clients,
            users: users,
            exportDate: new Date().toISOString(),
            source: 'Supabase Cloud'
        };
        return JSON.stringify(data, null, 2);
    }
}

export const db = new DatabaseService();