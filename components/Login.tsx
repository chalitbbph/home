
import React, { useState } from 'react';
import { User } from '../types';
import { AUTH_CONFIG } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === AUTH_CONFIG.admin.username && password === AUTH_CONFIG.admin.password) {
      onLogin({ username, role: 'admin' });
    } else if (username === AUTH_CONFIG.user.username && password === AUTH_CONFIG.user.password) {
      onLogin({ username, role: 'user' });
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📦</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">STORAGE HUB PRO</h1>
          <p className="text-slate-500 font-bold mt-2">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all font-bold"
              placeholder="Username"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all font-bold"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-95 text-lg"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-[10px] font-black text-center text-slate-300 uppercase tracking-[0.2em]">
          Storage Management System 2026
        </div>
      </div>
    </div>
  );
};

export default Login;
