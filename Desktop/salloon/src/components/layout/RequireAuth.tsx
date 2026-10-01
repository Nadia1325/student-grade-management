import { Navigate, Outlet } from 'react-router-dom'
import { useSalon } from '../../store/SalonContext'
import type { Role } from '../../types'

export function RequireAuth({ roles }: { roles: Role[] }) {
  const { me } = useSalon()
  if (!me) return <Navigate to="/" replace />
  if (!roles.includes(me.role)) {
    const home: Record<Role, string> = {
      admin: '/admin',
      manager: '/manager',
      cashier: '/cashier',
      haircutter: '/stylist',
    }
    return <Navigate to={home[me.role]} replace />
  }
  return <Outlet />
}
