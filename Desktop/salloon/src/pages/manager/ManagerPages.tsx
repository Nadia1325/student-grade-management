import { useState } from 'react'
import { Download } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Field'
import { KpiCard } from '../../components/ui/KpiCard'
import { AvatarWithStatus } from '../../components/ui/Avatar'
import { elapsed, isToday, money } from '../../lib/utils'
import { useSalon } from '../../store/SalonContext'
import type { Ticket } from '../../types'

function exportToPDF() {
  window.print()
}

export function ManagerFloor() {
  const { state, ticketTotal } = useSalon()
  const chairs = Array.from({ length: state.settings.stations }, (_, i) => i + 1)
  const cutters = state.staff.filter((s) => s.role === 'haircutter')
  const live = state.tickets.filter((t) => t.status === 'in_progress' || t.status === 'queued')
  const waiting = live.filter((t) => t.status === 'queued')
  const idle = cutters.filter((c) => c.status === 'idle' && c.active).length
  const pendingPay = state.tickets.filter((t) => t.status === 'ready').length

  const avgWait = (() => {
    const samples = waiting.map((t) => (Date.now() - new Date(t.createdAt).getTime()) / 60000)
    if (!samples.length) return '0m'
    return `${Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)}m`
  })()

  return (
    <div className="grid gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Manager</p>
          <h1 className="font-display text-2xl font-bold gradient-text">Live floor</h1>
        </div>
        <Button tone="soft" className="gap-2 text-xs" onClick={() => exportToPDF()}>
          <Download size={16} />
          Export PDF
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Avg wait" value={avgWait} />
        <KpiCard label="Idle staff" value={idle} />
        <KpiCard label="Pending payment queue" value={pendingPay} accent />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {chairs.map((n) => {
          const cutter = cutters.find((c) => c.station === n)
          const job = state.tickets.find((t) => t.haircutterId === cutter?.id && t.status === 'in_progress')
          const status = cutter ? (cutter.status === 'idle' ? 'online' : cutter.status === 'busy' ? 'busy' : cutter.status === 'break' ? 'away' : 'offline') : 'offline'
          return (
            <div key={n} className="group glass-card rounded-xl border-2 border-gray-200 p-4 transition-all duration-300 hover:border-[#d4af37]/50 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Chair {n}</p>
                {cutter ? (
                  <Badge
                    tone={cutter.status === 'idle' ? 'idle' : cutter.status === 'busy' ? 'busy' : cutter.status === 'break' ? 'break' : 'offline'}
                  >
                    {cutter.status}
                  </Badge>
                ) : (
                  <Badge tone="offline">Empty</Badge>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                {cutter ? <AvatarWithStatus name={cutter.name} status={status} size="md" /> : <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />}
                <div className="flex-1">
                  <p className="font-display text-sm font-semibold">{cutter?.name ?? 'Unassigned'}</p>
                  {job ? (
                    <p className="mt-1 text-xs">
                      {job.id} · {elapsed(job.acceptedAt ?? job.createdAt)} in service ·{' '}
                      <span className="font-semibold text-[#d4af37]">{money(ticketTotal(job), state.settings.currencySymbol)}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">No active ticket</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-bold">Open restock</h2>
        </CardHeader>
        <CardBody className="grid gap-2">
          {state.restocks.filter((r) => r.status === 'open').length === 0 ? (
            <div className="flex items-center justify-center rounded-lg bg-gray-100 p-6 text-center dark:bg-gray-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">Stations are stocked.</p>
            </div>
          ) : (
            state.restocks
              .filter((r) => r.status === 'open')
              .map((r) => {
                const who = state.staff.find((s) => s.id === r.haircutterId)
                return (
                  <div key={r.id} className="group flex items-center justify-between rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-xs transition-all duration-300 hover:border-[#d4af37]/50 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      {who && <AvatarWithStatus name={who.name} status="away" size="md" />}
                      <span>
                        {who?.name} · {r.items.join(', ')} — {r.note}
                      </span>
                    </div>
                    <Fulfill id={r.id} />
                  </div>
                )
              })
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function Fulfill({ id }: { id: string }) {
  const { fulfillRestock } = useSalon()
  return (
    <Button tone="soft" className="h-8 px-3 py-0 text-xs" onClick={() => fulfillRestock(id)}>
      Fulfill
    </Button>
  )
}

export function ManagerAudit() {
  const { state, ticketTotal, activeShift } = useSalon()
  const [cash, setCash] = useState('')
  const [card, setCard] = useState('')
  const [momo, setMomo] = useState('')

  const paid = state.tickets.filter((t) => t.paymentStatus === 'paid' && t.paidAt && isToday(t.paidAt))
  const system = paid.reduce((s, t) => s + ticketTotal(t), 0)
  const expectedCash = paid.filter((t) => t.paymentChannel === 'cash').reduce((s, t) => s + ticketTotal(t), 0)
  const expectedCard = paid.filter((t) => t.paymentChannel === 'card').reduce((s, t) => s + ticketTotal(t), 0)
  const expectedMomo = paid
    .filter((t) => t.paymentChannel === 'momo_mtn' || t.paymentChannel === 'momo_airtel')
    .reduce((s, t) => s + ticketTotal(t), 0)
  const physical = Number(cash || 0) + Number(card || 0) + Number(momo || 0)
  const variance = physical - system
  const ghost = state.tickets.filter((t) => t.status === 'in_progress' && !t.createdBy)

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-gray-400">Out-of-system payments</p>
          <h1 className="font-display text-4xl">Reconciliation</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Compare the counted takings with paid tickets by payment channel. Enter cash takings without the opening float.
          </p>
        </div>
        <Button tone="soft" className="gap-2 text-xs" onClick={() => exportToPDF()}>
          <Download size={16} />
          Export PDF
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Expected cash" value={money(expectedCash, state.settings.currencySymbol)} />
        <KpiCard label="Expected card" value={money(expectedCard, state.settings.currencySymbol)} />
        <KpiCard label="Expected mobile money" value={money(expectedMomo, state.settings.currencySymbol)} />
        <KpiCard label="System revenue" value={money(system, state.settings.currencySymbol)} />
        <KpiCard label="Physical total" value={money(physical, state.settings.currencySymbol)} />
        <KpiCard label="Variance" value={money(variance, state.settings.currencySymbol)} accent />
      </div>
      <Card>
        <CardHeader>
          <div>
            <h2 className="font-display text-2xl">Drawer count vs tickets</h2>
            {activeShift ? <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Opening float: {money(activeShift.openingFloat, state.settings.currencySymbol)}</p> : null}
          </div>
        </CardHeader>
        <CardBody className="grid gap-3 md:grid-cols-3">
          <Field label={`Cash takings (expected ${money(expectedCash, state.settings.currencySymbol)})`}>
            <Input type="number" value={cash} onChange={(e) => setCash(e.target.value)} />
          </Field>
          <Field label={`Card POS slips (expected ${money(expectedCard, state.settings.currencySymbol)})`}>
            <Input type="number" value={card} onChange={(e) => setCard(e.target.value)} />
          </Field>
          <Field label={`Mobile money (expected ${money(expectedMomo, state.settings.currencySymbol)})`}>
            <Input type="number" value={momo} onChange={(e) => setMomo(e.target.value)} />
          </Field>
        </CardBody>
      </Card>
      {Math.abs(variance) > 0.009 && (cash || card || momo) ? (
        <div className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm">
          Drawer variance: {money(variance, state.settings.currencySymbol)}. Cash {money(Number(cash || 0) - expectedCash, state.settings.currencySymbol)}, card {money(Number(card || 0) - expectedCard, state.settings.currencySymbol)}, mobile money {money(Number(momo || 0) - expectedMomo, state.settings.currencySymbol)}.
        </div>
      ) : (cash || card || momo) ? <p className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">Drawer reconciles with today's paid tickets.</p> : null}
      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-bold">Today's paid tickets</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-gray-600 dark:text-gray-400">
              <tr>
                <th className="pb-2">Ticket</th>
                <th>Haircutter</th>
                <th>Due</th>
                <th>Channel</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {state.tickets.filter((t) => isToday(t.createdAt)).map((t) => {
                const h = state.staff.find((s) => s.id === t.haircutterId)
                return (
                  <tr key={t.id} className="border-t border-line dark:border-white/10">
                    <td className="py-2">{t.id}</td>
                    <td>{h?.name}</td>
                    <td>{money(ticketTotal(t), state.settings.currencySymbol)}</td>
                    <td>{t.paymentChannel ?? '—'}</td>
                    <td>
                      <Badge tone={t.paymentStatus === 'paid' ? 'paid' : t.paymentStatus === 'refunded' ? 'void' : 'unpaid'}>
                        {t.paymentStatus}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
      {ghost.length ? (
        <p className="text-sm text-rose">Unrecorded service alert: {ghost.length} in-progress jobs without a cashier issuer.</p>
      ) : (
        <p className="text-sm text-sage">Ticket gate holding: every live job has a cashier-issued ticket.</p>
      )}
    </div>
  )
}

export function ManagerPayroll() {
  const { state, commissionForPeriod, approvePayout, saveStaff } = useSalon()
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')
  const cutters = state.staff.filter((s) => s.role === 'haircutter' && s.active)
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'weekly') periodStart.setDate(periodStart.getDate() - ((periodStart.getDay() + 6) % 7))
  const periodEnd = new Date(periodStart)
  periodEnd.setDate(periodEnd.getDate() + (period === 'daily' ? 1 : 7))

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-gray-400">Automated commission</p>
        <h1 className="font-display text-4xl">Payroll engine</h1>
      </div>
      <Field label="Payout period">
        <Select value={period} onChange={(event) => setPeriod(event.target.value as 'daily' | 'weekly')}>
          <option value="daily">Today</option>
          <option value="weekly">This week</option>
        </Select>
      </Field>
      <Card>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-gray-600 dark:text-gray-400">
              <tr>
                <th className="pb-2">Haircutter</th>
                <th>Structure</th>
                <th>Clients</th>
                <th>Gross</th>
                <th>Commission</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cutters.map((c) => {
                const calc = commissionForPeriod(c, period)
                const approved = state.payouts.some((p) => {
                  if (p.haircutterId !== c.id || p.period !== period || !p.approved || !p.approvedAt) return false
                  const approvedAt = new Date(p.approvedAt)
                  return approvedAt >= periodStart && approvedAt < periodEnd
                })
                return (
                  <tr key={c.id} className="border-t border-line dark:border-white/10">
                    <td className="py-3">{c.name}</td>
                    <td>
                      <Select
                        className="max-w-40"
                        value={`${c.commissionType}:${c.commissionValue}`}
                        onChange={(e) => {
                          const [type, val] = e.target.value.split(':')
                          saveStaff({
                            ...c,
                            commissionType: type as 'percent' | 'fixed',
                            commissionValue: Number(val),
                          })
                        }}
                      >
                        <option value="percent:35">35% of services</option>
                        <option value="percent:40">40% of services</option>
                        <option value="percent:30">30% of services</option>
                        <option value="fixed:12">₵12 per client</option>
                        <option value="fixed:10">₵10 per client</option>
                      </Select>
                    </td>
                    <td>{calc.clients}</td>
                    <td>{money(calc.revenue, state.settings.currencySymbol)}</td>
                    <td>{money(calc.amount, state.settings.currencySymbol)}</td>
                    <td>
                      <Button tone={approved ? 'soft' : 'primary'} disabled={approved} onClick={() => approvePayout(c.id, period)}>
                        {approved ? `Approved this ${period === 'daily' ? 'day' : 'week'}` : `Authorize ${period} payout`}
                      </Button>
                    </td>
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

export function ManagerOverrides() {
  const { state, voidTicket, refundTicket, adjustPrice, reassignTicket, ticketTotal } = useSalon()
  const [ticketId, setTicketId] = useState(state.tickets[0]?.id ?? '')
  const [reason, setReason] = useState('Client left')
  const [price, setPrice] = useState('')
  const [to, setTo] = useState(state.staff.find((s) => s.role === 'haircutter')?.id ?? '')
  const ticket: Ticket | undefined = state.tickets.find((t) => t.id === ticketId)
  const cutters = state.staff.filter((s) => s.role === 'haircutter' && s.active)

  return (
    <div className="grid max-w-2xl gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-gray-400">Operational overrides</p>
        <h1 className="font-display text-4xl">Voids, refunds, reassign</h1>
      </div>
      <Card>
        <CardBody className="grid gap-4">
          <Field label="Ticket">
            <Select value={ticketId} onChange={(e) => setTicketId(e.target.value)}>
              {state.tickets.slice(0, 40).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} · {t.status} · {money(ticketTotal(t), state.settings.currencySymbol)}
                </option>
              ))}
            </Select>
          </Field>
          {ticket ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {ticket.alias} · {ticket.overrideReason ? `Override: ${ticket.overrideReason}` : 'No price override'}
            </p>
          ) : null}
          <Field label="Reason">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button tone="danger" disabled={!ticket || ticket.status === 'completed' || ticket.status === 'voided' || !reason.trim()} onClick={() => voidTicket(ticketId, reason)}>
              Void ticket
            </Button>
            <Button tone="soft" disabled={!ticket || ticket.paymentStatus !== 'paid' || !reason.trim()} onClick={() => refundTicket(ticketId, reason)}>
              Refund
            </Button>
          </div>
          <Field label="Adjusted total">
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Button disabled={!ticket || ticket.paymentStatus === 'paid' || !price || !Number.isFinite(Number(price)) || Number(price) < 0 || !reason.trim()} onClick={() => adjustPrice(ticketId, Number(price), reason)}>Approve price adjustment</Button>
          <Field label="Reassign queued client">
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              {cutters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.status}
                </option>
              ))}
            </Select>
          </Field>
          <Button tone="soft" disabled={!ticket || ticket.status !== 'queued' || !to} onClick={() => reassignTicket(ticketId, to)}>
            Transfer to another chair
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
