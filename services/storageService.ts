
import { Job, Customer, SystemData } from '../types';
import { supabase } from './supabaseClient';

const ROW_ID = 1; // We use a single row to store the app state for simplicity and speed

export const storageService = {
  async getData(): Promise<SystemData> {
    console.log('🔵 [getData] Fetching data from Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('storage_hub_state')
        .select('data')
        .eq('id', ROW_ID)
        .single();

      if (error) {
        console.error('❌ [getData] Supabase error:', error);
        console.log('🔄 [getData] Falling back to localStorage...');
        
        const local = localStorage.getItem('storage_hub_fallback');
        if (local) {
          console.log('✅ [getData] Loaded from localStorage fallback');
          return JSON.parse(local);
        }
        
        console.log('⚠️ [getData] No fallback data, returning empty state');
        return { jobs: [], customers: [] };
      }
      
      if (!data) {
        console.log('⚠️ [getData] No data returned from Supabase');
        const local = localStorage.getItem('storage_hub_fallback');
        return local ? JSON.parse(local) : { jobs: [], customers: [] };
      }
      
      console.log('✅ [getData] Successfully fetched from Supabase:', {
        jobsCount: data.data.jobs?.length || 0,
        customersCount: data.data.customers?.length || 0
      });
      
      // Backup locally just in case
      localStorage.setItem('storage_hub_fallback', JSON.stringify(data.data));
      
      return data.data;
    } catch (error) {
      console.error('❌ [getData] Unexpected error:', error);
      const local = localStorage.getItem('storage_hub_fallback');
      return local ? JSON.parse(local) : { jobs: [], customers: [] };
    }
  },

  async saveData(data: SystemData) {
    console.log('🔵 [saveData] Saving data to Supabase...', {
      jobsCount: data.jobs?.length || 0,
      customersCount: data.customers?.length || 0
    });
    
    try {
      const { error } = await supabase
        .from('storage_hub_state')
        .update({ data, updated_at: new Date().toISOString() })
        .eq('id', ROW_ID);

      if (error) {
        console.error('❌ [saveData] Supabase error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ [saveData] Successfully saved to Supabase');
      localStorage.setItem('storage_hub_fallback', JSON.stringify(data));
    } catch (error) {
      console.error('❌ [saveData] Unexpected error:', error);
      throw error;
    }
  },

  async createJob(job: Job) {
    console.log('🔵 [createJob] Creating new job:', job.jobNumber);
    
    try {
      const data = await this.getData();
      console.log('🔵 [createJob] Current state loaded');
      
      const newData = { ...data, jobs: [...data.jobs, job] };
      console.log('🔵 [createJob] New state prepared, saving...');
      
      await this.saveData(newData);
      console.log('✅ [createJob] Job created successfully');
      
      return newData;
    } catch (error) {
      console.error('❌ [createJob] Failed to create job:', error);
      throw error;
    }
  },

  async updateJob(jobId: string, updates: Partial<Job>) {
    console.log('🔵 [updateJob] Updating job:', jobId, updates);
    
    try {
      const data = await this.getData();
      const newData = {
        ...data,
        jobs: data.jobs.map(j => j.id === jobId ? { ...j, ...updates } : j)
      };
      
      await this.saveData(newData);
      console.log('✅ [updateJob] Job updated successfully');
      
      return newData;
    } catch (error) {
      console.error('❌ [updateJob] Failed to update job:', error);
      throw error;
    }
  },

  async deleteJob(jobId: string) {
    console.log('🔵 [deleteJob] Deleting job:', jobId);
    
    try {
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
      console.log('✅ [deleteJob] Job deleted successfully');
      
      return newData;
    } catch (error) {
      console.error('❌ [deleteJob] Failed to delete job:', error);
      throw error;
    }
  },

  async permanentDeleteBox(jobId: string, boxId: string) {
    console.log('🔵 [permanentDeleteBox] Deleting box:', boxId, 'from job:', jobId);
    
    try {
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
      console.log('✅ [permanentDeleteBox] Box deleted successfully');
      
      return newData;
    } catch (error) {
      console.error('❌ [permanentDeleteBox] Failed to delete box:', error);
      throw error;
    }
  },

  async createCustomer(customer: Customer) {
    console.log('🔵 [createCustomer] Creating new customer:', customer);
    
    try {
      console.log('🔵 [createCustomer] Step 1: Getting current data...');
      const data = await this.getData();
      
      console.log('🔵 [createCustomer] Step 2: Current data loaded:', {
        existingCustomers: data.customers?.length || 0,
        customerIds: data.customers?.map(c => c.id) || []
      });
      
      console.log('🔵 [createCustomer] Step 3: Preparing new data...');
      const newData = { 
        ...data, 
        customers: [...(data.customers || []), customer] 
      };
      
      console.log('🔵 [createCustomer] Step 4: New data prepared:', {
        newCustomersCount: newData.customers.length,
        newCustomer: customer
      });
      
      console.log('🔵 [createCustomer] Step 5: Saving to Supabase...');
      await this.saveData(newData);
      
      console.log('✅ [createCustomer] Customer created successfully!');
      console.log('✅ [createCustomer] Final state:', {
        totalCustomers: newData.customers.length,
        latestCustomer: newData.customers[newData.customers.length - 1]
      });
      
      return newData;
    } catch (error) {
      console.error('❌ [createCustomer] Failed at some step:', error);
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
  }
};
