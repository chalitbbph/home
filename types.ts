
export type UserRole = 'admin' | 'user';

export interface User {
  username: string;
  role: UserRole;
}

export type JobStatus = 'stored' | 'pulled' | 'returned' | 'deleted';

export interface Box {
  id: string;
  boxNumber: string;
  color: string;
  boxSize: string; // ไซส์ของตัวกล่อง
  price: number;
  contents: string;
  hasIssue?: boolean;
  issueNote?: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  jobName: string;
  productSize: string; // ไซส์ของตัวสินค้าในงานนี้
  customerId: string;
  zone: string;
  status: JobStatus;
  boxes: Box[];
  createdAt: string;
  pulledAt?: string;
  returnedAt?: string;
  lineProduction?: number; 
  deletedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  createdAt: string;
}

export interface SystemData {
  jobs: Job[];
  customers: Customer[];
}
