import axios from 'axios'
import { authService } from './auth.service'
import { useAuthStore } from '../store/authStore'
import { emitAppToast } from '../utils/appToastBus'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = []
let lastRateLimitToastAt = 0
let lastOfflineToastAt = 0

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token as string)
    }
  })
  failedQueue = []
}

/**
 * Xử lý khi phiên hoàn toàn hết hạn (refresh token cũng thất bại).
 * Logout → redirect đến /login kèm query param để hiển thị thông báo.
 */
const handleSessionExpired = () => {
  useAuthStore.getState().logout()
  window.location.href = '/login?session=expired'
}

const shouldShowToast = (lastShownAt: number, cooldownMs = 4000) => {
  return Date.now() - lastShownAt > cooldownMs
}

const readRetryAfterSeconds = (error: any) => {
  const retryAfter = error.response?.headers?.['retry-after'] ?? error.response?.headers?.['x-ratelimit-reset']
  const parsed = Number.parseInt(String(retryAfter ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const notifyRateLimit = (error: any) => {
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
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Xử lý 401 → refresh token tự động hoặc redirect login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 429) {
      notifyRateLimit(error)
      return Promise.reject(error)
    }

    if (!error.response) {
      notifyOffline()
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu request đến /auth/refresh hoặc /auth/login đã thất bại → phiên hết hạn hoàn toàn
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        handleSessionExpired()
        return Promise.reject(error)
      }

      // Nếu đang refresh, xếp hàng chờ
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            return api(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        handleSessionExpired()
        return Promise.reject(error)
      }

      try {
        const response = await authService.refreshToken(refreshToken)
        const newToken = response.data.accessToken
        const newRefreshToken = response.data.refreshToken
        
        // Cập nhật lại store và local storage
        const user = useAuthStore.getState().user
        useAuthStore.getState().setAuth(newToken, newRefreshToken, user)
        
        processQueue(null, newToken)
        
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        handleSessionExpired()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
