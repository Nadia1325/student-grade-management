import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Field'
import { KpiCard } from '../../components/ui/KpiCard'
import { AvatarWithStatus } from '../../components/ui/Avatar'
import { elapsed, formatTime, isToday, money } from '../../lib/utils'
import { useSalon } from '../../store/SalonContext'
import type { StaffStatus } from '../../types'

const supplies = ['blades', 'towels', 'gel', 'cape', 'aftershave']

export function StylistStation() {
  const { me, state, acceptTicket, completeService, setStaffStatus, requestRestock, ticketTotal, commissionFor } =
    useSalon()
  const [now, setNow] = useState(() => Date.now())
  const [picked, setPicked] = useState<string[]>(['blades'])
  const [note, setNote] = useState('')
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const mine = state.tickets.filter((t) => t.haircutterId === me?.id)
  const incoming = mine.filter((t) => t.status === 'queued')
  const active = mine.find((t) => t.status === 'in_progress')
  const todayDone = mine.filter((t) => t.status === 'completed' && t.completedAt && isToday(t.completedAt))
  const pay = me ? commissionFor(me) : { clients: 0, revenue: 0, amount: 0 }

  const notesForMe = state.notifications.filter((n) => n.targetStaffId === me?.id && !n.read)

  useEffect(() => {
    if (notesForMe[0]) setBanner(`${notesForMe[0].title} — ${notesForMe[0].body}`)
  }, [notesForMe])

  if (!me) return null

  return (
    <div className="grid gap-5 animate-fade-in">
      {banner ? (
        <div className="ticket-pulse rounded-lg border-2 border-[#d4af37] bg-[#d4af37]/15 px-4 py-2 text-xs">
          {banner}
          <button className="ml-3 underline" onClick={() => setBanner(null)}>
            dismiss
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <AvatarWithStatus name={me.name} status={me.status === 'idle' ? 'online' : me.status === 'busy' ? 'busy' : me.status === 'break' ? 'away' : 'offline'} size="lg" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Haircutter station {me.station}</p>
            <h1 className="font-display text-xl font-bold gradient-text">{me.name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['idle', 'break', 'offline'] as StaffStatus[]).map((s) => (
            <Button key={s} tone={me.status === s ? 'primary' : 'soft'} onClick={() => setStaffStatus(me.id, s)} className="text-xs">
              {s === 'idle' ? 'Available' : s === 'break' ? 'On break' : 'Offline'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Clients today" value={pay.clients} />
        <KpiCard label="Shift commission" value={money(pay.amount, state.settings.currencySymbol)} accent />
        <KpiCard label="Station status" value={me.status === 'idle' ? 'Available' : me.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-display text-2xl">Incoming tickets</h2>
          </CardHeader>
          <CardBody className="grid gap-3">
            {incoming.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No queued work. You cannot start a job without a cashier ticket.</p>
            ) : (
              incoming.map((t) => (
                <div key={t.id} className="ticket-pulse rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-3xl">{t.id}</p>
                    <Badge tone="queued">Queued</Badge>
                  </div>
                  <p className="mt-1 text-sm">{t.alias}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t.serviceIds.map((id) => state.services.find((s) => s.id === id)?.name).join(', ')}
                  </p>
                  <Button className="mt-3 w-full" onClick={() => acceptTicket(t.id)} disabled={Boolean(active)}>
                    Accept & start service
                  </Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-2xl">Active chair</h2>
          </CardHeader>
          <CardBody>
            {active ? (
              <div>
                <p className="font-display text-5xl">{active.id}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{active.alias}</p>
                <p className="mt-4 font-display text-3xl">
                  {elapsed(active.acceptedAt ?? active.createdAt, new Date(now).toISOString())}
                </p>
                <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Elapsed service time</p>
                <ul className="mt-4 grid gap-1 text-sm">
                  {active.serviceIds.map((id) => {
                    const s = state.services.find((x) => x.id === id)
                    return <li key={id}>{s?.name}</li>
                  })}
                </ul>
                <Button className="mt-5 w-full" onClick={() => completeService(active.id)}>
                  Mark completed · send to desk
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No client in the chair.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display text-2xl">Supply restock</h2>
        </CardHeader>
        <CardBody className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {supplies.map((item) => {
              const on = picked.includes(item)
              return (
                <button
                  key={item}
                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== item) : [...p, item]))}
                  className={`rounded-full border px-3 py-1.5 text-sm capitalize ${on ? 'border-[#d4af37] bg-[#d4af37]/15' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  {item}
                </button>
              )
            })}
          </div>
          <Field label="Note to management">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Station running low…" />
          </Field>
          <Button tone="soft" onClick={() => requestRestock(picked, note)}>
            Send restock request
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-2xl">Shift history</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="pb-2">Ticket</th>
                <th className="pb-2">Service</th>
                <th className="pb-2">Done</th>
                <th className="pb-2">Payout</th>
              </tr>
            </thead>
            <tbody>
              {todayDone.map((t) => {
                const share =
                  me.commissionType === 'fixed'
                    ? me.commissionValue
                    : (ticketTotal(t) * me.commissionValue) / 100
                return (
                  <tr key={t.id} className="border-t border-line dark:border-white/10">
                    <td className="py-2">{t.id}</td>
                    <td>{t.serviceIds.map((id) => state.services.find((s) => s.id === id)?.name).join(', ')}</td>
                    <td>{t.completedAt ? formatTime(t.completedAt) : '—'}</td>
                    <td>{money(share, state.settings.currencySymbol)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  )
}

export function StylistAnalytics() {
  const { me, state, ticketTotal } = useSalon()
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const mine = state.tickets.filter((t) => t.haircutterId === me?.id && t.paymentStatus === 'paid' && t.status === 'completed')
  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekTickets = mine.filter((ticket) => {
    const paidAt = new Date(ticket.paidAt ?? ticket.completedAt ?? ticket.createdAt)
    return paidAt >= weekStart && paidAt < weekEnd
  })
  const todayTickets = mine.filter((ticket) => isToday(ticket.paidAt ?? ticket.completedAt ?? ticket.createdAt))
  const monthTickets = mine.filter((ticket) => {
    const paidAt = new Date(ticket.paidAt ?? ticket.completedAt ?? ticket.createdAt)
    return paidAt.getFullYear() === now.getFullYear() && paidAt.getMonth() === now.getMonth()
  })
  const periodTickets = view === 'daily' ? todayTickets : view === 'weekly' ? weekTickets : monthTickets
  const periodRevenue = periodTickets.reduce((sum, ticket) => sum + ticketTotal(ticket), 0)
  const periodCommission = me
    ? periodTickets.reduce((sum, ticket) => sum + (me.commissionType === 'fixed' ? me.commissionValue : ticketTotal(ticket) * me.commissionValue / 100), 0)
    : 0
  const periodStart = view === 'daily' ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : view === 'weekly' ? weekStart : new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = view === 'daily' ? new Date(periodStart.getTime() + 24 * 60 * 60_000) : view === 'weekly' ? weekEnd : new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const approvedCommission = state.payouts
    .filter((payout) => payout.haircutterId === me?.id && payout.approved && payout.approvedAt)
    .filter((payout) => {
      const approvedAt = new Date(payout.approvedAt!)
      return approvedAt >= periodStart && approvedAt < periodEnd
    })
    .reduce((sum, payout) => sum + payout.amount, 0)
  const pendingCommission = Math.max(0, periodCommission - approvedCommission)

  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + index)
      return {
        day: day.toLocaleDateString(undefined, { weekday: 'short' }),
        clients: weekTickets.filter((ticket) => {
          const paidAt = new Date(ticket.paidAt ?? ticket.completedAt ?? ticket.createdAt)
          return paidAt.getFullYear() === day.getFullYear() && paidAt.getMonth() === day.getMonth() && paidAt.getDate() === day.getDate()
        }).length,
      }
    })
  }, [weekTickets, weekStart])

  const peakHour = weekTickets.reduce<Record<number, number>>((counts, ticket) => {
    if (!ticket.completedAt) return counts
    const hour = new Date(ticket.completedAt).getHours()
    counts[hour] = (counts[hour] ?? 0) + 1
    return counts
  }, {})
  const busiestHour = Object.entries(peakHour).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0]

  if (!me) return null

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Performance</p>
        <h1 className="font-display text-4xl">Your numbers</h1>
      </div>
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map((v) => (
          <Button key={v} tone={view === v ? 'primary' : 'soft'} onClick={() => setView(v)}>
            {v}
          </Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label={`Clients ${view === 'daily' ? 'today' : view === 'weekly' ? 'this week' : 'this month'}`} value={periodTickets.length} />
        <KpiCard label="Revenue contribution" value={money(periodRevenue, state.settings.currencySymbol)} />
        <KpiCard label="Commission pending approval" value={money(pendingCommission, state.settings.currencySymbol)} hint="Paid tickets less approved payouts" accent />
      </div>
      {view === 'weekly' ? (
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-display text-2xl">Client volume this week</h2>
              <p className="mt-1 text-xs text-ink-soft">Weekly commission pending approval: {money(pendingCommission, state.settings.currencySymbol)}{busiestHour !== undefined ? ` · busiest completion hour ${String(busiestHour).padStart(2, '0')}:00` : ''}</p>
            </div>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="clients" fill="#c4894a" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      ) : null}
      {view === 'daily' ? (
        <Card>
          <CardBody className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase text-ink-soft">
                <tr>
                  <th className="pb-2">Ticket</th>
                  <th>Service</th>
                  <th>Time</th>
                  <th>Earned</th>
                </tr>
              </thead>
              <tbody>
                {todayTickets.map((t) => (
                  <tr key={t.id} className="border-t border-line dark:border-white/10">
                    <td className="py-2">{t.id}</td>
                    <td>{t.serviceIds.map((id) => state.services.find((s) => s.id === id)?.name).join(', ')}</td>
                    <td>{t.completedAt ? formatTime(t.completedAt) : '—'}</td>
                    <td>
                      {money(
                        me.commissionType === 'fixed' ? me.commissionValue : (ticketTotal(t) * me.commissionValue) / 100,
                        state.settings.currencySymbol,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      ) : null}
      {view === 'monthly' ? (
        <Card>
          <CardBody>
            <p className="text-sm text-ink-soft">Historical payouts approved by the floor manager.</p>
            <ul className="mt-4 grid gap-2">
              {state.payouts.filter((p) => p.haircutterId === me.id).length === 0 ? (
                <li className="text-sm">No approved payroll logs yet this month.</li>
              ) : (
                state.payouts
                  .filter((p) => p.haircutterId === me.id)
                  .map((p) => (
                    <li key={p.id} className="flex justify-between rounded-xl border border-line px-3 py-2 text-sm dark:border-white/10">
                      <span>
                        {p.clients} clients · {p.period}
                      </span>
                      <span>{money(p.amount, state.settings.currencySymbol)}</span>
                    </li>
                  ))
              )}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}
