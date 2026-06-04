export interface User {
  id: string;
  name: string;
  role: 'Owner' | 'Staff';
  pin: string;
  mobile: string;
  email: string;
  status: 'active' | 'blocked';
  registeredAt?: string;
  shopName?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  paymentMode: 'Cash' | 'UPI / GPay' | 'Net Banking';
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  date: string;
  address: string;
  serviceId: string;
  serviceName: string;
  charge: number;
  paid: number;
  dues: number;
  commission: number;
  workStatus: 'Pending' | 'Processing' | 'Complete';
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'Government' | 'Banking' | 'Insurance' | 'Recharge' | 'Other';
  govtFee: number;
  custFee: number;
  commission: number;
  isCustom?: boolean;
}

export interface WalletTransaction {
  id: string;
  date: string;
  type: 'credit' | 'debit';
  amount: number;
  sourceOrDestination: string;
  description: string;
  balanceAfter: number;
}
