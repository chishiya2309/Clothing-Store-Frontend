import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function AdminRoute() {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase();
  if (role !== 'admin' && role !== 'staff') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}