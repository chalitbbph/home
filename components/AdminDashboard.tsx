
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Job, Box, SystemData, Customer } from '../types';
import { ZONES, COLORS } from '../constants';

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<SystemData>(storageService.getData());
  const [view, setView] = useState<'overview' | 'create-job' | 'customers'>('overview');
  const [newJobBoxes, setNewJobBoxes] = useState<Box[]>([]);
  
  // State สำหรับป๊อปอัปยืนยันการลบ
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, no: string} | null>(null);

  const [custName, setCustName] = useState('');
  const [custContact, setCustContact] = useState('');

  const [jobName, setJobName] = useState('');
  const [productSize, setProductSize] = useState(''); 
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [zone, setZone] = useState('A');

  const refreshData = () => {
    const freshData = storageService.getData();
    setData({ ...freshData });
  };

  // กรองเฉพาะงานที่ยังไม่ถูกลบ
  const activeJobs = useMemo(() => data.jobs.filter(j => j.status !== 'deleted'), [data.jobs]);

  // คำนวณสรุปข้อมูลรายโซน
  const zoneSummaries = useMemo(() => {
    return ZONES.map(z => {
      const jobsInZone = activeJobs.filter(j => j.zone === z);
      const totalBoxes = jobsInZone.reduce((sum, job) => sum + job.boxes.length, 0);
      const totalValue = jobsInZone.reduce((sum, job) => 
        sum + job.boxes.reduce((bSum, box) => bSum + box.price, 0), 0
      );
      return {
        zone: z,
        jobCount: jobsInZone.length,
        boxCount: totalBoxes,
        value: totalValue
      };
    });
  }, [activeJobs]);

  const handleAddBox = () => {
    const newBox: Box = {
      id: Math.random().toString(36).substr(2, 9),
      boxNumber: `BX-${Math.floor(Math.random() * 9000) + 1000}`,
      color: COLORS[0],
      boxSize: '', 
      price: 0,
      contents: ''
    };
    setNewJobBoxes([...newJobBoxes, newBox]);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;
    const newCust: Customer = {
      id: 'CUST-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      name: custName,
      contact: custContact,
      createdAt: new Date().toISOString()
    };
    storageService.createCustomer(newCust);
    setCustName(''); setCustContact('');
    refreshData();
    alert(`✅ บันทึกข้อมูลลูกค้า "${newCust.name}" เรียบร้อย!`);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName || !selectedCustomerId || !productSize || newJobBoxes.length === 0) {
      alert("⚠️ กรุณากรอกรายละเอียดให้ครบ: ชื่อโครงการ, ไซส์สินค้า และเพิ่มกล่องอย่างน้อย 1 ใบ");
      return;
    }

    const newJob: Job = {
      id: Math.random().toString(36).substr(2, 9),
      jobNumber: `JOB-${Date.now().toString().slice(-6)}`,
      jobName,
      productSize, 
      customerId: selectedCustomerId,
      zone,
      status: 'stored',
      boxes: newJobBoxes,
      createdAt: new Date().toISOString()
    };

    storageService.createJob(newJob);
    alert(`📦 สร้างงาน ${newJob.jobNumber} สำเร็จ!`);
    
    setJobName(''); setProductSize(''); setSelectedCustomerId(''); setNewJobBoxes([]);
    refreshData();
    setView('overview');
  };

  const executeDelete = () => {
    if (deleteConfirm) {
      storageService.deleteJob(deleteConfirm.id);
      setDeleteConfirm(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">ยืนยันการลบงาน?</h3>
            <p className="text-slate-500 mb-8 font-bold text-sm">
              คุณต้องการลบงาน <span className="text-red-600 font-black">{deleteConfirm.no}</span> ใช่หรือไม่?<br/>
              รายการจะถูกย้ายไปที่หน้า <span className="text-slate-900 font-black">"ถังขยะระบบ"</span>
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-2xl transition-all uppercase text-xs"
              >
                ยกเลิก
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl shadow-red-200 transition-all uppercase text-xs"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">แผงควบคุมระบบ</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">จัดการคลังสินค้าและลูกค้าเชิงลึก</p>
        </div>
        <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner">
          <button onClick={() => setView('overview')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'overview' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600'}`}>ภาพรวมคลัง</button>
          <button onClick={() => setView('customers')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'customers' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600'}`}>ฐานข้อมูลลูกค้า</button>
          <button onClick={() => setView('create-job')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'create-job' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600'}`}>+ ลงงานใหม่</button>
        </div>
      </div>

      {view === 'overview' && (
        <>
          {/* Dashboard Summaries */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {zoneSummaries.map(summary => (
              <div key={summary.zone} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-1">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg mb-3 shadow-lg">
                  {summary.zone}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">จำนวนงาน</span>
                    <span className="text-xl font-black text-slate-900">{summary.jobCount}</span>
                  </div>
                  <div className="flex flex-col border-t border-slate-50 pt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">จำนวนกล่อง</span>
                    <span className="text-lg font-black text-blue-600">{summary.boxCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table View */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-700 uppercase text-xs tracking-widest">ตารางแสดงรายการงานที่ค้างในระบบ</h3>
              <span className="bg-white px-4 py-1.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">รวม {activeJobs.length} รายการ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-5">รายละเอียดงาน / ไซส์สินค้า</th>
                    <th className="px-6 py-5">เวลา (C=สร้าง / P=เบิก / R=คืน)</th>
                    <th className="px-6 py-5 text-center">โซน</th>
                    <th className="px-6 py-5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeJobs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-black uppercase text-xs">ไม่พบรายการงานที่กำลังดำเนินการ</td></tr>
                  ) : (
                    activeJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-black text-slate-900 text-lg leading-tight">{job.jobNumber}</div>
                          <div className="text-xs text-slate-500 font-bold">{job.jobName}</div>
                          <div className="mt-2 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 w-fit rounded">
                            ไซส์สินค้า: {job.productSize}
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-[9px] text-slate-400 space-y-1">
                          <div><span className="text-blue-500 font-black">C:</span> {new Date(job.createdAt).toLocaleString('th-TH')}</div>
                          {job.pulledAt && <div><span className="text-purple-500 font-black">P:</span> {new Date(job.pulledAt).toLocaleString('th-TH')}</div>}
                          {job.returnedAt && <div><span className="text-green-500 font-black">R:</span> {new Date(job.returnedAt).toLocaleString('th-TH')}</div>}
                        </td>
                        <td className="px-6 py-5">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black mx-auto shadow-lg">{job.zone}</div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => setDeleteConfirm({id: job.id, no: job.jobNumber})} 
                            className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-90 flex items-center justify-center ml-auto"
                            title="ลบงานนี้ไปที่ถังขยะ"
                          >
                            <span className="text-lg">🗑️</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'create-job' && (
        <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 bg-slate-900 text-white">
            <h2 className="text-2xl font-black tracking-tight uppercase">ลงทะเบียนงานใหม่</h2>
          </div>
          <form onSubmit={handleCreateJob} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">ชื่อโปรเจกต์ / รายละเอียดงาน</label>
                <input type="text" value={jobName} onChange={e => setJobName(e.target.value)} className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-black focus:border-blue-500 outline-none" placeholder="ระบุรายละเอียดงาน" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">ไซส์สินค้า (PRODUCT SIZE)</label>
                <input type="text" value={productSize} onChange={e => setProductSize(e.target.value)} className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-black focus:border-blue-500 outline-none" placeholder="เช่น XL, G-HK.0, หรือ 50ซม." required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">เลือกลูกค้า</label>
                <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-black bg-white focus:border-blue-500 outline-none" required>
                  <option value="">-- เลือกบริษัทลูกค้า --</option>
                  {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">โซนจัดเก็บเริ่มต้น</label>
                <select value={zone} onChange={e => setZone(e.target.value)} className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-black bg-white focus:border-blue-500 outline-none">
                  {ZONES.map(z => <option key={z} value={z}>ZONE {z}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">รายละเอียดกล่องสินค้า</h3>
                <button type="button" onClick={handleAddBox} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 shadow-lg">+ เพิ่มกล่อง</button>
              </div>
              <div className="space-y-4">
                {newJobBoxes.map((box, idx) => (
                  <div key={box.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-wrap gap-4 items-end relative transition-all hover:bg-white hover:shadow-md">
                    <button type="button" onClick={() => setNewJobBoxes(newJobBoxes.filter(b => b.id !== box.id))} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full text-lg font-black shadow-lg flex items-center justify-center">×</button>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">รหัสกล่อง</label>
                      <input type="text" value={box.boxNumber} onChange={e => {
                        const updated = [...newJobBoxes]; updated[idx].boxNumber = e.target.value; setNewJobBoxes(updated);
                      }} className="w-full px-4 py-2 text-xs font-black rounded-xl border border-slate-200" />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">ไซส์กล่อง (BOX SIZE)</label>
                      <input type="text" value={box.boxSize} onChange={e => {
                        const updated = [...newJobBoxes]; updated[idx].boxSize = e.target.value; setNewJobBoxes(updated);
                      }} className="w-full px-4 py-2 text-xs font-black rounded-xl border border-slate-200" placeholder="ระบุขนาดกล่อง" />
                    </div>
                    <div className="w-32">
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">มูลค่า (฿)</label>
                      <input type="number" value={box.price} onChange={e => {
                        const updated = [...newJobBoxes]; updated[idx].price = parseFloat(e.target.value) || 0; setNewJobBoxes(updated);
                      }} className="w-full px-4 py-2 text-xs font-black rounded-xl border border-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-3xl shadow-xl transition-all disabled:opacity-50 text-xl" disabled={newJobBoxes.length === 0}>
              ✅ ยืนยันการสร้างงาน
            </button>
          </form>
        </div>
      )}

      {view === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
            <h3 className="font-black text-slate-900 text-xl mb-4 tracking-tight">เพิ่มรายชื่อลูกค้า</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <input type="text" placeholder="ชื่อบริษัท / ชื่อลูกค้า" value={custName} onChange={e => setCustName(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-50 rounded-2xl font-bold focus:border-blue-500 outline-none" required />
              <input type="text" placeholder="ข้อมูลการติดต่อ" value={custContact} onChange={e => setCustContact(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-50 rounded-2xl font-bold focus:border-blue-500 outline-none" />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">บันทึกข้อมูลลูกค้า</button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
               <thead className="text-[10px] font-black text-slate-400 uppercase bg-slate-50/50">
                 <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">ชื่อลูกค้า</th><th className="px-6 py-4">การติดต่อ</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-50 text-sm">
                 {data.customers.map(c => (
                   <tr key={c.id}>
                     <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{c.id}</td>
                     <td className="px-6 py-4 font-black text-slate-800">{c.name}</td>
                     <td className="px-6 py-4 font-bold text-slate-500">{c.contact || '-'}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
