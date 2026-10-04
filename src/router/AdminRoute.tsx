import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

type AdminRouteProps = {
  allowedRoles?: Array<'admin' | 'staff'>
}

export default function AdminRoute({ allowedRoles = ['admin', 'staff'] }: AdminRouteProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase();
  if (!allowedRoles.includes(role as 'admin' | 'staff')) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
