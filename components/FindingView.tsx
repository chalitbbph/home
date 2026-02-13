
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Job, SystemData } from '../types';
import { ZONES } from '../constants';

const FindingView: React.FC = () => {
  const [data, setData] = useState<SystemData>(storageService.getData());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [pullingJobId, setPullingJobId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const refreshData = () => {
    setData(storageService.getData());
  };

  const handlePullJob = (line: number) => {
    if (!pullingJobId) return;
    
    storageService.updateJob(pullingJobId, { 
      status: 'pulled', 
      pulledAt: new Date().toISOString(),
      lineProduction: line
    });
    
    refreshData();
    setSuccessMsg(`มอบหมายงานไปยังไลน์ ${line} และย้ายไปยังหน้าปฏิบัติงานแล้ว!`);
    setPullingJobId(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const storedJobs = data.jobs.filter(j => j.status === 'stored');
  
  const filteredJobs = storedJobs.filter(job => {
    const customer = data.customers.find(c => c.id === job.customerId);
    const searchTerm = searchQuery.toLowerCase();
    const matchesSearch = 
      job.jobNumber.toLowerCase().includes(searchTerm) || 
      job.jobName.toLowerCase().includes(searchTerm) ||
      job.productSize.toLowerCase().includes(searchTerm) ||
      (customer?.name.toLowerCase().includes(searchTerm));
    
    const matchesZone = selectedZone ? job.zone === selectedZone : true;
    return matchesSearch && matchesZone;
  });

  const zoneCounts = ZONES.reduce((acc, zone) => {
    acc[zone] = storedJobs.filter(j => j.zone === zone).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 relative">
      {successMsg && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-black">
          ✅ {successMsg}
        </div>
      )}

      {pullingJobId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">เลือกไลน์การผลิต</h3>
            <p className="text-slate-500 mb-6 font-bold text-sm">งานนี้จะถูกส่งไปยังไลน์การผลิตใด?</p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[1, 2, 3, 4, 5, 6].map(line => (
                <button key={line} onClick={() => handlePullJob(line)} className="py-4 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-2xl font-black text-xl transition-all active:scale-95">
                  {line}
                </button>
              ))}
            </div>
            <button onClick={() => setPullingJobId(null)} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">ศูนย์ค้นหาสินค้า</h1>
          <p className="text-sm text-slate-500 font-bold">ค้นหาจากรหัสงาน, ชื่อ, ไซส์ หรือชื่อลูกค้า</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาทุกอย่าง..."
            className="w-full md:w-96 pl-12 pr-4 py-3 border-2 border-slate-100 rounded-2xl bg-white shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-4 top-3.5 text-slate-400 text-xl">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {ZONES.map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedZone(selectedZone === zone ? null : zone)}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${
              selectedZone === zone 
                ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50 shadow-lg' 
                : 'border-white bg-white hover:border-slate-100 shadow-sm'
            }`}
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">โซน</span>
            <span className="text-3xl font-black text-slate-900 leading-none my-1">{zone}</span>
            <span className={`mt-1 px-3 py-1 rounded-full text-[10px] font-black ${
              zoneCounts[zone] > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {zoneCounts[zone]} รายการ
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
          <h2 className="font-black text-slate-700 uppercase text-xs tracking-widest">
            {selectedZone ? `คลังสินค้าในโซน ${selectedZone}` : 'รายการสินค้าทั้งหมดในคลัง'}
          </h2>
          <span className="text-xs bg-white border border-slate-100 px-4 py-1.5 rounded-full text-slate-500 font-black">
            พบ {filteredJobs.length} รายการ
          </span>
        </div>
        
        <div className="divide-y divide-slate-50">
          {filteredJobs.length === 0 ? (
            <div className="p-24 text-center">
              <div className="text-6xl mb-6 opacity-20 grayscale">📦</div>
              <p className="text-slate-400 font-black text-lg">ไม่พบข้อมูลที่ค้นหา</p>
            </div>
          ) : (
            filteredJobs.map(job => {
              const customer = data.customers.find(c => c.id === job.customerId);
              return (
                <div key={job.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="flex-1 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-xl">
                      <span className="text-[8px] uppercase font-bold opacity-40">โซน</span>
                      <span className="text-2xl font-black leading-none">{job.zone}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-slate-900 text-xl tracking-tight">{job.jobNumber}</span>
                        <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">ไซส์สินค้า: {job.productSize}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-500 truncate">{job.jobName}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-slate-400 mt-4 uppercase">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">👤 {customer?.name || 'Walk-in'}</span>
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">📦 {job.boxes.length} กล่อง</span>
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">💰 ฿{job.boxes.reduce((a, b) => a + b.price, 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => setPullingJobId(job.id)} className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 uppercase tracking-tight">
                    🚀 เบิกงาน (Start Operation)
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FindingView;
