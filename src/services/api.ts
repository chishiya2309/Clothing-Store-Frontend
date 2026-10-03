import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { authService } from './auth.service'
import { useAuthStore } from '../store/authStore'
import { emitAppToast } from '../utils/appToastBus'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

type SessionRequest = InternalAxiosRequestConfig & { _retry?: boolean; _sessionEpoch?: number }
let refreshPromise: Promise<string> | null = null
let refreshEpoch = -1
let lastRateLimitToastAt = 0
let lastOfflineToastAt = 0

/**
 * Xử lý khi phiên hoàn toàn hết hạn (refresh token cũng thất bại).
 * Logout → redirect đến /login kèm query param để hiển thị thông báo.
 */
const handleSessionExpired = (epoch: number) => {
  const state = useAuthStore.getState()
  if (state.sessionEpoch !== epoch || !state.token) return
  state.expireSession()
  emitAppToast({
    message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
    type: 'warning',
    duration: 5000,
  })
}

const shouldShowToast = (lastShownAt: number, cooldownMs = 4000) => {
  return Date.now() - lastShownAt > cooldownMs
}

const readRetryAfterSeconds = (error: AxiosError<{ message?: string }>) => {
  const retryAfter = error.response?.headers?.['retry-after'] ?? error.response?.headers?.['x-ratelimit-reset']
  const parsed = Number.parseInt(String(retryAfter ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const notifyRateLimit = (error: AxiosError<{ message?: string }>) => {
  if (!shouldShowToast(lastRateLimitToastAt)) {
    return
  }

  lastRateLimitToastAt = Date.now()
  const retryAfterSeconds = readRetryAfterSeconds(error)
  const fallbackMessage = retryAfterSeconds
    ? `Bạn thao tác hơi nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
    : 'Hệ thống đang giới hạn tần suất truy cập. Vui lòng thử lại sau.'
  const serverMessage = error.response?.data?.message

  emitAppToast({
    message: retryAfterSeconds ? fallbackMessage : (serverMessage || fallbackMessage),
    type: 'warning',
    duration: 5000,
  })
}

const notifyOffline = () => {
  if (!shouldShowToast(lastOfflineToastAt)) {
    return
  }

  lastOfflineToastAt = Date.now()
  emitAppToast({
    message: 'Bạn đang offline hoặc kết nối không ổn định. Kiểm tra mạng rồi thử lại nhé.',
    type: 'warning',
    duration: 5000,
  })
}

// Gắn JWT token vào mọi request
api.interceptors.request.use((config) => {
  const state = useAuthStore.getState()
  const request = config as SessionRequest
  if (request._sessionEpoch !== undefined && request._sessionEpoch !== state.sessionEpoch) {
    throw new axios.CanceledError('Session changed')
  }
  request._sessionEpoch = state.sessionEpoch
  const token = state.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  else config.headers.delete('Authorization')
  return config
})

const refreshSession = (epoch: number, refreshToken: string): Promise<string> => {
  if (refreshPromise && refreshEpoch === epoch) return refreshPromise
  refreshEpoch = epoch
  const pending = (async () => {
    try {
      const response = await authService.refreshToken(refreshToken)
      const state = useAuthStore.getState()
      if (state.sessionEpoch !== epoch || state.refreshToken !== refreshToken || !state.token) {
        throw new axios.CanceledError('Session changed')
      }
      const { accessToken, refreshToken: newRefreshToken } = response.data
      if (!accessToken || !newRefreshToken) throw new Error('Invalid refresh response')
      state.replaceTokens(accessToken, newRefreshToken)
      return accessToken as string
    } catch (error) {
      if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
        handleSessionExpired(epoch)
      } else if (axios.isAxiosError(error) && !error.response && !axios.isCancel(error)) {
        notifyOffline()
      }
      throw error
    }
  })()
  const promise = pending.finally(() => {
    if (refreshPromise === promise) refreshPromise = null
  })
  refreshPromise = promise
  return promise
}

// Xử lý 401 → refresh token tự động hoặc redirect login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as SessionRequest | undefined

    if (axios.isCancel(error)) return Promise.reject(error)

    if (error.response?.status === 429) {
      notifyRateLimit(error)
      return Promise.reject(error)
    }

    if (!error.response) {
      notifyOffline()
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && originalRequest) {
      const state = useAuthStore.getState()
      const epoch = originalRequest._sessionEpoch ?? state.sessionEpoch
      if (state.sessionEpoch !== epoch) return Promise.reject(error)
      if (originalRequest._retry || !state.refreshToken || !state.token) {
        handleSessionExpired(epoch)
        return Promise.reject(error)
      }
      originalRequest._retry = true
      try {
        const token = await refreshSession(epoch, state.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
