import { create } from 'zustand'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: { id: number; name: string; role: string } | null
  sessionEpoch: number
  sessionExpired: boolean
  setAuth: (token: string, refreshToken: string, user: AuthState['user']) => void
  replaceTokens: (token: string, refreshToken: string) => void
  setUser: (user: NonNullable<AuthState['user']>) => void
  expireSession: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  const clearAuth = (sessionExpired: boolean) => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set((state) => ({ token: null, refreshToken: null, user: null,
      sessionEpoch: state.sessionEpoch + 1, sessionExpired }))
  }
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
    sessionEpoch: 0,
    sessionExpired: false,
    setAuth: (token, refreshToken, user) => {
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
      set((state) => ({ token, refreshToken, user,
        sessionEpoch: state.sessionEpoch + 1, sessionExpired: false }))
    },
    replaceTokens: (token, refreshToken) => {
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      set({ token, refreshToken })
    },
    setUser: (user) => {
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    },
    logout: () => clearAuth(false),
    expireSession: () => clearAuth(true),
  }
})
