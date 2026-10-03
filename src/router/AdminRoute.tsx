import SessionGuard from './SessionGuard'

type AdminRouteProps = {
  allowedRoles?: Array<'admin' | 'staff'>
}

export default function AdminRoute({ allowedRoles = ['admin', 'staff'] }: AdminRouteProps) {
  return <SessionGuard allowedRoles={allowedRoles} />
}
