import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { ClientList } from './components/ClientList';
import { UserList } from './components/UserList';
import { GeminiEditor } from './components/GeminiEditor';
import { Login } from './components/Login'; 
import { db } from './services/database'; 
import { Transaction, Client, TransactionStatus, User } from './types';
import { LogOut, Loader2 } from 'lucide-react';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // App Data State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // 1. Check Login on Mount
  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
        setActiveUser(user);
        setIsAuthenticated(true);
        loadData();
    }
  }, []);

  // 2. Load Data from Supabase (Async)
  const loadData = async () => {
    setLoadingData(true);
    try {
        const [tData, cData, uData] = await Promise.all([
            db.getTransactions(),
            db.getClients(),
            db.getUsers()
        ]);
        setTransactions(tData);
        setClients(cData);
        setUsers(uData);
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    } finally {
        setLoadingData(false);
    }
  };

  // 3. Auto-check for late payments
  useEffect(() => {
    if (!isAuthenticated || transactions.length === 0) return;

    const checkLate = async () => {
        // Use local date for comparison to match user's wall clock
        const d = new Date();
        const today = [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')
        ].join('-');
        
        // Find items that need update locally first to avoid infinite loops
        const toUpdate = transactions.filter(t => 
            t.type === 'SAIDA' && t.status === 'PENDENTE' && t.date < today
        );

        // Update them in Supabase
        if (toUpdate.length > 0) {
            await Promise.all(toUpdate.map(t => 
                db.updateTransaction({ ...t, status: 'ATRASADO' as TransactionStatus })
            ));
            // Reload data to reflect changes
            loadData();
        }
    };
    
    checkLate();
  }, [isAuthenticated]); // Run once when authenticated

  // --- Handlers (Async) ---

  const handleLoginSuccess = (user: User) => {
    setActiveUser(user);
    setIsAuthenticated(true);
    loadData();
  };

  const handleLogout = () => {
    db.logout();
    setIsAuthenticated(false);
    setActiveUser(null);
    setTransactions([]);
    setClients([]);
  };

  // Transactions Logic
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    setLoadingData(true);
    await db.addTransaction(t);
    await loadData(); // Reload to get the real ID from DB
  };

  const updateTransaction = async (updatedT: Transaction) => {
    // Optimistic update for UI speed
    setTransactions(prev => prev.map(t => t.id === updatedT.id ? updatedT : t));
    await db.updateTransaction(updatedT);
    await loadData(); // Sync to be sure
  };

  const updateStatus = async (id: string, status: TransactionStatus) => {
    const t = transactions.find(tr => tr.id === id);
    if (t) {
        const updated = { ...t, status };
        setTransactions(prev => prev.map(tr => tr.id === id ? updated : tr));
        await db.updateTransaction(updated);
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await db.deleteTransaction(id);
  };

  // Clients Logic
  const addClient = async (c: Omit<Client, 'id'>) => {
    setLoadingData(true);
    await db.addClient(c);
    await loadData();
  };

  const updateClient = async (c: Client) => {
    setClients(prev => prev.map(client => client.id === c.id ? c : client));
    await db.updateClient(c);
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await db.deleteClient(id);
  };

  // User Management Logic
  const addUser = async (u: Omit<User, 'id'>) => {
    setLoadingData(true);
    // Usa a senha fornecida ou padrão 123
    await db.addUser({ ...u, password: u.password || '123' });
    await loadData();
  };

  const updateUser = async (u: User) => {
    setUsers(prev => prev.map(user => user.id === u.id ? u : user));
    await db.updateUser(u);
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    await db.deleteUser(id);
  };

  // RENDER LOGIN IF NOT AUTHENTICATED
  if (!isAuthenticated || !activeUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Logout Bar */}
      <div className="bg-slate-900 text-white text-xs py-1 px-4 flex justify-between items-center">
        <div className="flex gap-2 items-center">
             {loadingData && <span className="flex items-center gap-1 text-yellow-400"><Loader2 size={10} className="animate-spin"/> Sincronizando...</span>}
        </div>
        <div className="flex items-center gap-4">
            <span>Logado como: <strong>{activeUser.name}</strong></span>
            <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-400 transition-colors">
                <LogOut size={12} /> Sair
            </button>
        </div>
      </div>
      
      <main className="container mx-auto py-6 px-4 md:px-6">
        {activeTab === 'dashboard' && <Dashboard transactions={transactions} />}
        
        {activeTab === 'receivables' && (
          <TransactionList 
            type="ENTRADA" 
            transactions={transactions} 
            onAddTransaction={addTransaction} 
            onUpdateTransaction={updateTransaction}
            onUpdateStatus={updateStatus}
            onDelete={deleteTransaction}
            readOnly={activeUser.role === 'VIEWER'}
          />
        )}
        
        {activeTab === 'payables' && (
          <TransactionList 
            type="SAIDA" 
            transactions={transactions} 
            onAddTransaction={addTransaction} 
            onUpdateTransaction={updateTransaction}
            onUpdateStatus={updateStatus}
            onDelete={deleteTransaction}
            readOnly={activeUser.role === 'VIEWER'}
          />
        )}

        {activeTab === 'clients' && (
           <ClientList 
             clients={clients}
             onAddClient={addClient}
             onUpdateClient={updateClient}
             onDeleteClient={deleteClient}
             readOnly={activeUser.role === 'VIEWER'}
           />
        )}

        {activeTab === 'users' && (
            <UserList 
                users={users}
                onAddUser={addUser}
                onUpdateUser={updateUser}
                onDeleteUser={deleteUser}
                currentUser={activeUser}
            />
        )}

        {activeTab === 'ai-editor' && <GeminiEditor />}
      </main>
    </div>
  );
}

export default App;