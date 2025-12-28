
export interface Medicine {
  id: string;
  name: string;
  brand: string;
  ingredients: string;
  specs: string;
  indications: string;
  usage: string;
  expiryDate: string;
  image?: string;
}

export interface PrescriptionMedicine {
  medicineId: string;
  customUsage?: string;
}

export interface Prescription {
  id: string;
  name: string;
  medicines: PrescriptionMedicine[];
  contactId?: string;
  startDate: string;
  endDate: string;
  reminderTimes: string[]; // Array of strings like "10:00", "13:00", etc.
  isActive: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'connected' | 'local'; // Simulated connectivity status
}

export interface User {
  id: string;
  phone: string;
  isNew?: boolean;
}

export type ViewState = 'medicine' | 'prescription' | 'contacts';
