
export type TransactionType = 'ENTRADA' | 'SAIDA';

export type TransactionStatus = 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'AGUARDANDO';

export type PayerOption = 'Alex' | 'André' | 'Bruno' | 'Karol';

export interface Transaction {
  id: string;
  date: string; // Used as Vencimento for Payables, Entrada for Receivables
  description: string;
  entity: string; // Remetente (Entrada) or Destinatário (Saida)
  amount: number;
  status: TransactionStatus;
  type: TransactionType;
  category: string; // Kept for Dashboard analytics
  paymentDate?: string; // Only for Payables
  payer?: PayerOption; // Only for Payables
  installmentCurrent?: number; // Parcela atual (ex: 1)
  installmentTotal?: number;   // Total de parcelas (ex: 12)
}

export type ClientStatus = 'ATIVO' | 'INATIVO' | 'SUSPENSO';

export interface Client {
  id: string;
  registrationDate: string;
  name: string;
  phone: string;
  cpf: string;
  address: string;
  status: ClientStatus;
  observation: string;
  dueDate: string; // Dia do vencimento
  consultant: string;
  planValue: number; // Valor do Plano
}

export interface MonthlySummary {
  month: number;
  year: number;
  income: number;
  expenses: number;
  balance: number;
}

export type UserRole = 'ADMIN' | 'VIEWER';
export type UserStatus = 'ATIVO' | 'SUSPENSO';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added for authentication
  role: UserRole;
  status: UserStatus;
  photoUrl?: string;
  lastAccess?: string;
}
