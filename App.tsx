
import React, { useState, useEffect, useCallback } from 'react';
import { User, SystemData } from './types.ts';
import Login from './components/Login.tsx';
import Sidebar from './components/Sidebar.tsx';
import FindingView from './components/FindingView.tsx';
import OperationView from './components/OperationView.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import TrashBox from './components/TrashBox.tsx';
import { storageService } from './services/storageService.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('finding');
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await storageService.getData();
      setData(result);
      setError(null);
    } catch (e) {
      console.error('Fetch error:', e);
      setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า Supabase');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('session_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('session_user');
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-10">
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black uppercase tracking-widest animate-pulse">Connecting to Cloud...</h2>
        <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest">Supabase Storage Hub v1.0</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900 p-10 text-center">
        <div className="text-6xl mb-6">❌</div>
        <h2 className="text-2xl font-black uppercase mb-4 text-red-600">{error}</h2>
        <p className="max-w-md text-slate-500 font-bold mb-8">
          เกิดข้อผิดพลาดในการโหลดข้อมูล อาจเป็นเพราะยังไม่ได้สร้าง Table ใน Supabase หรือ API Key ไม่ถูกต้อง
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all"
        >
          RETRY CONNECTION
        </button>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
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
