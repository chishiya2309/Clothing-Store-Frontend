import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { sessionService } from '@/services/session.service'
import type { SessionUser } from '@/services/session.service'

export default function SessionGuard({ allowedRoles }: { allowedRoles?: string[] }) {
  const hasToken = useAuthStore((state) => Boolean(state.token))
  const epoch = useAuthStore((state) => state.sessionEpoch)
  const expired = useAuthStore((state) => state.sessionExpired)
  const location = useLocation()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; user: SessionUser | null } | null>(null)
  const key = `${epoch}:${location.key}:${attempt}`

  useEffect(() => {
    if (!hasToken) return
    let active = true
    sessionService.getSession().then((user) => {
      if (!active || useAuthStore.getState().sessionEpoch !== epoch) return
      useAuthStore.getState().setUser(user)
      setResult({ key, user })
    }).catch(() => {
      if (active) setResult({ key, user: null })
    })
    return () => { active = false }
  }, [key, hasToken, epoch])

  if (!hasToken) return <Navigate to={expired ? '/login?session=expired' : '/login'} replace />
  if (result?.key !== key) return <p role="status" className="p-8 text-center">Đang kiểm tra phiên đăng nhập...</p>
  if (!result.user) return (
    <div className="p-8 text-center" role="alert">
      <p>Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.</p>
      <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 underline">Thử lại</button>
    </div>
  )
  if (allowedRoles && !allowedRoles.includes(result.user.role.toLowerCase())) return <Navigate to="/" replace />
  return <Outlet />
}
