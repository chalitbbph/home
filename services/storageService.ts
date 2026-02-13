
import { Job, Customer, SystemData } from '../types';
import { supabase } from './supabaseClient';

const ROW_ID = 1; // We use a single row to store the app state for simplicity and speed

export const storageService = {
  async getData(): Promise<SystemData> {
    const { data, error } = await supabase
      .from('storage_hub_state')
      .select('data')
      .eq('id', ROW_ID)
      .single();

    if (error || !data) {
      console.error('Error fetching from Supabase, falling back to local:', error);
      const local = localStorage.getItem('storage_hub_fallback');
      return local ? JSON.parse(local) : { jobs: [], customers: [] };
    }
    
    // Backup locally just in case
    localStorage.setItem('storage_hub_fallback', JSON.stringify(data.data));
    return data.data;
  },

  async saveData(data: SystemData) {
    const { error } = await supabase
      .from('storage_hub_state')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', ROW_ID);

    if (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
    localStorage.setItem('storage_hub_fallback', JSON.stringify(data));
  },

  async createJob(job: Job) {
    const data = await this.getData();
    const newData = { ...data, jobs: [...data.jobs, job] };
    await this.saveData(newData);
    return newData;
  },

  async updateJob(jobId: string, updates: Partial<Job>) {
    const data = await this.getData();
    const newData = {
      ...data,
      jobs: data.jobs.map(j => j.id === jobId ? { ...j, ...updates } : j)
    };
    await this.saveData(newData);
    return newData;
  },

  async deleteJob(jobId: string) {
    const data = await this.getData();
    const newData = {
      ...data,
      jobs: data.jobs.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            status: 'deleted' as const,
            deletedAt: new Date().toISOString()
          };
        }
        return j;
      })
    };
    await this.saveData(newData);
    return newData;
  },

  async permanentDeleteBox(jobId: string, boxId: string) {
    const data = await this.getData();
    let updatedJobs = data.jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          boxes: job.boxes.filter(box => box.id !== boxId)
        };
      }
      return job;
    });

    updatedJobs = updatedJobs.filter(job => job.boxes.length > 0);
    const newData = { ...data, jobs: updatedJobs };
    await this.saveData(newData);
    return newData;
  },

  async createCustomer(customer: Customer) {
    const data = await this.getData();
    const newData = { ...data, customers: [...data.customers, customer] };
    await this.saveData(newData);
    return newData;
  }
};
