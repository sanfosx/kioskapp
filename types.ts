
export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export type Language = 'es' | 'en';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export interface StockHistoryEntry {
  date: string;
  type: 'initial' | 'add' | 'adjustment' | 'sale' | 'cancellation';
  quantityChange: number;
  newStock: number;
  reason: string;
  userId?: string; // Who performed the action
  costPrice?: number;
  price?: number;
}

export interface Category {
  id: string;
  name: string;
}

export type ProductType = 'single' | 'combo';

export interface ComboItem {
  productId: string;
  name: string;
  quantity: number;
}

export interface Product {
  id:string;
  barcode: string;
  name: string;
  costPrice?: number;
  price: number;
  stock: number;
  categoryId: string;
  stockHistory: StockHistoryEntry[];
  promotionPrice?: number;
  promotionEndDate?: string;
  promotionDescription?: string;
  type?: ProductType;
  comboItems?: ComboItem[];
  expiryDate?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export type PaymentMethod = 'Cash' | 'Card' | 'Online';

export interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  sellerId?: string; // Who made the sale
  items: SaleItem[];
  total: number;
  subtotal?: number;
  discount?: number;
  date: string;
  paymentMethod: PaymentMethod;
  status: 'completed' | 'cancelled';
}

export type UserRole = 'admin' | 'salesperson' | 'stock_clerk';

export interface LoginLog {
  loginTime: string;
  logoutTime?: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  userId: string;
  userName?: string;
  actionType: 'price_change' | 'stock_adjustment' | 'sale_cancellation' | 'product_creation' | 'product_deletion' | 'other';
  description: string;
  details?: any;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  loginLogs?: LoginLog[];
}
