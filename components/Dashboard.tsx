
import React, { useContext, useMemo } from 'react';
import { DataContext, AuthContext, LanguageContext } from '../App';
import { ShoppingCartIcon, PackageIcon, UsersIcon, TriangleAlertIcon, TrophyIcon, CalendarCheckIcon, RefreshCwIcon } from './icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = "bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300" }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex items-center space-x-6">
        <div className={`p-4 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </div>
);

const QuickActionButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full text-center px-6 py-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-105"
    >
        {label}
    </button>
);


const Dashboard: React.FC<{ 
    setActivePage: (page: 'sales' | 'products') => void;
    onEditProduct: (productId: string) => void;
    onNewSaleRequest: () => void;
}> = ({ setActivePage, onEditProduct, onNewSaleRequest }) => {
  const { products, clients, sales, categories } = useContext(DataContext);
  const { currentUser } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const role = currentUser?.role || 'salesperson';
  
  // --- Admin Logic ---
  const adminStats = useMemo(() => {
      const totalRevenue = sales
        .filter(sale => sale.status === 'completed')
        .reduce((acc, sale) => acc + sale.total, 0);

      const today = new Date();
      const dailyRevenue = sales
        .filter(sale => {
            if (sale.status !== 'completed') return false;
            const saleDate = new Date(sale.date);
            return saleDate.getDate() === today.getDate() &&
                   saleDate.getMonth() === today.getMonth() &&
                   saleDate.getFullYear() === today.getFullYear();
        })
        .reduce((acc, sale) => acc + sale.total, 0);
    
      return { totalRevenue, dailyRevenue };
  }, [sales]);

  // --- Salesperson Logic ---
  const salespersonStats = useMemo(() => {
    if (role !== 'salesperson') return { total: 0, daily: 0 };
    
    const mySales = sales.filter(s => s.sellerId === currentUser?.id && s.status === 'completed');
    const total = mySales.reduce((acc, s) => acc + s.total, 0);
    
    const today = new Date();
    const daily = mySales
        .filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.getDate() === today.getDate() &&
                   saleDate.getMonth() === today.getMonth() &&
                   saleDate.getFullYear() === today.getFullYear();
        })
        .reduce((acc, s) => acc + s.total, 0);

    return { total, daily };
  }, [sales, currentUser, role]);

  // --- Stock Clerk Logic ---
  const stockClerkStats = useMemo(() => {
      if (role !== 'stock_clerk') return { totalActions: 0, dailyActions: 0 };
      
      let totalActions = 0;
      let dailyActions = 0;
      const today = new Date();

      products.forEach(p => {
          if (p.stockHistory) {
              p.stockHistory.forEach(entry => {
                  if (entry.userId === currentUser?.id) {
                      totalActions++;
                      const entryDate = new Date(entry.date);
                      if (entryDate.getDate() === today.getDate() &&
                          entryDate.getMonth() === today.getMonth() &&
                          entryDate.getFullYear() === today.getFullYear()) {
                          dailyActions++;
                      }
                  }
              });
          }
      });
      return { totalActions, dailyActions };
  }, [products, currentUser, role]);


  const lowStockProducts = products.filter(p => p.stock <= 10).sort((a,b) => a.stock - b.stock);

  const topSoldProducts = useMemo(() => {
    const productSales: { [key: string]: number } = {};
    sales
        .filter(sale => sale.status === 'completed')
        .forEach(sale => {
            (sale.items || []).forEach(item => {
                productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
            });
        });

    return Object.entries(productSales)
        .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
        .slice(0, 5)
        .map(([productId, quantity]) => {
            const product = products.find(p => p.id === productId);
            return {
                name: product?.name || 'Unknown Product',
                shortName: (product?.name || 'Unknown').length > 15 ? (product?.name || 'Unknown').substring(0, 15) + '...' : (product?.name || 'Unknown'),
                quantity,
            };
        });
  }, [sales, products]);

  // --- Analytics Data ---
  const salesTrends = useMemo(() => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
      }).reverse();

      return last7Days.map(dateStr => {
          const dailySales = sales.filter(s => s.status === 'completed' && s.date.startsWith(dateStr));
          const total = dailySales.reduce((acc, s) => acc + s.total, 0);
          
          let profit = 0;
          dailySales.forEach(sale => {
              (sale.items || []).forEach(item => {
                  const product = products.find(p => p.id === item.productId);
                  const cost = product?.costPrice || 0;
                  profit += (item.price - cost) * item.quantity;
              });
          });

          return {
              date: new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
              revenue: total,
              profit
          };
      });
  }, [sales, products]);

  const peakHours = useMemo(() => {
      const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0, total: 0 }));
      
      sales.filter(s => s.status === 'completed').forEach(sale => {
          const hour = new Date(sale.date).getHours();
          hours[hour].count += 1;
          hours[hour].total += sale.total;
      });

      return hours.filter(h => h.count > 0);
  }, [sales]);

  const categoryMargins = useMemo(() => {
      const categoryData: Record<string, { name: string, totalRevenue: number, totalCost: number }> = {};
      
      categories.forEach(c => {
          categoryData[c.id] = { name: c.name, totalRevenue: 0, totalCost: 0 };
      });

      sales.filter(s => s.status === 'completed').forEach(sale => {
          (sale.items || []).forEach(item => {
              const product = products.find(p => p.id === item.productId);
              if (product && product.categoryId && categoryData[product.categoryId]) {
                  const cost = product.costPrice || 0;
                  categoryData[product.categoryId].totalRevenue += item.price * item.quantity;
                  categoryData[product.categoryId].totalCost += cost * item.quantity;
              }
          });
      });

      return Object.values(categoryData)
          .map(c => {
              const profit = c.totalRevenue - c.totalCost;
              const margin = c.totalRevenue > 0 ? (profit / c.totalRevenue) * 100 : 0;
              return {
                  name: c.name,
                  margin: Number(margin.toFixed(2)),
                  revenue: c.totalRevenue
              };
          })
          .filter(c => c.revenue > 0)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5); // top 5 categories by revenue
  }, [sales, products, categories]);

  // --- Render for Stock Clerk ---
  if (role === 'stock_clerk') {
      return (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title={t('myActionsToday')} 
                    value={stockClerkStats.dailyActions} 
                    icon={<CalendarCheckIcon className="w-8 h-8"/>} 
                    color="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300"
                />
                <StatCard 
                    title={t('totalActions')} 
                    value={stockClerkStats.totalActions} 
                    icon={<RefreshCwIcon className="w-8 h-8"/>}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
                />
                <StatCard title={t('productsInStock')} value={products.length} icon={<PackageIcon className="w-8 h-8"/>} />
            </div>

             {/* Low Stock Alerts for Repositor is critical */}
            {lowStockProducts.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <TriangleAlertIcon className="w-7 h-7 text-amber-500" />
                        {t('lowStockAlerts')}
                    </h2>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-4 rounded-r-lg shadow-md">
                        <p className="font-bold mb-2">{t('lowStockMessage')}</p>
                        <ul className="list-disc list-inside space-y-1">
                            {lowStockProducts.slice(0, 10).map(p => (
                                <li key={p.id}>
                                    <button onClick={() => onEditProduct(p.id)} className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 rounded">
                                        <strong>{p.name}</strong> - Stock: {p.stock}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
             <div>
                <h2 className="text-2xl font-bold mb-4">{t('quickActions')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <QuickActionButton label={t('products')} onClick={() => setActivePage('products')} />
                </div>
            </div>
          </div>
      )
  }

  // --- Render for Salesperson ---
  if (role === 'salesperson') {
       return (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title={t('mySalesToday')} 
                    value={`$${salespersonStats.daily.toFixed(2)}`} 
                    icon={<CalendarCheckIcon className="w-8 h-8"/>}
                    color="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300" 
                />
                 <StatCard 
                    title={t('myTotalSales')} 
                    value={`$${salespersonStats.total.toFixed(2)}`} 
                    icon={<TrophyIcon className="w-8 h-8"/>} 
                    color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
                />
                <StatCard title={t('productsInStock')} value={products.length} icon={<PackageIcon className="w-8 h-8"/>} />
            </div>
             <div>
                <h2 className="text-2xl font-bold mb-4">{t('quickActions')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <QuickActionButton label={t('newSale')} onClick={onNewSaleRequest} />
                     <QuickActionButton label={t('productLookup')} onClick={() => setActivePage('products')} />
                </div>
            </div>
            
             {lowStockProducts.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t('inventoryAlerts')}</h3>
                    <p className="text-sm text-slate-500">{lowStockProducts.length} {t('inventoryAlertMessage')}</p>
                </div>
            )}
          </div>
       )
  }

  // --- Render for Admin (Default) ---
  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold">{t('dashboard')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title={t('totalRevenue')} value={`$${adminStats.totalRevenue.toFixed(2)}`} icon={<ShoppingCartIcon className="w-8 h-8"/>} />
            <StatCard title={t('todaysSales')} value={`$${adminStats.dailyRevenue.toFixed(2)}`} icon={<CalendarCheckIcon className="w-8 h-8"/>} />
            <StatCard title={t('productsInStock')} value={products.length} icon={<PackageIcon className="w-8 h-8"/>} />
            <StatCard title={t('registeredClients')} value={clients.length} icon={<UsersIcon className="w-8 h-8"/>} />
        </div>
        
        {lowStockProducts.length > 0 && (
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <TriangleAlertIcon className="w-7 h-7 text-amber-500" />
                    {t('lowStockAlerts')}
                </h2>
                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-4 rounded-r-lg shadow-md">
                    <p className="font-bold mb-2">{t('lowStockMessage')}</p>
                    <ul className="list-disc list-inside space-y-1">
                        {lowStockProducts.slice(0, 5).map(p => (
                            <li key={p.id}>
                                <button onClick={() => onEditProduct(p.id)} className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 rounded">
                                    <strong>{p.name}</strong> - Stock: {p.stock}
                                </button>
                            </li>
                        ))}
                    </ul>
                    {lowStockProducts.length > 5 && (
                        <button 
                            onClick={() => setActivePage('products')}
                            className="mt-4 px-4 py-2 bg-amber-500 text-white font-semibold rounded-md hover:bg-amber-600 transition-colors"
                        >
                            {t('viewAllLowStock')} ({lowStockProducts.length})
                        </button>
                    )}
                </div>
            </div>
        )}
        
        <div>
            <h2 className="text-2xl font-bold mb-4">{t('quickActions')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <QuickActionButton label={t('newSale')} onClick={onNewSaleRequest} />
                 <QuickActionButton label={t('addProduct')} onClick={() => setActivePage('products')} />
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">{t('recentSales')}</h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="responsive-table w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('date')}</th>
                                    <th scope="col" className="px-6 py-3">{t('clients')}</th>
                                    <th scope="col" className="px-6 py-3">{t('products')}</th>
                                    <th scope="col" className="px-6 py-3">{t('paymentMethod')}</th>
                                    <th scope="col" className="px-6 py-3">{t('total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.slice(0, 5).map(sale => (
                                    <tr key={sale.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                        <td className="px-6 py-4">{new Date(sale.date).toLocaleString()}</td>
                                        <td className="px-6 py-4">{sale.clientName || 'N/A'}</td>
                                        <td className="px-6 py-4">{sale.items?.length || 0}</td>
                                        <td className="px-6 py-4">{t(sale.paymentMethod.toLowerCase() as any)}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${sale.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {sales.length === 0 && (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">{t('noSalesData')}</div>
                        )}
                    </div>
                </div>
            </div>
            <div>
                 <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <TrophyIcon className="w-7 h-7 text-amber-500" />
                    {t('topSelling')}
                </h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 min-h-[300px] flex flex-col">
                     {topSoldProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={topSoldProducts}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ payload, percent }) => `${payload.shortName} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="quantity"
                                >
                                    {topSoldProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center flex-grow">
                             <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                                {t('noSalesData')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">{t('salesTrends')}</h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 min-h-[300px]">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${value}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                                itemStyle={{ color: '#38bdf8' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line type="monotone" dataKey="revenue" name={t('totalRevenue')} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="profit" name={t('profits')} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4">{t('peakHours')}</h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 min-h-[300px]">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={peakHours}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                            <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                                cursor={{ fill: '#334155', opacity: 0.2 }}
                            />
                            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name={t('salesCount')} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">{t('categoryMargins' as any) || 'Category Margins'}</h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 min-h-[400px] flex justify-center">
                    {categoryMargins.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryMargins}>
                                <PolarGrid stroke="#64748b" opacity={0.3} />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Radar
                                    name={t('profitMargin' as any) || 'Profit Margin (%)'}
                                    dataKey="margin"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.6}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                                    formatter={(value: number) => [`${value}%`, t('profitMargin' as any) || 'Profit Margin (%)']}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center flex-grow">
                             <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                                {t('noSalesData')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
