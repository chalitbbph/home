
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { Job, SystemData, Box } from '../types';
import { ZONES } from '../constants';

interface OperationViewProps {
  onNavigate?: (tab: string) => void;
}

const OperationView: React.FC<OperationViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<SystemData>(storageService.getData());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [opSuccess, setOpSuccess] = useState<string | null>(null);

  const refreshData = () => {
    const newData = storageService.getData();
    setData({ ...newData });
    if (selectedJobId && !newData.jobs.some(j => j.id === selectedJobId && j.status === 'pulled')) {
      setSelectedJobId(null);
    }
  };

  const activeJobs = data.jobs.filter(j => j.status === 'pulled');
  const selectedJob = activeJobs.find(j => j.id === selectedJobId);

  const handleReturnToZone = (zone: string) => {
    if (!selectedJob) return;

    storageService.updateJob(selectedJob.id, { 
      status: 'stored', 
      zone: zone,
      returnedAt: new Date().toISOString() 
    });
    
    refreshData();
    setShowZonePicker(false);
    setSelectedJobId(null);
    setOpSuccess(`✅ คืนงาน ${selectedJob.jobNumber} ไปที่โซน ${zone} เรียบร้อย!`);
    
    setTimeout(() => {
      setOpSuccess(null);
      if (onNavigate) onNavigate('finding');
    }, 1200);
  };

  const toggleBoxIssue = (boxId: string) => {
    if (!selectedJob) return;
    const box = selectedJob.boxes.find(b => b.id === boxId);
    if (box?.hasIssue) {
      if (confirm("ล้างสถานะแจ้งปัญหา?")) {
        const updated = selectedJob.boxes.map(b => b.id === boxId ? { ...b, hasIssue: false, issueNote: undefined } : b);
        storageService.updateJob(selectedJob.id, { boxes: updated });
        refreshData();
      }
      return;
    }
    const note = prompt("ระบุปัญหาที่พบ:");
    if (!note) return;
    const updated = selectedJob.boxes.map(b => b.id === boxId ? { ...b, hasIssue: true, issueNote: note } : b);
    storageService.updateJob(selectedJob.id, { boxes: updated });
    refreshData();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-10rem)] relative">
      {opSuccess && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-10 py-5 rounded-3xl shadow-2xl border-2 border-green-500">
          <span className="font-black text-lg">{opSuccess}</span>
        </div>
      )}

      {showZonePicker && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-8">
              <span className="text-5xl">📍</span>
              <h3 className="text-3xl font-black text-slate-900 mt-4 tracking-tighter uppercase">เลือกโซนที่ต้องการจัดเก็บ</h3>
              <p className="text-slate-500 font-bold mt-2 text-sm uppercase">ระบุโซนปลายทางที่จะนำงานกลับไปวาง</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {ZONES.map(zone => (
                <button key={zone} onClick={() => handleReturnToZone(zone)} className="h-24 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-3xl font-black text-2xl transition-all shadow-sm flex items-center justify-center active:scale-90">
                  {zone}
                </button>
              ))}
            </div>
            <button onClick={() => setShowZonePicker(false)} className="w-full text-slate-400 font-black hover:text-red-500 uppercase text-xs tracking-widest">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <h2 className="font-black text-xs uppercase tracking-widest">รายการที่กำลังปฏิบัติงาน</h2>
          <span className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black">{activeJobs.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {activeJobs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-bold text-sm">ไม่มีงานที่กำลังปฏิบัติงาน</div>
          ) : (
            activeJobs.map(job => (
              <button
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={`w-full p-5 text-left transition-all flex items-center gap-4 ${
                  selectedJobId === job.id ? 'bg-blue-50 border-l-8 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${selectedJobId === job.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {job.zone}
                </div>
                <div className="flex-1">
                  <div className="font-black text-slate-900 truncate tracking-tight">{job.jobNumber}</div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase">Line {job.lineProduction || 'N/A'}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-8 h-full">
        {selectedJob ? (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 h-full flex flex-col overflow-hidden">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedJob.jobNumber}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500 text-xs font-black uppercase tracking-widest">{selectedJob.jobName}</span>
                  <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">ไซส์สินค้า: {selectedJob.productSize}</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg">
                {selectedJob.zone}
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">การตรวจสอบกล่อง</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedJob.boxes.map(box => (
                  <div key={box.id} className={`p-5 rounded-3xl border-2 bg-slate-50 ${box.hasIssue ? 'border-red-200 shadow-inner' : 'border-slate-50 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-3">
                       <span className="font-black text-slate-900">{box.boxNumber}</span>
                       <button onClick={() => toggleBoxIssue(box.id)} className={`text-lg transition-opacity ${box.hasIssue ? 'opacity-100' : 'opacity-30'}`}>🚩</button>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1">
                      <span>ไซส์กล่อง:</span>
                      <span className="text-slate-900">{box.boxSize || 'ไม่ระบุ'}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                      <span>มูลค่า:</span>
                      <span className="text-slate-900">฿{box.price.toLocaleString()}</span>
                    </div>
                    {box.hasIssue && (
                      <div className="mt-2 p-2 bg-red-100 rounded-lg text-[10px] text-red-700 font-bold">
                        ⚠️ ปัญหา: {box.issueNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 border-t bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="text-center md:text-left">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เวลาที่เบิกออก</p>
                 <p className="text-sm font-black text-slate-900">{selectedJob.pulledAt ? new Date(selectedJob.pulledAt).toLocaleTimeString() : '-'}</p>
               </div>
               <button onClick={() => setShowZonePicker(true)} className="w-full md:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl shadow-xl transition-all active:scale-95 text-lg uppercase tracking-tight">
                 ✅ ยืนยันคืนเข้าโซน
               </button>
            </div>
          </div>
        ) : (
          <div className="h-full bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex items-center justify-center text-center p-12">
            <div>
              <div className="text-6xl mb-6 opacity-20">⚡</div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">เลือกรายการจากด้านซ้ายเพื่อเริ่มงาน</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationView;
