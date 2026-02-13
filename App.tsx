
import React, { useState, useEffect, useCallback } from 'react';
import { User, SystemData } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import FindingView from './components/FindingView';
import OperationView from './components/OperationView';
import AdminDashboard from './components/AdminDashboard';
import TrashBox from './components/TrashBox';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('finding');
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await storageService.getData();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('session_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchData();
  }, [fetchData]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('session_user', JSON.stringify(userData));
    setActiveTab('finding');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('session_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-10">
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black uppercase tracking-widest animate-pulse">Connecting to Cloud...</h2>
        <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest">Supabase Storage Hub v1.0</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        role={user.role} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
        isSyncing={syncing}
      />
      
      <main className="flex-1 overflow-auto p-4 md:p-10 relative">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'finding' && data && (
            <FindingView data={data} onRefresh={fetchData} />
          )}
          {activeTab === 'operation' && data && (
            <OperationView data={data} onRefresh={fetchData} onNavigate={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'trash' && user.role === 'admin' && data && (
            <TrashBox data={data} onRefresh={fetchData} />
          )}
          {activeTab === 'admin' && user.role === 'admin' && data && (
            <AdminDashboard data={data} onRefresh={fetchData} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
