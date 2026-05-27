
import React, { useState, useContext, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Products from '../components/Products';
import Clients from '../components/Clients';
import Sales from '../components/Sales';
import Categories from '../components/Categories';
import Users from '../components/Users';
import Settings from '../components/Settings';
import { ActivityLogs } from '../components/ActivityLogs';
import { Chatbot } from '../components/Chatbot';
import { AuthContext } from '../App';

type Page = 'dashboard' | 'sales' | 'products' | 'clients' | 'categories' | 'users' | 'settings' | 'activity_logs';

const AdminPage: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [productIdToEdit, setProductIdToEdit] = useState<string | null>(null);
  const [requestNewSale, setRequestNewSale] = useState(false);

  const role = currentUser?.role || 'salesperson';

  // Redirect to dashboard if trying to access restricted pages
  useEffect(() => {
    if (role === 'stock_clerk' && (currentPage === 'sales' || currentPage === 'clients' || currentPage === 'users')) {
        setCurrentPage('dashboard');
    }
    if (role === 'salesperson' && (currentPage === 'users' || currentPage === 'activity_logs')) {
        setCurrentPage('dashboard');
    }
  }, [role, currentPage]);

  const handleSetPage = (page: Page) => {
    setCurrentPage(page);
    // Close sidebar on navigation on mobile
    if (window.innerWidth < 768) { // Tailwind's `md` breakpoint
        setIsSidebarOpen(false);
    }
  }
  
  const handleEditProductRequest = (id: string) => {
    setProductIdToEdit(id);
    handleSetPage('products');
  };

  const handleNewSaleRequest = () => {
    setRequestNewSale(true);
    handleSetPage('sales');
  };

  const handleSearchResultSelect = (type: 'product' | 'client' | 'category', id: string) => {
      if (type === 'product') {
          handleEditProductRequest(id);
      } else if (type === 'client') {
          handleSetPage('clients');
      } else if (type === 'category') {
          handleSetPage('categories');
      }
  };


  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setActivePage={handleSetPage} onEditProduct={handleEditProductRequest} onNewSaleRequest={handleNewSaleRequest} />;
      case 'sales':
        return role !== 'stock_clerk' ? <Sales startNewSale={requestNewSale} onNewSaleHandled={() => setRequestNewSale(false)} /> : <Dashboard setActivePage={handleSetPage} onEditProduct={handleEditProductRequest} onNewSaleRequest={handleNewSaleRequest} />;
      case 'products':
        return <Products productIdToEdit={productIdToEdit} setProductIdToEdit={setProductIdToEdit} />;
      case 'clients':
        return role !== 'stock_clerk' ? <Clients /> : <Dashboard setActivePage={handleSetPage} onEditProduct={handleEditProductRequest} onNewSaleRequest={handleNewSaleRequest} />;
      case 'categories':
        return <Categories />;
      case 'users':
        return role === 'admin' ? <Users /> : <Dashboard setActivePage={handleSetPage} onEditProduct={handleEditProductRequest} onNewSaleRequest={handleNewSaleRequest} />;
      case 'activity_logs':
        return role === 'admin' ? <ActivityLogs /> : <Dashboard setActivePage={handleSetPage} onEditProduct={handleEditProductRequest} onNewSaleRequest={handleNewSaleRequest} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActivePage={handleSetPage} onEditProduct={handleEditProductRequest} onNewSaleRequest={handleNewSaleRequest}/>;
    }
  };

  return (
    <div className="flex h-[100dvh] relative overflow-hidden">
      <Sidebar 
        activePage={currentPage} 
        setActivePage={handleSetPage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} onSearchResultSelect={handleSearchResultSelect} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

export default AdminPage;
