import { AxiosError, AxiosHeaders } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './api'
import { authService } from './auth.service'
import { useAuthStore } from '../store/authStore'

vi.mock('./auth.service', () => ({ authService: { refreshToken: vi.fn() } }))
const refresh = vi.mocked(authService.refreshToken)
const user = { id: 1, name: 'User A', role: 'customer' }
const response = (config: InternalAxiosRequestConfig, status = 200) =>
  ({ data: {}, status, statusText: String(status), headers: new AxiosHeaders(), config })
const failure = (config: InternalAxiosRequestConfig, status = 401) =>
  new AxiosError('Request rejected', 'ERR_BAD_RESPONSE', config, undefined, response(config, status))
const refreshFailure = (status: number) => failure({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig, status)
const refreshed = { data: { accessToken: 'new', refreshToken: 'refresh' } }

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.getState().logout()
  useAuthStore.getState().setAuth('old', 'refresh', user)
  api.defaults.adapter = vi.fn(async (config) => {
    if (config.headers.Authorization === 'Bearer old') throw failure(config)
    return response(config)
  })
})

describe('session refresh', () => {
  it('shares one refresh across concurrent requests and retries each once', async () => {
    refresh.mockResolvedValue(refreshed)
    await Promise.all([api.get('/profile'), api.get('/orders'), api.post('/checkouts/confirm')])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().token).toBe('new')
    expect(localStorage.getItem('token')).toBe('new')
  })

  it('rejects all waiting requests and clears auth when refresh is revoked', async () => {
    refresh.mockRejectedValue(refreshFailure(401))
    const results = await Promise.allSettled([api.get('/profile'), api.post('/checkouts/confirm')])
    expect(results.every((result) => result.status === 'rejected')).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().sessionExpired).toBe(true)
    expect(useAuthStore.getState().token).toBeNull()
    for (const key of ['token', 'refreshToken', 'user']) expect(localStorage.getItem(key)).toBeNull()
  })

  it('does not leave a stuck refresh when the refresh token is absent', async () => {
    useAuthStore.getState().setAuth('old', '', user)
    await expect(api.get('/profile')).rejects.toThrow()
    expect(refresh).not.toHaveBeenCalled()
    useAuthStore.getState().setAuth('old', 'refresh', user)
    refresh.mockResolvedValue(refreshed)
    await api.get('/profile')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('ends the session when the retried request is still unauthorized', async () => {
    api.defaults.adapter = vi.fn(async (config) => { throw failure(config) })
    refresh.mockResolvedValue(refreshed)
    await expect(api.get('/profile')).rejects.toThrow()
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().token).toBeNull()
  })

  it.each([500, 503])('keeps auth on refresh server error %s and allows another attempt', async (status) => {
    refresh.mockRejectedValueOnce(refreshFailure(status)).mockResolvedValueOnce(refreshed)
    await expect(api.get('/profile')).rejects.toThrow()
    expect(useAuthStore.getState().token).toBe('old')
    await api.get('/profile')
    expect(useAuthStore.getState().token).toBe('new')
  })

  it('keeps auth when refresh fails because of a network outage', async () => {
    refresh.mockRejectedValue(new AxiosError('Offline', 'ERR_NETWORK'))
    await expect(api.get('/profile')).rejects.toThrow()
    expect(useAuthStore.getState().token).toBe('old')
  })

  it('releases concurrent requests after a refresh timeout and permits a later retry', async () => {
    refresh.mockRejectedValueOnce(new AxiosError('Refresh timed out', 'ECONNABORTED')).mockResolvedValueOnce(refreshed)
    const results = await Promise.allSettled([api.get('/profile'), api.get('/orders')])
    expect(results.every((result) => result.status === 'rejected')).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().token).toBe('old')
    await api.get('/profile')
    expect(refresh).toHaveBeenCalledTimes(2)
    expect(useAuthStore.getState().token).toBe('new')
  })

  it('rejects an incomplete refresh response without leaving requests stuck', async () => {
    refresh.mockResolvedValueOnce({ data: { accessToken: 'partial' } }).mockResolvedValueOnce(refreshed)
    const results = await Promise.allSettled([api.get('/profile'), api.get('/orders')])
    expect(results.every((result) => result.status === 'rejected')).toBe(true)
    expect(useAuthStore.getState().token).toBe('old')
    await api.get('/profile')
    expect(refresh).toHaveBeenCalledTimes(2)
    expect(useAuthStore.getState().token).toBe('new')
  })

  it.each(['logout', 'new-login'])('ignores a late refresh response after %s', async (action) => {
    let resolveRefresh!: (value: typeof refreshed) => void
    refresh.mockImplementation(() => new Promise((resolve) => { resolveRefresh = resolve }))
    const pending = api.get('/profile')
    const settled = Promise.allSettled([pending])
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    useAuthStore.getState().logout()
    if (action === 'new-login') useAuthStore.getState().setAuth('other', 'other-refresh', { ...user, id: 2 })
    resolveRefresh(refreshed)
    expect((await settled)[0].status).toBe('rejected')
    expect(useAuthStore.getState().token).toBe(action === 'logout' ? null : 'other')
    expect(localStorage.getItem('token')).toBe(action === 'logout' ? null : 'other')
  })

  it('does not expire a newer login when an old refresh fails', async () => {
    let rejectRefresh!: (reason: unknown) => void
    refresh.mockImplementation(() => new Promise((_, reject) => { rejectRefresh = reject }))
    const settled = Promise.allSettled([api.get('/profile')])
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    useAuthStore.getState().setAuth('other', 'other-refresh', { ...user, id: 2 })
    rejectRefresh(refreshFailure(401))
    await settled
    expect(useAuthStore.getState().token).toBe('other')
    expect(useAuthStore.getState().sessionExpired).toBe(false)
  })

  it('does not log out a valid session on a forbidden business operation', async () => {
    api.defaults.adapter = vi.fn(async (config) => { throw failure(config, 403) })
    await expect(api.get('/admin-only')).rejects.toThrow()
    expect(refresh).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBe('old')
  })
})
