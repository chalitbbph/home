
import React from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onTabChange, onLogout }) => {
  // เมนูพื้นฐานสำหรับทุกคน
  const tabs = [
    { id: 'finding', label: 'ศูนย์ค้นหา', icon: '🔍' },
    { id: 'operation', label: 'หน้าปฏิบัติงาน', icon: '⚡' },
  ];

  // เมนูเพิ่มเติมสำหรับผู้ดูแลเท่านั้น
  if (role === 'admin') {
    tabs.push(
      { id: 'trash', label: 'ถังขยะระบบ', icon: '🗑️' },
      { id: 'admin', label: 'จัดการระบบ', icon: '⚙️' }
    );
  }

  return (
    <aside className="w-20 md:w-64 bg-slate-900 flex flex-col transition-all border-r border-slate-800 shadow-2xl">
      <div className="p-8 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">📦</div>
        <div className="font-black text-xl tracking-tighter hidden md:block uppercase">HUB<span className="text-blue-500">PRO</span></div>
      </div>

      <nav className="flex-1 mt-4 px-3 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center p-4 rounded-2xl transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-1'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="ml-4 font-black text-xs uppercase tracking-widest hidden md:block">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-6 px-4 hidden md:block">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">สิทธิ์การใช้งาน</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${role === 'admin' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
            <p className="text-sm text-slate-200 font-black uppercase tracking-tight">
              {role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
          <span className="ml-4 font-black text-xs uppercase tracking-widest hidden md:block">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
