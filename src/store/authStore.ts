import { create } from 'zustand'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: { id: number; name: string; role: string } | null
  setAuth: (token: string, refreshToken: string, user: AuthState['user']) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: null,
  setAuth: (token, refreshToken, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
    set({ token, refreshToken, user })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    set({ token: null, refreshToken: null, user: null })
  },
}))