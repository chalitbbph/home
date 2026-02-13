
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import FindingView from './components/FindingView';
import OperationView from './components/OperationView';
import AdminDashboard from './components/AdminDashboard';
import TrashBox from './components/TrashBox';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('finding');

  useEffect(() => {
    const savedUser = localStorage.getItem('session_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

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

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        role={user.role} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 overflow-auto p-4 md:p-10">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'finding' && <FindingView />}
          {activeTab === 'operation' && (
            <OperationView onNavigate={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'trash' && user.role === 'admin' && <TrashBox />}
          {activeTab === 'admin' && user.role === 'admin' && <AdminDashboard />}
        </div>
      </main>
    </div>
  );
};

export default App;
