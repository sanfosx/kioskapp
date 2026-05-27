import React from 'react';
import { Theme, Language, SystemUser, Product, Client, Sale, PaymentMethod, Category } from './types';
import { translations } from './translations';

export const ThemeContext = React.createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: Theme.Light,
  toggleTheme: () => {},
});

export const LanguageContext = React.createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string | keyof typeof translations.es) => string;
}>({
  language: 'es',
  setLanguage: () => {},
  t: (key) => key as string,
});

export const AuthContext = React.createContext<{
  isAuthenticated: boolean;
  login: (token: string, user: SystemUser) => void;
  logout: () => void;
  currentUser: SystemUser | null;
  idToken: string | null;
}>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  currentUser: null,
  idToken: null,
});

export const DataContext = React.createContext<{
  products: Product[];
  clients: Client[];
  sales: Sale[];
  categories: Category[];
  users: SystemUser[];
  loading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'stockHistory'>) => Promise<void>;
  updateProduct: (product: Product, reason?: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  findProductByBarcode: (barcode: string) => Product | undefined;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'total' | 'paymentMethod' | 'status'>, paymentMethod: PaymentMethod) => Promise<void>;
  cancelSale: (saleId: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addUser: (user: Omit<SystemUser, 'id' | 'createdAt'> & { password?: string }) => Promise<void>;
  updateUser: (user: SystemUser) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  reloadData: () => void;
  apiRequest: <T>(url: string, method: string, body?: any) => Promise<T>;
}>({
  products: [],
  clients: [],
  sales: [],
  categories: [],
  users: [],
  loading: true,
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
  findProductByBarcode: () => undefined,
  addClient: async () => {},
  updateClient: async () => {},
  deleteClient: async () => {},
  addSale: async () => {},
  cancelSale: async () => {},
  addCategory: async () => ({} as Category),
  updateCategory: async () => {},
  deleteCategory: async () => {},
  addUser: async () => {},
  updateUser: async () => {},
  deleteUser: async () => {},
  reloadData: () => {},
  apiRequest: async <T,>() => null as unknown as T,
});
