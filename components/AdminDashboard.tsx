import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Job, Box, SystemData, Customer } from '../types';
import { ZONES, COLORS } from '../constants';

interface Props {
  data: SystemData;
  onRefresh: () => void;
}

const AdminDashboard: React.FC<Props> = ({ data, onRefresh }) => {
  const [view, setView] = useState<'overview' | 'create-job' | 'customers'>('overview');
  const [newJobBoxes, setNewJobBoxes] = useState<Box[]>([]);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, no: string} | null>(null);

  const [custName, setCustName] = useState('');
  const [custContact, setCustContact] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerSuccess, setCustomerSuccess] = useState<string | null>(null);

  const [jobName, setJobName] = useState('');
  const [productSize, setProductSize] = useState(''); 
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [zone, setZone] = useState('A');
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

  const activeJobs = useMemo(() => data.jobs.filter(j => j.status !== 'deleted'), [data.jobs]);

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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;
    
    setIsCreatingCustomer(true);
    setCustomerError(null);
    setCustomerSuccess(null);
    
    try {
      console.log('🔵 Starting customer creation...');
      
      const newCust: Customer = {
        id: 'CUST-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        name: custName,
        contact: custContact,
        createdAt: new Date().toISOString()
      };
      
      console.log('🔵 New customer object:', newCust);
      
      await storageService.createCustomer(newCust);
      
      console.log('✅ Customer created successfully');
      
      setCustName(''); 
      setCustContact('');
      setCustomerSuccess('✅ เพิ่มลูกค้าสำเร็จ!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setCustomerSuccess(null), 3000);
      
      onRefresh();
    } catch (error) {
      console.error('❌ Error creating customer:', error);
      setCustomerError(
        error instanceof Error 
          ? `เกิดข้อผิดพลาด: ${error.message}` 
          : 'ไม่สามารถเพิ่มลูกค้าได้ กรุณาลองใหม่'
      );
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setJobError(null);
    
    if (!jobName || !selectedCustomerId || !productSize || newJobBoxes.length === 0) {
      setJobError("⚠️ กรุณากรอกรายละเอียดให้ครบ");
      return;
    }

    setIsCreatingJob(true);

    try {
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

      await storageService.createJob(newJob);
      
      setJobName(''); 
      setProductSize(''); 
      setSelectedCustomerId(''); 
      setNewJobBoxes([]);
      
      onRefresh();
      setView('overview');
    } catch (error) {
      console.error('❌ Error creating job:', error);
      setJobError(
        error instanceof Error 
          ? `เกิดข้อผิดพลาด: ${error.message}` 
          : 'ไม่สามารถสร้างงานได้ กรุณาลองใหม่'
      );
    } finally {
      setIsCreatingJob(false);
    }
  };

  const executeDelete = async () => {
    if (deleteConfirm) {
      try {
        await storageService.deleteJob(deleteConfirm.id);
        setDeleteConfirm(null);
        onRefresh();
      } catch (error) {
        console.error('❌ Error deleting job:', error);
        alert('ไม่สามารถลบงานได้ กรุณาลองใหม่');
      }
    }
  };

  return (
    <div className="space-y-8 relative pb-20 animate-in fade-in duration-500">
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase">ย้ายงานไปถังขยะ?</h3>
            <p className="text-slate-500 mb-8 font-bold text-sm">
              คุณต้องการย้ายงาน <span className="text-red-600 font-black">{deleteConfirm.no}</span><br/>
              ไปที่หน้า "ถังขยะระบบ" หรือไม่?
            </p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs">ยกเลิก</button>
              <button onClick={executeDelete} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-200 uppercase text-xs">ยืนยันการย้าย</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h1>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mt-1 bg-slate-100 w-fit px-3 py-1 rounded-full">System Administration & Statistics</p>
        </div>
        <div className="flex bg-slate-200/50 p-2 rounded-[2rem] shadow-inner backdrop-blur-sm border border-slate-200">
          <button onClick={() => setView('overview')} className={`px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all ${view === 'overview' ? 'bg-white shadow-xl text-blue-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}>OVERVIEW</button>
          <button onClick={() => setView('customers')} className={`px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all ${view === 'customers' ? 'bg-white shadow-xl text-blue-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}>CUSTOMERS</button>
          <button onClick={() => setView('create-job')} className={`px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all ${view === 'create-job' ? 'bg-white shadow-xl text-blue-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}>NEW JOB</button>
        </div>
      </div>

      {view === 'overview' && (
        <div className="space-y-8">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {zoneSummaries.map(summary => (
              <div key={summary.zone} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-xl hover:-translate-y-2 group">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl mb-4 shadow-xl transition-transform group-hover:rotate-6">
                  {summary.zone}
                </div>
                <div className="w-full space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">JOBS</span>
                    <span className="text-2xl font-black text-slate-900 leading-none">{summary.jobCount}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-50 flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">BOXES</span>
                    <span className="text-xl font-black text-blue-600 leading-none">{summary.boxCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table View */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-8 bg-slate-900 flex justify-between items-center">
              <h3 className="font-black text-white uppercase text-xs tracking-[0.2em]">Active Inventory Records</h3>
              <div className="flex items-center gap-3">
                 <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                 <span className="text-[10px] font-black text-white/60 uppercase">Live Database</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                  <tr>
                    <th className="px-8 py-6">IDENTIFIER</th>
                    <th className="px-8 py-6 text-center">LOCATION</th>
                    <th className="px-8 py-6">ACTIVITY LOG</th>
                    <th className="px-8 py-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeJobs.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No Active Data Found</td></tr>
                  ) : (
                    activeJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="px-8 py-6">
                          <div className="font-black text-slate-900 text-lg leading-tight uppercase group-hover:text-blue-600 transition-colors">{job.jobNumber}</div>
                          <div className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-wider">{job.jobName}</div>
                          <div className="mt-3 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 w-fit rounded-lg border border-blue-100">
                             Size: {job.productSize}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black mx-auto shadow-xl group-hover:scale-110 transition-transform">{job.zone}</div>
                        </td>
                        <td className="px-8 py-6 font-mono text-[10px] text-slate-400 space-y-1.5">
                          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> <span className="font-black text-slate-600">CREATED:</span> {new Date(job.createdAt).toLocaleString()}</div>
                          {job.pulledAt && <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> <span className="font-black text-slate-600">PULLED:</span> {new Date(job.pulledAt).toLocaleString()}</div>}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => setDeleteConfirm({id: job.id, no: job.jobNumber})} className="p-4 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-[1.5rem] transition-all active:scale-90 shadow-sm">
                            <span className="text-xl">🗑️</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'create-job' && (
        <div className="max-w-4xl mx-auto bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
          <div className="p-10 bg-slate-900 text-white relative">
            <h2 className="text-3xl font-black tracking-tighter uppercase">ลงทะเบียนงานใหม่</h2>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Inventory Input Module</p>
          </div>
          <form onSubmit={handleCreateJob} className="p-10 space-y-10">
            {jobError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 font-bold text-sm animate-pulse">
                {jobError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">รายละเอียดงาน</label>
                <input type="text" value={jobName} onChange={e => setJobName(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all text-lg" placeholder="Project Name / Description" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">ไซส์สินค้า</label>
                <input type="text" value={productSize} onChange={e => setProductSize(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all text-lg" placeholder="e.g. 50x50x80" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">โซนจัดเก็บ</label>
                <select value={zone} onChange={e => setZone(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all text-lg appearance-none">
                  {ZONES.map(z => <option key={z} value={z}>ZONE {z}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">เลือกลูกค้า</label>
                <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all text-lg appearance-none" required>
                  <option value="">-- SELECT CLIENT --</option>
                  {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Box Contents & Specs</h3>
                <button type="button" onClick={handleAddBox} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black hover:bg-slate-800 shadow-xl transition-all active:scale-95 uppercase tracking-widest">+ Add Box</button>
              </div>
              <div className="space-y-4">
                {newJobBoxes.map((box, idx) => (
                  <div key={box.id} className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-50 flex flex-wrap gap-6 items-end relative transition-all hover:bg-white hover:border-slate-100 hover:shadow-xl group">
                    <button type="button" onClick={() => setNewJobBoxes(newJobBoxes.filter(b => b.id !== box.id))} className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-full text-xl font-black shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transition-transform hover:scale-110">×</button>
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">หมายเลขกล่อง</label>
                      <input type="text" value={box.boxNumber} onChange={e => {
                        const updated = [...newJobBoxes]; updated[idx].boxNumber = e.target.value; setNewJobBoxes(updated);
                      }} className="w-full px-5 py-3 text-sm font-black rounded-xl border-2 border-white bg-white group-hover:bg-slate-50 transition-all focus:border-blue-500 outline-none" />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">ขนาดกล่อง</label>
                      <input type="text" value={box.boxSize} onChange={e => {
                        const updated = [...newJobBoxes]; updated[idx].boxSize = e.target.value; setNewJobBoxes(updated);
                      }} className="w-full px-5 py-3 text-sm font-black rounded-xl border-2 border-white bg-white group-hover:bg-slate-50 transition-all focus:border-blue-500 outline-none" placeholder="ขนาด" />
                    </div>
                    <div className="w-32">
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">สีกล่อง</label>
                      <select value={box.color} onChange={e => {
                        const updated = [...newJobBoxes]; updated[idx].color = e.target.value; setNewJobBoxes(updated);
                      }} className="w-full px-5 py-3 text-sm font-black rounded-xl border-2 border-white bg-white group-hover:bg-slate-50 transition-all focus:border-blue-500 outline-none appearance-none">
                        {COLORS.map(color => <option key={color} value={color}>{color}</option>)}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-2 ml-1">มูลค่า (฿)</label>
                      <input type="number" value={box.price} onChange={e => {
                        const updated = [...newJobBoxes]; updated[idx].price = parseFloat(e.target.value) || 0; setNewJobBoxes(updated);
                      }} className="w-full px-5 py-3 text-sm font-black rounded-xl border-2 border-white bg-white group-hover:bg-slate-50 transition-all focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={newJobBoxes.length === 0 || isCreatingJob}
              className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xl uppercase tracking-tighter active:scale-[0.98]"
            >
              {isCreatingJob ? 'กำลังสร้าง...' : 'Create Production Job'}
            </button>
          </form>
        </div>
      )}

      {view === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl h-fit">
            <h3 className="font-black text-slate-900 text-2xl mb-6 tracking-tight uppercase">New Client</h3>
            
            {customerError && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 font-bold text-sm animate-pulse">
                {customerError}
              </div>
            )}
            
            {customerSuccess && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-green-600 font-bold text-sm animate-pulse">
                {customerSuccess}
              </div>
            )}
            
            <form onSubmit={handleCreateCustomer} className="space-y-6">
              <input 
                type="text" 
                placeholder="Company / Client Name" 
                value={custName} 
                onChange={e => setCustName(e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 outline-none transition-all" 
                required 
                disabled={isCreatingCustomer}
              />
              <input 
                type="text" 
                placeholder="Contact Information" 
                value={custContact} 
                onChange={e => setCustContact(e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:border-blue-500 outline-none transition-all" 
                disabled={isCreatingCustomer}
              />
              <button 
                type="submit" 
                disabled={isCreatingCustomer}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingCustomer ? 'กำลังบันทึก...' : 'Add to Records'}
              </button>
            </form>
          </div>
          <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden">
             <table className="w-full text-left">
               <thead className="text-[10px] font-black text-slate-400 uppercase bg-slate-50/50 tracking-widest border-b">
                 <tr><th className="px-8 py-6">ID</th><th className="px-8 py-6">CLIENT NAME</th><th className="px-8 py-6">CONTACT</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-50 text-sm">
                 {data.customers.length === 0 ? (
                   <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-300 font-black uppercase">No customers yet</td></tr>
                 ) : (
                   data.customers.map(c => (
                     <tr key={c.id} className="hover:bg-slate-50/30 transition-all">
                       <td className="px-8 py-6 font-mono text-[10px] text-slate-300">{c.id}</td>
                       <td className="px-8 py-6 font-black text-slate-900 uppercase tracking-tight">{c.name}</td>
                       <td className="px-8 py-6 font-bold text-slate-400">{c.contact || 'N/A'}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
