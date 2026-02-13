import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Job, Box, SystemData } from '../types';
import { ZONES, COLORS } from '../constants';

interface Props {
  data: SystemData;
  onRefresh: () => void;
}

const JobEditView: React.FC<Props> = ({ data, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeJobs = useMemo(() => 
    data.jobs.filter(j => j.status !== 'deleted'), 
    [data.jobs]
  );

  const filteredJobs = useMemo(() => {
    return activeJobs.filter(job => {
      const customer = data.customers.find(c => c.id === job.customerId);
      const searchTerm = searchQuery.toLowerCase();
      return (
        job.jobNumber.toLowerCase().includes(searchTerm) || 
        job.jobName.toLowerCase().includes(searchTerm) ||
        job.productSize.toLowerCase().includes(searchTerm) ||
        customer?.name.toLowerCase().includes(searchTerm)
      );
    });
  }, [activeJobs, searchQuery, data.customers]);

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setEditingJob(JSON.parse(JSON.stringify(job))); // Deep copy
    setErrorMsg(null);
  };

  const handleUpdateJobField = (field: keyof Job, value: any) => {
    if (!editingJob) return;
    setEditingJob({ ...editingJob, [field]: value });
  };

  const handleUpdateBox = (boxId: string, field: keyof Box, value: any) => {
    if (!editingJob) return;
    setEditingJob({
      ...editingJob,
      boxes: editingJob.boxes.map(box => 
        box.id === boxId ? { ...box, [field]: value } : box
      )
    });
  };

  const handleAddBox = () => {
    if (!editingJob) return;
    const newBox: Box = {
      id: Math.random().toString(36).substr(2, 9),
      boxNumber: `BX-${Math.floor(Math.random() * 9000) + 1000}`,
      color: COLORS[0],
      boxSize: '',
      price: 0,
      contents: ''
    };
    setEditingJob({
      ...editingJob,
      boxes: [...editingJob.boxes, newBox]
    });
  };

  const handleRemoveBox = (boxId: string) => {
    if (!editingJob) return;
    if (editingJob.boxes.length <= 1) {
      setErrorMsg('⚠️ ต้องมีอย่างน้อย 1 กล่องในงาน');
      return;
    }
    if (confirm('ต้องการลบกล่องนี้ออกจากงานหรือไม่?')) {
      setEditingJob({
        ...editingJob,
        boxes: editingJob.boxes.filter(box => box.id !== boxId)
      });
    }
  };

  const handleSave = async () => {
    if (!editingJob) return;

    if (!editingJob.jobName || !editingJob.productSize || editingJob.boxes.length === 0) {
      setErrorMsg('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      await storageService.updateJob(editingJob.id, {
        jobName: editingJob.jobName,
        productSize: editingJob.productSize,
        customerId: editingJob.customerId,
        zone: editingJob.zone,
        boxes: editingJob.boxes
      });

      onRefresh();
      setSuccessMsg(`✅ บันทึกการแก้ไขงาน ${editingJob.jobNumber} สำเร็จ!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setSelectedJob(null);
        setEditingJob(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving job:', error);
      setErrorMsg('❌ เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (editingJob && selectedJob && JSON.stringify(editingJob) !== JSON.stringify(selectedJob)) {
      if (confirm('มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการยกเลิกหรือไม่?')) {
        setSelectedJob(null);
        setEditingJob(null);
        setErrorMsg(null);
      }
    } else {
      setSelectedJob(null);
      setEditingJob(null);
      setErrorMsg(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl font-black border-2 border-green-400 flex items-center gap-4 animate-in slide-in-from-top-10">
          <span className="text-2xl">✅</span> {successMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">แก้ไขข้อมูลงาน</h1>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mt-1 bg-slate-100 w-fit px-3 py-1 rounded-full">Job & Box Editor</p>
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="ค้นหางาน..."
            className="w-full md:w-[400px] pl-14 pr-6 py-5 border-2 border-slate-100 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 focus:ring-8 focus:ring-blue-50 focus:border-blue-500 outline-none font-black text-lg transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-6 top-5 text-slate-300 text-2xl group-focus-within:text-blue-500 transition-colors">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Job List */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden sticky top-4">
            <div className="p-6 bg-slate-900 text-white">
              <h2 className="font-black text-xs uppercase tracking-widest">รายการงานทั้งหมด</h2>
              <p className="text-white/40 text-[9px] mt-1 uppercase">เลือกงานเพื่อแก้ไข</p>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto divide-y divide-slate-50">
              {filteredJobs.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold text-sm">
                  ไม่พบงานที่ตรงกับการค้นหา
                </div>
              ) : (
                filteredJobs.map(job => {
                  const customer = data.customers.find(c => c.id === job.customerId);
                  const isSelected = selectedJob?.id === job.id;
                  
                  return (
                    <button
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      className={`w-full p-6 text-left transition-all hover:bg-slate-50 ${
                        isSelected ? 'bg-blue-50 border-l-8 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'
                        }`}>
                          {job.zone}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-slate-900 text-lg truncate">{job.jobNumber}</div>
                          <div className="text-sm text-slate-500 font-bold truncate">{job.jobName}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-black uppercase">
                              {customer?.name || 'N/A'}
                            </span>
                            <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-1 rounded font-black">
                              {job.boxes.length} กล่อง
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-8">
          {editingJob ? (
            <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-10 bg-slate-900 text-white">
                <h2 className="text-3xl font-black tracking-tighter uppercase">แก้ไข: {editingJob.jobNumber}</h2>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                  {editingJob.status === 'stored' ? '📦 อยู่ในคลัง' : '⚡ กำลังดำเนินการ'}
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-10 space-y-10">
                {errorMsg && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 font-bold text-sm animate-pulse">
                    {errorMsg}
                  </div>
                )}

                {/* Job Details */}
                <div className="space-y-6">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">ข้อมูลงาน</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                        ชื่องาน
                      </label>
                      <input
                        type="text"
                        value={editingJob.jobName}
                        onChange={(e) => handleUpdateJobField('jobName', e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                        ไซส์สินค้า
                      </label>
                      <input
                        type="text"
                        value={editingJob.productSize}
                        onChange={(e) => handleUpdateJobField('productSize', e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                        ลูกค้า
                      </label>
                      <select
                        value={editingJob.customerId}
                        onChange={(e) => handleUpdateJobField('customerId', e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all appearance-none"
                        required
                      >
                        {data.customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                        โซน
                      </label>
                      <select
                        value={editingJob.zone}
                        onChange={(e) => handleUpdateJobField('zone', e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all appearance-none"
                      >
                        {ZONES.map(z => (
                          <option key={z} value={z}>ZONE {z}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Boxes */}
                <div className="pt-10 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">
                      รายการกล่อง ({editingJob.boxes.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddBox}
                      className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black hover:bg-slate-800 shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                    >
                      + เพิ่มกล่อง
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {editingJob.boxes.map((box, idx) => (
                      <div
                        key={box.id}
                        className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-xl transition-all group relative"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveBox(box.id)}
                          className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-full text-xl font-black shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        >
                          ×
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">
                              หมายเลขกล่อง
                            </label>
                            <input
                              type="text"
                              value={box.boxNumber}
                              onChange={(e) => handleUpdateBox(box.id, 'boxNumber', e.target.value)}
                              className="w-full px-5 py-3 text-sm font-black rounded-xl border-2 border-white bg-white group-hover:bg-slate-50 transition-all focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">
                              ขนาดกล่อง
                            </label>
                            <input
                              type="text"
                              value={box.boxSize}
                              onChange={(e) => handleUpdateBox(box.id, 'boxSize', e.target.value)}
                              className="w-full px-5 py-3 text-sm font-black rounded-xl border-2 border-white bg-white group-hover:bg-slate-50 transition-all focus:border-blue-500 outline-none"
                              placeholder="ขนาด"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">
                              สีกล่อง
                            </label>
                            <select
                              value={box.color}
                              onChange={(e) => handleUpdateBox(box.id, 'color', e.target.value)}
                              className="w-full px-5 py-3 text-sm font-black rounded-xl border-2 border-white bg-white group-hover:bg-slate-50 transition-all focus:border-blue-500 outline-none appearance-none"
                            >
                              {COLORS.map(color => (
                                <option key={color} value={color}>{color}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">
                              มูลค่า (฿)
                            </label>
                            <input
                              type="number"
                              value={box.price}
                              onChange={(e) => handleUpdateBox(box.id, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-5 py-3 text-sm font-black rounded-xl border-2 border-white bg-white group-hover:bg-slate-50 transition-all focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-[2rem] transition-all text-lg uppercase tracking-tight"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-6 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg uppercase tracking-tight active:scale-[0.98]"
                  >
                    {isSaving ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-[600px] bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex items-center justify-center text-center p-12">
              <div>
                <div className="text-6xl mb-6 opacity-20">✏️</div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  เลือกงานจากรายการด้านซ้าย
                </h3>
                <p className="text-slate-400 font-bold mt-2 text-sm">
                  คลิกที่งานที่ต้องการแก้ไขเพื่อเริ่มต้น
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobEditView;
