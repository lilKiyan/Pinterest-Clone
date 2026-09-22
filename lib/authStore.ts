import { create } from 'zustand'
import type { CurrentUser } from '../app/types/user'

type AuthState = {
    user: CurrentUser | null
    setUser: (user: CurrentUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}))