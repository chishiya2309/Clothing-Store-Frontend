import { create } from 'zustand'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: { id: number; name: string; role: string } | null
  setAuth: (token: string, refreshToken: string, user: AuthState['user']) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  const getStoredUser = () => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  return {
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: getStoredUser(),
    setAuth: (token, refreshToken, user) => {
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
      set({ token, refreshToken, user })
    },
    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      set({ token: null, refreshToken: null, user: null })
    },
  }
})