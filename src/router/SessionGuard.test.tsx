import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import { sessionService } from '../services/session.service'
import { useAuthStore } from '../store/authStore'

vi.mock('../services/session.service', () => ({ sessionService: { getSession: vi.fn() } }))
const check = vi.mocked(sessionService.getSession)
const user = { id: 1, name: 'User A', role: 'customer' }

function Login() {
  const location = useLocation()
  return <p>Login{location.search}</p>
}

function mount(path = '/account/profile') {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<p>Home</p>} />
    <Route element={<ProtectedRoute />}>
      <Route path="/account/profile" element={<><p>Profile</p><Link to="/checkout">Go checkout</Link></>} />
      <Route path="/checkout" element={<p>Checkout</p>} />
    </Route>
    <Route element={<AdminRoute allowedRoles={['admin']} />}><Route path="/admin" element={<p>Admin</p>} /></Route>
  </Routes></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.getState().logout()
  useAuthStore.getState().setAuth('token', 'refresh', user)
})

it.each(['/account/profile', '/checkout'])('waits for server confirmation before rendering %s', async (path) => {
  let resolve!: (value: typeof user) => void
  check.mockImplementation(() => new Promise((done) => { resolve = done }))
  mount(path)
  expect(screen.getByRole('status')).toBeTruthy()
  expect(screen.queryByText(path === '/checkout' ? 'Checkout' : 'Profile')).toBeNull()
  await act(async () => resolve(user))
  expect(screen.getByText(path === '/checkout' ? 'Checkout' : 'Profile')).toBeTruthy()
})

it.each(['/account/profile', '/checkout', '/admin'])('redirects revoked sessions at %s', async (path) => {
  check.mockImplementation(async () => { useAuthStore.getState().expireSession(); throw new Error('Revoked') })
  mount(path)
  expect(await screen.findByText('Login?session=expired')).toBeTruthy()
})

it('redirects a guest without checking the server', async () => {
  useAuthStore.getState().logout()
  mount('/checkout')
  expect(await screen.findByText('Login')).toBeTruthy()
  expect(check).not.toHaveBeenCalled()
})

it('blocks content on network errors and supports retry', async () => {
  check.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(user)
  mount()
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.queryByText('Profile')).toBeNull()
  expect(useAuthStore.getState().token).toBe('token')
  fireEvent.click(screen.getByText('Thử lại'))
  expect(await screen.findByText('Profile')).toBeTruthy()
})

it('rechecks the session when navigating from profile to checkout', async () => {
  check.mockResolvedValueOnce(user).mockImplementationOnce(async () => {
    useAuthStore.getState().expireSession(); throw new Error('Revoked')
  })
  mount()
  fireEvent.click(await screen.findByText('Go checkout'))
  expect(await screen.findByText('Login?session=expired')).toBeTruthy()
  expect(screen.queryByText('Checkout')).toBeNull()
  expect(check).toHaveBeenCalledTimes(2)
})

it('uses the server role instead of a stale cached admin role', async () => {
  useAuthStore.getState().setAuth('token', 'refresh', { ...user, role: 'admin' })
  check.mockResolvedValue(user)
  mount('/admin')
  expect(await screen.findByText('Home')).toBeTruthy()
  expect(screen.queryByText('Admin')).toBeNull()
})

it('ignores an old session check after another account logs in', async () => {
  let resolve!: (value: typeof user) => void
  check.mockImplementationOnce(() => new Promise((done) => { resolve = done }))
  const other = { ...user, id: 2, name: 'User B' }
  check.mockResolvedValueOnce(other)
  mount()
  await act(async () => useAuthStore.getState().setAuth('other', 'other-refresh', other))
  await waitFor(() => expect(check).toHaveBeenCalledTimes(2))
  await act(async () => resolve(user))
  expect(useAuthStore.getState().user?.id).toBe(2)
})
