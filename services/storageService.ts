
import { Job, Customer, SystemData } from '../types';

const STORAGE_KEY = 'storage_hub_v1_data';

export const storageService = {
  getData(): SystemData {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { jobs: [], customers: [] };
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return { jobs: [], customers: [] };
    }
  },

  saveData(data: SystemData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  createJob(job: Job) {
    const data = storageService.getData();
    const newData = {
      ...data,
      jobs: [...data.jobs, job]
    };
    storageService.saveData(newData);
  },

  updateJob(jobId: string, updates: Partial<Job>) {
    const data = storageService.getData();
    const newData = {
      ...data,
      jobs: data.jobs.map(j => j.id === jobId ? { ...j, ...updates } : j)
    };
    storageService.saveData(newData);
  },

  deleteJob(jobId: string) {
    const data = storageService.getData();
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
    storageService.saveData(newData);
  },

  permanentDeleteJob(jobId: string) {
    const data = storageService.getData();
    const newData = {
      ...data,
      jobs: data.jobs.filter(j => j.id !== jobId)
    };
    storageService.saveData(newData);
  },

  permanentDeleteBox(jobId: string, boxId: string) {
    const data = storageService.getData();
    let newData = { ...data };
    
    newData.jobs = data.jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          boxes: job.boxes.filter(box => box.id !== boxId)
        };
      }
      return job;
    });

    // Remove the job entirely if it has no boxes left
    newData.jobs = newData.jobs.filter(job => job.boxes.length > 0);
    
    storageService.saveData(newData);
  },

  createCustomer(customer: Customer) {
    const data = storageService.getData();
    const newData = {
      ...data,
      customers: [...data.customers, customer]
    };
    storageService.saveData(newData);
  },

  deleteCustomer(id: string) {
    const data = storageService.getData();
    const newData = {
      ...data,
      customers: data.customers.filter(c => c.id !== id)
    };
    storageService.saveData(newData);
  }
};
