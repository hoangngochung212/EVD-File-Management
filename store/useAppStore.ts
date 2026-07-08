import { create } from 'zustand';
import { Role } from '@/lib/types';

interface AppState {
  role: Role;
  currentUser: string;
  setRole: (role: Role) => void;
}

// Simulated logged-in staff user. In a real app this would come from auth.
export const STAFF_USER = 'bob';

export const useAppStore = create<AppState>((set) => ({
  role: 'ADMIN',
  currentUser: STAFF_USER,
  setRole: (role) => set({ role }),
}));
