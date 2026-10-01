import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Armchair,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings2,
  Shield,
  Users,
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useSalon } from '../../store/SalonContext'
import type { Role } from '../../types'
import { Button } from '../ui/Button'
import { AvatarWithStatus } from '../ui/Avatar'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '../../lib/utils'

const nav: Record<Role, { to: string; label: string; icon: typeof Scissors }[]> = {
  cashier: [
    { to: '/cashier', label: 'Front desk', icon: Wallet },
    { to: '/cashier/queue', label: 'Queue board', icon: ClipboardList },
    { to: '/cashier/shift', label: 'Shift register', icon: LayoutDashboard },
  ],
  haircutter: [
    { to: '/stylist', label: 'Station', icon: Scissors },
    { to: '/stylist/analytics', label: 'Performance', icon: LayoutDashboard },
  ],
  manager: [
    { to: '/manager', label: 'Floor', icon: Armchair },
    { to: '/manager/audit', label: 'Reconciliation', icon: ClipboardList },
    { to: '/manager/payroll', label: 'Payroll', icon: Wallet },
    { to: '/manager/overrides', label: 'Overrides', icon: Shield },
  ],
  admin: [
    { to: '/admin', label: 'Intelligence', icon: LayoutDashboard },
    { to: '/admin/staff', label: 'Staff & access', icon: Users },
    { to: '/admin/catalog', label: 'Service catalog', icon: Scissors },
    { to: '/admin/settings', label: 'Salon settings', icon: Settings2 },
    { to: '/admin/logs', label: 'Audit trail', icon: ClipboardList },
  ],
}

export function AppShell() {
  const { me, logout, state } = useSalon()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const items = me ? nav[me.role] : []
  const unread = useMemo(
    () =>
      state.notifications.filter(
        (n) => !n.read && (n.targetStaffId === me?.id || n.targetRole === me?.role),
      ).length,
    [state.notifications, me],
  )

  if (!me) return <Outlet />

  const getStatus = () => {
    if (me.status === 'idle') return 'online'
    if (me.status === 'busy') return 'busy'
    if (me.status === 'break') return 'away'
    return 'offline'
  }

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="flex min-h-dvh">
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-[35] bg-black/50 lg:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 border-r border-gray-200 glass-card transition-all duration-300 dark:border-gray-700',
            collapsed ? 'w-20' : 'w-72',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
        >
          <div className="flex h-16 items-center justify-between px-4">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gold-gradient">
                  <Scissors className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-display text-lg font-bold">{state.settings.name.split(' ')[1] ?? 'Saloon'}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Single salon floor</p>
                </div>
              </div>
            )}
            <button
              className="hidden lg:flex"
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>

          {!collapsed && (
            <div className="mx-4 mt-4 glass-card rounded-xl p-3">
              <div className="flex items-center gap-3">
                <AvatarWithStatus name={me.name} status={getStatus()} size="md" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{me.name}</p>
                  <p className="text-[10px] capitalize text-gray-600 dark:text-gray-400">{me.role === 'haircutter' ? 'Haircutter' : me.role}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400">
                <span>Station {me.station ?? '—'}</span>
                <span className="capitalize">{me.status}</span>
              </div>
            </div>
          )}

          <nav className={cn('mt-6 grid gap-1 px-4', collapsed ? 'items-center' : '')}>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'gold-gradient text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={16} />
                {!collapsed && item.label}
              </NavLink>
            ))}
          </nav>

          <div className={cn('absolute bottom-5 left-4 right-4', collapsed ? 'flex justify-center' : '')}>
            <Button
              tone="soft"
              className={cn(collapsed ? 'px-3' : 'w-full')}
              onClick={() => {
                logout()
                navigate('/')
              }}
              title={collapsed ? 'Sign out' : undefined}
            >
              <LogOut size={16} />
              {!collapsed && <span>Sign out</span>}
            </Button>
          </div>
        </aside>

        <div className={cn('flex min-w-0 flex-1 flex-col transition-all duration-300', collapsed ? 'lg:ml-20' : 'lg:ml-72')}>
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/80 px-5 py-3 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">{state.settings.hours}</p>
                <p className="text-sm font-medium">{state.settings.stations} chairs · {state.settings.currency}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {unread > 0 ? (
                <span className="flex items-center gap-2 rounded-full bg-[#d4af37]/10 px-3 py-1.5 text-xs font-medium text-[#d4af37]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4af37] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d4af37]" />
                  </span>
                  {unread}
                </span>
              ) : null}
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-5 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
