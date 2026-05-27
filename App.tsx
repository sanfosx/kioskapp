
import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Theme, Product, Client, Sale, PaymentMethod, Category, SystemUser, Language } from './types';
import { translations } from './translations';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import { NotificationProvider, useNotification } from './components/Notification';
// Import types for TypeScript support


// --- API Configuration ---
const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || (
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3000'
    ? 'http://localhost:3001/api' 
    : 'https://apikiosko.vercel.app/api'
);

console.log("Configured API_URL:", API_URL);

// --- Context Definitions ---

import { ThemeContext, LanguageContext, AuthContext, DataContext } from './context';

// --- API Configuration ---

import LandingPage from './pages/LandingPage';

const AppContent: React.FC = () => {
    const { isAuthenticated, idToken, currentUser } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const addNotification = useNotification();

    const getAuthHeaders = useCallback(() => {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        }
    }, [idToken]);

    const loadSettings = useCallback(async () => {
        try {
            const data = await apiRequest<any>(`${API_URL}/settings`, 'GET');
            return data;
        } catch {
            return null;
        }
    }, [apiRequest]);

    const loadData = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const [productsData, clientsData, categoriesData, salesData, usersData] = await Promise.all([
                apiRequest<Product[]>(`${API_URL}/products`, 'GET').catch(() => []),
                currentUser?.role !== 'stock_clerk' ? apiRequest<Client[]>(`${API_URL}/clients`, 'GET').catch(() => []) : Promise.resolve([]),
                apiRequest<Category[]>(`${API_URL}/categories`, 'GET').catch(() => []),
                currentUser?.role !== 'stock_clerk' ? apiRequest<Sale[]>(`${API_URL}/sales?limit=200`, 'GET').catch(() => []) : Promise.resolve([]),
                currentUser?.role === 'admin' ? apiRequest<SystemUser[]>(`${API_URL}/users`, 'GET').catch(() => []) : Promise.resolve([])
            ]);
            setProducts(productsData || []);
            setClients(clientsData || []);
            setCategories(categoriesData || []);
            setSales(salesData || []);
            setUsers(usersData || []);
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, currentUser, apiRequest]);

    // --- Data Loaders ---
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            setProducts([]);
            setClients([]);
            setSales([]);
            setCategories([]);
            setUsers([]);
            return;
        }
        
        loadData();
        
        // Simple polling for "real-time" imitation (Optional, e.g., every 15s)
        const interval = setInterval(() => {
            loadData();
        }, 15000);

        return () => clearInterval(interval);
    }, [isAuthenticated, loadData]);

    const reloadData = useCallback(() => {
        loadData();
    }, [loadData]);

    const apiRequest = useCallback(async <T,>(url: string, method: string, body?: any): Promise<T> => {
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
        }
        if (response.status === 204) {
            return null as T;
        }
        return response.json();
    }, [getAuthHeaders]);

    const addProduct = useCallback(async (product: Omit<Product, 'id' | 'stockHistory'>) => {
        await apiRequest(`${API_URL}/products`, 'POST', product);
        reloadData();
    }, [apiRequest, reloadData]);

    const updateProduct = useCallback(async (product: Product, reason?: string) => {
        await apiRequest(`${API_URL}/products/${product.id}`, 'PUT', { ...product, reason });
        reloadData();
    }, [apiRequest, reloadData]);

    const deleteProduct = useCallback(async (id: string) => {
        await apiRequest(`${API_URL}/products/${id}`, 'DELETE');
        reloadData();
    }, [apiRequest, reloadData]);

    const findProductByBarcode = useCallback((barcode: string) => products.find(p => p.barcode === barcode), [products]);

    const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
        await apiRequest(`${API_URL}/clients`, 'POST', client);
        reloadData();
    }, [apiRequest, reloadData]);

    const updateClient = useCallback(async (client: Client) => {
        await apiRequest(`${API_URL}/clients/${client.id}`, 'PUT', client);
        reloadData();
    }, [apiRequest, reloadData]);
    
    const deleteClient = useCallback(async (id: string) => {
        await apiRequest(`${API_URL}/clients/${id}`, 'DELETE');
        reloadData();
    }, [apiRequest, reloadData]);

    const addSale = useCallback(async (sale: Omit<Sale, 'id' | 'date' | 'total' | 'paymentMethod' | 'status'>, paymentMethod: PaymentMethod) => {
        await apiRequest(`${API_URL}/sales`, 'POST', { ...sale, paymentMethod });
        reloadData();
    }, [apiRequest, reloadData]);

    const cancelSale = useCallback(async (saleId: string) => {
        await apiRequest(`${API_URL}/sales/${saleId}/cancel`, 'PATCH');
        reloadData();
    }, [apiRequest, reloadData]);

    const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
        const cat = await apiRequest<Category>(`${API_URL}/categories`, 'POST', category);
        reloadData();
        return cat;
    }, [apiRequest, reloadData]);

    const updateCategory = useCallback(async (category: Category) => {
        await apiRequest(`${API_URL}/categories/${category.id}`, 'PUT', category);
        reloadData();
    }, [apiRequest, reloadData]);

    const deleteCategory = useCallback(async (id: string) => {
        await apiRequest(`${API_URL}/categories/${id}`, 'DELETE');
        reloadData();
    }, [apiRequest, reloadData]);

    const addUser = useCallback(async (user: Omit<SystemUser, 'id' | 'createdAt'> & { password?: string }) => {
        await apiRequest(`${API_URL}/users`, 'POST', user);
        reloadData();
    }, [apiRequest, reloadData]);

    const updateUser = useCallback(async (user: SystemUser) => {
        await apiRequest(`${API_URL}/users/${user.id}`, 'PUT', user);
        reloadData();
    }, [apiRequest, reloadData]);

    const deleteUser = useCallback(async (id: string) => {
        await apiRequest(`${API_URL}/users/${id}`, 'DELETE');
        reloadData();
    }, [apiRequest, reloadData]);

    const dataValue = useMemo(() => ({
        products, clients, sales, categories, users, loading,
        addProduct, updateProduct, deleteProduct, findProductByBarcode,
        addClient, updateClient, deleteClient,
        addSale, cancelSale,
        addCategory, updateCategory, deleteCategory,
        addUser, updateUser, deleteUser,
        reloadData
    }), [products, clients, sales, categories, users, loading, addProduct, updateProduct, deleteProduct, findProductByBarcode, addClient, updateClient, deleteClient, addSale, cancelSale, addCategory, updateCategory, deleteCategory, addUser, updateUser, deleteUser, apiRequest, reloadData]);

    if (isAuthenticated && loading) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 dark:border-primary-400"></div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <DataContext.Provider value={dataValue}>
             <div className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen">
                {isAuthenticated ? (
                    <AdminPage />
                ) : showLogin ? (
                    <LoginPage onBack={() => setShowLogin(false)} />
                ) : (
                    <LandingPage onLoginClick={() => setShowLogin(true)} />
                )}
            </div>
        </DataContext.Provider>
    )
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || Theme.Light);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'es');
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [idToken, setIdToken] = useState<string | null>(() => localStorage.getItem('idToken'));
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (theme === Theme.Dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === Theme.Light ? Theme.Dark : Theme.Light));
  }, []);

  const login = useCallback((token: string, user: SystemUser) => {
     setIdToken(token);
     setCurrentUser(user);
     localStorage.setItem('idToken', token);
     localStorage.setItem('currentUser', JSON.stringify(user));
  }, []);

  const t = useCallback((key: keyof typeof translations.es) => {
    return translations[language][key] || key;
  }, [language]);
  
  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  const languageValue = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  
  const logout = useCallback(() => {
     setIdToken(null);
     setCurrentUser(null);
     localStorage.removeItem('idToken');
     localStorage.removeItem('currentUser');
  }, []);
  
  const authValue = useMemo(() => ({ 
      isAuthenticated: !!idToken,
      login,
      logout,
      currentUser,
      idToken
  }), [idToken, currentUser, login, logout]);

  if (authLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
              <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-slate-500 dark:border-slate-400"></div>
                  <p className="text-slate-500 dark:text-slate-400">{translations[language].initializing}</p>
              </div>
          </div>
      )
  }

  return (
    <ThemeContext.Provider value={themeValue}>
      <LanguageContext.Provider value={languageValue}>
        <AuthContext.Provider value={authValue}>
            <NotificationProvider>
            <AppContent />
            </NotificationProvider>
        </AuthContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
