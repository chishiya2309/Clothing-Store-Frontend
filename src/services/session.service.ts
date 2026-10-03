import api from './api'

export interface SessionUser {
  id: number
  name: string
  role: string
}

export const sessionService = {
  getSession: async (): Promise<SessionUser> => {
    const response = await api.get<{ data: SessionUser }>('/auth/session')
    return response.data.data
  },
}
