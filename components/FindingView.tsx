
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Job, SystemData } from '../types';
import { ZONES } from '../constants';

interface Props {
  data: SystemData;
  onRefresh: () => void;
}

const FindingView: React.FC<Props> = ({ data, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [pullingJobId, setPullingJobId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePullJob = async (line: number) => {
    if (!pullingJobId) return;
    
    setIsProcessing(true);
    await storageService.updateJob(pullingJobId, { 
      status: 'pulled', 
      pulledAt: new Date().toISOString(),
      lineProduction: line
    });
    
    onRefresh();
    setSuccessMsg(`มอบหมายงานไปยังไลน์ ${line} และย้ายไปยังหน้าปฏิบัติงานแล้ว!`);
    setPullingJobId(null);
    setIsProcessing(false);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const storedJobs = useMemo(() => data.jobs.filter(j => j.status === 'stored'), [data.jobs]);
  const activeJobs = useMemo(() => data.jobs.filter(j => j.status === 'pulled'), [data.jobs]);
  
  const filteredJobs = useMemo(() => {
    return storedJobs.filter(job => {
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
  }, [storedJobs, searchQuery, selectedZone, data.customers]);

  const zoneCounts = ZONES.reduce((acc, zone) => {
    acc[zone] = storedJobs.filter(j => j.zone === zone).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl font-black border-2 border-green-500 flex items-center gap-4 animate-in slide-in-from-top-10">
          <span className="text-2xl">✅</span> {successMsg}
        </div>
      )}

      {pullingJobId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 border-4 border-blue-600">
            <div className="text-center mb-8">
              <span className="text-5xl">🏭</span>
              <h3 className="text-3xl font-black text-slate-900 mt-4 uppercase tracking-tighter">เลือกไลน์การผลิต</h3>
              <p className="text-slate-500 font-bold mt-2 text-sm">งานนี้จะถูกส่งไปที่หน่วยงานใด?</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6].map(line => (
                <button 
                  key={line} 
                  disabled={isProcessing}
                  onClick={() => handlePullJob(line)} 
                  className="h-20 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-2xl font-black text-3xl transition-all active:scale-90 shadow-sm disabled:opacity-50"
                >
                  {line}
                </button>
              ))}
            </div>
            <button onClick={() => setPullingJobId(null)} className="w-full py-4 text-slate-400 font-black hover:text-slate-600 uppercase text-xs tracking-widest">ยกเลิกการเบิก</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">ศูนย์ค้นหาสินค้า</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 bg-blue-50 text-blue-600 w-fit px-3 py-1 rounded-full border border-blue-100">Warehouse Navigation & Tracking</p>
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="ค้นหา (รหัสงาน, ชื่อ, ไซส์, ลูกค้า)..."
            className="w-full md:w-[450px] pl-14 pr-6 py-5 border-2 border-slate-100 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 focus:ring-8 focus:ring-blue-50 focus:border-blue-500 outline-none font-black text-lg transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-6 top-5 text-slate-300 text-2xl group-focus-within:text-blue-500 transition-colors">🔍</span>
        </div>
      </div>

      {activeJobs.length > 0 && (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 text-9xl font-black text-white/5 pointer-events-none uppercase">Active</div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <span className="flex h-3 w-3 rounded-full bg-green-500 animate-ping"></span>
            <h2 className="font-black uppercase tracking-widest text-xs">งานที่กำลังดำเนินการอยู่ตอนนี้ ({activeJobs.length})</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide relative z-10">
            {activeJobs.map(job => (
              <div key={job.id} className="min-w-[280px] bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-all cursor-default group">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-black text-lg tracking-tighter">{job.jobNumber}</span>
                  <span className="bg-blue-600 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">LINE {job.lineProduction}</span>
                </div>
                <p className="text-[10px] font-bold text-white/60 uppercase truncate mb-3">{job.jobName}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs">
                    {job.zone}
                  </div>
                  <span className="text-[9px] font-black text-white/40 uppercase">ย้ายมาจากโซนจัดเก็บ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <button
          onClick={() => setSelectedZone(null)}
          className={`flex-shrink-0 px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all flex flex-col items-center justify-center min-w-[120px] ${
            selectedZone === null 
              ? 'bg-slate-900 text-white shadow-xl' 
              : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
          }`}
        >
          <span className="text-xl mb-1">🌎</span>
          ทั้งหมด
        </button>
        {ZONES.map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedZone(selectedZone === zone ? null : zone)}
            className={`flex-shrink-0 px-8 py-4 rounded-2xl border-2 transition-all flex flex-col items-center min-w-[120px] ${
              selectedZone === zone 
                ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50 shadow-lg scale-105' 
                : 'border-white bg-white hover:border-slate-100 shadow-sm'
            }`}
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">โซน</span>
            <span className="text-3xl font-black text-slate-900 leading-none my-1">{zone}</span>
            <span className={`mt-1 px-3 py-1 rounded-full text-[10px] font-black ${
              zoneCounts[zone] > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 opacity-50'
            }`}>
              {zoneCounts[zone]}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
          <div>
            <h2 className="font-black text-slate-900 uppercase text-sm tracking-widest">
              {selectedZone ? `คลังสินค้า: โซน ${selectedZone}` : 'คลังสินค้าทั้งหมด'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Ready to pull for operation</p>
          </div>
          <span className="text-[11px] bg-slate-900 text-white px-5 py-2 rounded-full font-black uppercase tracking-widest">
            {filteredJobs.length} รายการที่พบ
          </span>
        </div>
        
        <div className="divide-y divide-slate-50">
          {filteredJobs.length === 0 ? (
            <div className="p-32 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mb-6 grayscale opacity-20">📦</div>
              <p className="text-slate-300 font-black text-xl uppercase tracking-widest">ไม่พบข้อมูลในขณะนี้</p>
              <button onClick={() => {setSelectedZone(null); setSearchQuery('');}} className="mt-4 text-blue-600 font-black text-xs uppercase underline">ล้างการค้นหา</button>
            </div>
          ) : (
            filteredJobs.map(job => {
              const customer = data.customers.find(c => c.id === job.customerId);
              return (
                <div key={job.id} className="p-8 hover:bg-slate-50/80 transition-all flex flex-col lg:flex-row items-start lg:items-center gap-8 group">
                  <div className="flex-1 flex items-center gap-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-900 text-white flex flex-col items-center justify-center shadow-2xl transition-transform group-hover:scale-110 group-hover:-rotate-3">
                      <span className="text-[10px] uppercase font-black opacity-40 mb-1 tracking-widest">LOCATION</span>
                      <span className="text-4xl font-black leading-none">{job.zone}</span>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-black text-slate-900 text-2xl tracking-tighter uppercase">{job.jobNumber}</span>
                        <div className="h-5 w-[2px] bg-slate-200"></div>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-blue-200">ไซส์สินค้า: {job.productSize}</span>
                      </div>
                      <p className="text-lg font-bold text-slate-400 leading-snug group-hover:text-slate-600 transition-colors">{job.jobName}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-500 mt-5 uppercase tracking-wider">
                        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                          <span className="text-sm">👤</span>
                          {customer?.name || 'Walk-in Customer'}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                          <span className="text-sm">📦</span>
                          {job.boxes.length} กล่อง
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100">
                          <span className="text-sm">💰</span>
                          ฿{job.boxes.reduce((a, b) => a + b.price, 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setPullingJobId(job.id)} 
                    className="w-full lg:w-auto px-10 py-5 bg-blue-600 hover:bg-slate-900 text-white rounded-3xl font-black text-sm transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest group/btn"
                  >
                    🚀 เริ่มปฏิบัติงาน
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[8px] group-hover/btn:bg-blue-500">START</span>
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
