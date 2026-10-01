import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Scissors, User, Lock, Sparkles } from 'lucide-react'
import { useSalon } from '../store/SalonContext'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import type { Role } from '../types'

const demos: { role: Role; email: string; pin: string; blurb: string; icon: any }[] = [
  { role: 'cashier', email: 'efua@salloon.local', pin: '2222', blurb: 'Tickets, queue, settlement', icon: User },
  { role: 'haircutter', email: 'kojo@salloon.local', pin: '3333', blurb: 'Station 1 · live jobs', icon: Scissors },
  { role: 'manager', email: 'kwame@salloon.local', pin: '1111', blurb: 'Floor, drawer, payroll', icon: Sparkles },
  { role: 'admin', email: 'ama@salloon.local', pin: '0000', blurb: 'Catalog, access, intelligence', icon: Lock },
]

export function LoginPage() {
  const { login, me, state } = useSalon()
  const navigate = useNavigate()
  const [email, setEmail] = useState(demos[0].email)
  const [pin, setPin] = useState(demos[0].pin)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role>(demos[0].role)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  if (me) {
    const home = { admin: '/admin', manager: '/manager', cashier: '/cashier', haircutter: '/stylist' } as const
    return <Navigate to={home[me.role]} replace />
  }

  function go(nextEmail: string, nextPin: string) {
    const staff = login(nextEmail, nextPin)
    if (!staff) {
      setError('Unknown staff or PIN. Use a demo account below.')
      return
    }
    const home = { admin: '/admin', manager: '/manager', cashier: '/cashier', haircutter: '/stylist' } as const
    navigate(home[staff.role])
  }

  function selectDemo(d: typeof demos[0]) {
    setEmail(d.email)
    setPin(d.pin)
    setSelectedRole(d.role)
    setError('')
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    // In a real app, this would send an email
    setResetSent(true)
    setTimeout(() => {
      setShowReset(false)
      setResetSent(false)
      setResetEmail('')
    }, 3000)
  }

  if (showReset) {
    return (
      <div className="relative min-h-dvh bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-20" />
        
        <nav className="relative z-10 flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gold-gradient">
              <Scissors className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-gray-900 dark:text-white">{state.settings.name}</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Salon Management System</p>
            </div>
          </div>
          <ThemeToggle />
        </nav>

        <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
          <div className="glass-card w-full rounded-xl p-6 animate-scale-in">
            <div className="mb-6 text-center">
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {resetSent ? 'Reset link sent to your email' : 'Enter your email to reset your PIN'}
              </p>
            </div>

            {resetSent ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#4ade80]/20">
                  <span className="text-[#4ade80] text-2xl">✓</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check your email for instructions to reset your PIN.
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <Field label="Work Email">
                  <Input
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </Field>
                <Button type="submit" className="w-full text-sm">
                  Send Reset Link
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="grid-dots pointer-events-none absolute inset-0 opacity-20" />

      <nav className="relative z-10 flex items-center justify-between p-6">
        <Button tone="ghost" onClick={() => navigate('/')} className="gap-2 text-xs">
          <ArrowLeft size={16} />
          Back to Home
        </Button>
        <ThemeToggle />
      </nav>

      <div className="relative mx-auto grid min-h-dvh max-w-5xl items-center gap-8 px-6 py-12 lg:grid-cols-[1fr_1fr]">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gold-gradient">
              <Scissors className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{state.settings.name}</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Salon Management System</p>
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            Walk-in salon operations without a client app. Cashiers issue ticket-gated work,
            haircutters run the chair, and managers reconcile payments.
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4ade80]/20">
                <span className="text-[#4ade80] text-xs">✓</span>
              </div>
              <p className="text-xs text-gray-900 dark:text-white">Single location. No branches, no online booking.</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4ade80]/20">
                <span className="text-[#4ade80] text-xs">✓</span>
              </div>
              <p className="text-xs text-gray-900 dark:text-white">Payment at desk: cash, POS, MTN MoMo, Airtel Money.</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4ade80]/20">
                <span className="text-[#4ade80] text-xs">✓</span>
              </div>
              <p className="text-xs text-gray-900 dark:text-white">Ticket-gated service with complete audit trail.</p>
            </div>
          </div>
        </div>

        <div className="animate-scale-in">
          <div className="glass-card rounded-xl p-6">
            <div className="mb-6 text-center">
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">Staff Sign In</h2>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Select your role to access the dashboard</p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2">
              {demos.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => selectDemo(d)}
                  className={`relative overflow-hidden rounded-lg border-2 p-3 text-left transition-all duration-300 ${
                    selectedRole === d.role
                      ? 'border-[#d4af37] bg-[#d4af37]/10'
                      : 'border-gray-200 bg-white hover:border-[#d4af37]/50 dark:border-gray-700 dark:bg-gray-800'
                  }`}
                >
                  <div className="relative">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg gold-gradient">
                      <d.icon className="text-white" size={18} />
                    </div>
                    <p className="text-xs font-semibold capitalize text-gray-900 dark:text-white">{d.role === 'haircutter' ? 'Haircutter' : d.role}</p>
                    <p className="mt-0.5 text-[10px] text-gray-600 dark:text-gray-400">{d.blurb}</p>
                  </div>
                </button>
              ))}
            </div>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                go(email, pin)
              }}
            >
              <Field label="Work Email">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                    autoComplete="username"
                  />
                </div>
              </Field>
              <Field label="PIN">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                  <Input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    type="password"
                    className="pl-9 text-xs"
                    autoComplete="current-password"
                  />
                </div>
              </Field>
              {error ? (
                <div className="rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 p-2 text-xs text-[#ef4444]">
                  {error}
                </div>
              ) : null}
              <Button type="submit" className="w-full text-sm">
                Enter the Floor
                <Scissors size={16} />
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-[#d4af37] transition-colors"
              >
                Forgot PIN?
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] text-gray-600 dark:text-gray-400">
              Demo accounts pre-configured for testing
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
