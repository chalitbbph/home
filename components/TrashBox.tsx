
import React, { useMemo, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Job, SystemData, Box } from '../types';

interface TrashBoxItem {
  jobId: string;
  jobNumber: string;
  box: Box;
}

const TrashBox: React.FC = () => {
  const [data, setData] = useState<SystemData>(storageService.getData());
  const [searchQuery, setSearchQuery] = useState('');
  const [permDeleteConfirm, setPermDeleteConfirm] = useState<{jobId: string, boxId: string, boxNo: string} | null>(null);
  
  const refreshData = () => {
    setData(storageService.getData());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // ดึงกล่องทั้งหมดจากงานที่ถูกลบมาทำเป็น List เดียวกัน และกรองด้วย Search Query
  const filteredDeletedBoxItems = useMemo(() => {
    const items: TrashBoxItem[] = [];
    data.jobs.filter(j => j.status === 'deleted').forEach(job => {
      job.boxes.forEach(box => {
        const term = searchQuery.toLowerCase();
        const matches = 
          box.boxNumber.toLowerCase().includes(term) || 
          job.jobNumber.toLowerCase().includes(term) ||
          (box.boxSize && box.boxSize.toLowerCase().includes(term));

        if (matches) {
          items.push({
            jobId: job.id,
            jobNumber: job.jobNumber,
            box: box
          });
        }
      });
    });
    return items;
  }, [data.jobs, searchQuery]);

  const executePermanentDelete = () => {
    if (permDeleteConfirm) {
      storageService.permanentDeleteBox(permDeleteConfirm.jobId, permDeleteConfirm.boxId);
      setPermDeleteConfirm(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Permanent Delete Confirmation Modal */}
      {permDeleteConfirm && (
        <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-center border-4 border-red-500">
            <div className="text-6xl mb-6">🔥</div>
            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">ลบกล่องถาวร?</h3>
            <p className="text-slate-500 mb-8 font-bold text-sm">
              คุณกำลังจะลบกล่อง <span className="text-red-600 font-black">{permDeleteConfirm.boxNo}</span> ออกจากระบบ<br/>
              <span className="text-red-500 font-black uppercase underline decoration-2">ข้อมูลกล่องใบนี้จะหายไปตลอดกาล</span>
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setPermDeleteConfirm(null)}
                className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-3xl transition-all uppercase text-xs"
              >
                ยกเลิก
              </button>
              <button 
                onClick={executePermanentDelete}
                className="flex-1 py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-3xl shadow-2xl shadow-red-200 transition-all uppercase text-xs"
              >
                ลบกล่องทิ้งถาวร
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
            <span className="text-red-600">🗑️</span> รายการกล่องในถังขยะ
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest bg-red-50 w-fit px-3 py-1 rounded-full border border-red-100 text-red-600">
            ลบข้อมูลรายกล่อง (BOX LEVEL) ออกจากหน่วยความจำชั่วคราว
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาตามเบอร์กล่อง, รหัสงาน..."
            className="w-full md:w-80 pl-12 pr-4 py-3 border-2 border-slate-100 rounded-2xl bg-white shadow-sm focus:ring-4 focus:ring-red-50 focus:border-red-500 outline-none font-bold text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-4 top-3 text-slate-400 text-xl">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDeletedBoxItems.length === 0 ? (
          <div className="col-span-full py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
            <div className="text-6xl opacity-20 mb-4">✨</div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
              {searchQuery ? 'ไม่พบกล่องที่ตรงกับคำค้นหา' : 'ถังขยะว่างเปล่า ไม่มีกล่องที่ต้องจัดการ'}
            </p>
          </div>
        ) : (
          filteredDeletedBoxItems.map((item, idx) => (
            <div key={`${item.box.id}-${idx}`} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-lg group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
                  📦
                </div>
                <button 
                  onClick={() => setPermDeleteConfirm({jobId: item.jobId, boxId: item.box.id, boxNo: item.box.boxNumber})}
                  className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-90"
                >
                  <span className="text-sm font-black">ลบถาวร</span>
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-lg leading-tight uppercase truncate">{item.box.boxNumber}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">จาก: {item.jobNumber}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase">ไซส์: {item.box.boxSize || 'N/A'}</span>
                </div>
                <p className="text-xl font-black text-slate-900 pt-2 border-t border-slate-50 mt-2">
                  ฿{item.box.price.toLocaleString()}
                </p>
              </div>

              {/* Decorative background number */}
              <div className="absolute -bottom-4 -right-2 text-6xl font-black text-slate-50 pointer-events-none select-none">
                #{idx + 1}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrashBox;
