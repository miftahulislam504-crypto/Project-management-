import { create } from 'zustand'
import { AppUser } from '@/lib/types'

interface AuthStore {
  user: AppUser | null
  initialized: boolean
  setUser: (user: AppUser | null) => void
  setInitialized: (initialized: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  initialized: false,
  setUser:        (user)        => set({ user }),
  setInitialized: (initialized) => set({ initialized }),
}))
