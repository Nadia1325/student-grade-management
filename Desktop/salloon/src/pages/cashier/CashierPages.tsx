import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Field'
import { KpiCard } from '../../components/ui/KpiCard'
import { Modal } from '../../components/ui/Modal'
import { AvatarWithStatus } from '../../components/ui/Avatar'
import { isToday, money } from '../../lib/utils'
import { useSalon } from '../../store/SalonContext'
import type { PaymentChannel, ServiceCategory, StaffStatus, Ticket } from '../../types'

const categories: ServiceCategory[] = ['haircuts', 'shaving', 'dyeing', 'treatments']
const categoryLabel: Record<ServiceCategory, string> = {
  haircuts: 'Haircuts',
  shaving: 'Shaving',
  dyeing: 'Dyeing',
  treatments: 'Treatments',
}
const serviceImages: Record<string, string> = {
  'sv_cut_std': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200&h=200&fit=crop',
  'sv_cut_prem': 'https://images.unsplash.com/photo-1599351432428-7d3b936d9b6c?w=200&h=200&fit=crop',
  'sv_shave_std': 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=200&h=200&fit=crop',
  'sv_shave_prem': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop',
  'sv_dye_std': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=200&h=200&fit=crop',
  'sv_dye_prem': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop',
  'sv_treat_std': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop',
  'sv_treat_prem': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=200&h=200&fit=crop',
}
const statusLabel: Record<StaffStatus, string> = {
  idle: 'Idle',
  busy: 'Busy',
  break: 'On break',
  offline: 'Offline',
}

function statusTone(s: Ticket['status']): 'queued' | 'progress' | 'ready' | 'paid' | 'void' {
  if (s === 'queued') return 'queued'
  if (s === 'in_progress') return 'progress'
  if (s === 'ready') return 'ready'
  if (s === 'completed') return 'paid'
  return 'void'
}

export function CashierDesk() {
  const api = useSalon()
  const { state, me, ticketTotal, createTicket, settlePayment, activeShift } = api
  const [query, setQuery] = useState('')
  const [walkIn, setWalkIn] = useState(true)
  const [alias, setAlias] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>(['sv_cut_std'])
  const [cutter, setCutter] = useState('st_h2')
  const [created, setCreated] = useState<Ticket | null>(null)
  const [settleId, setSettleId] = useState<string | null>(null)
  const [channel, setChannel] = useState<PaymentChannel>('cash')
  const [tendered, setTendered] = useState('50')
  const [ref, setRef] = useState('')

  const today = state.tickets.filter((t) => isToday(t.createdAt))
  const queued = today.filter((t) => t.status === 'queued')
  const inProgress = today.filter((t) => t.status === 'in_progress')
  const ready = today.filter((t) => t.status === 'ready')
  const completed = today.filter((t) => t.status === 'completed')

  const found = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return state.tickets.find((t) => t.id.toLowerCase().includes(q) || t.alias.toLowerCase().includes(q))
  }, [query, state.tickets])

  const cutters = state.staff.filter((s) => s.role === 'haircutter' && s.active)
  const services = state.services.filter((s) => s.active)
  const selectedActiveServices = selectedServices.filter((id) => services.some((service) => service.id === id))
  const assignedCutterId = cutters.some((staff) => staff.id === cutter) ? cutter : cutters[0]?.id ?? ''
  const settleTicket = state.tickets.find((t) => t.id === settleId)
  const due = settleTicket ? ticketTotal(settleTicket) : 0
  const enabled = state.settings.channels
  const availableChannels = (Object.keys(enabled) as PaymentChannel[]).filter((item) => enabled[item])
  const activeChannel = enabled[channel] ? channel : availableChannels[0] ?? 'cash'
  const change = activeChannel === 'cash' ? Math.max(0, Number(tendered || 0) - due) : 0

  function toggleService(serviceId: string) {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    )
  }

  return (
    <div className="grid gap-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Cashier / front desk</p>
          <h1 className="font-display text-2xl font-bold gradient-text">Dispatch & billing</h1>
        </div>
        <div className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs transition-all duration-300 ${activeShift ? 'border-[#4ade80]/50 bg-[#4ade80]/10' : 'border-[#ef4444]/50 bg-[#ef4444]/10'}`}>
          <span className={`h-2 w-2 rounded-full ${activeShift ? 'bg-[#4ade80] animate-pulse' : 'bg-[#ef4444]'}`} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Shift</p>
            <p className="text-xs font-medium">
              {activeShift ? `Open · float ${money(activeShift.openingFloat, state.settings.currencySymbol)}` : 'Closed — open the register'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tickets today" value={today.length} hint={`${me?.name} on desk`} />
        <KpiCard label="Queued" value={queued.length} accent />
        <KpiCard label="In progress" value={inProgress.length} />
        <KpiCard label="Completed" value={completed.length} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
        <Input
          className="pl-10"
          placeholder="Look up ticket — e.g. #025"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {found ? (
          <div className="mt-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800">
            <span className="font-medium">{found.id}</span> · {found.alias} · {found.status.replace('_', ' ')} ·{' '}
            {money(ticketTotal(found), state.settings.currencySymbol)}
            {found.status === 'ready' && found.paymentStatus === 'unpaid' ? (
              <Button className="ml-3 h-8 px-3 py-0 text-xs" onClick={() => setSettleId(found.id)}>
                Settle
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-display text-2xl">Create service ticket</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Walk-in alias optional. Haircutter cannot start without this ticket.</p>
            </div>
          </CardHeader>
          <CardBody className="grid gap-5">
            <div className="flex rounded-full bg-gray-200 p-1 dark:bg-gray-700">
              <button
                className={`flex-1 rounded-full py-2 text-sm ${walkIn ? 'bg-[#d4af37] text-white' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setWalkIn(true)}
              >
                Standard walk-in
              </button>
              <button
                className={`flex-1 rounded-full py-2 text-sm ${!walkIn ? 'bg-[#d4af37] text-white' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setWalkIn(false)}
              >
                Named alias
              </button>
            </div>
            {!walkIn ? (
              <Field label="Client alias (no personal records)">
                <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="e.g. Uncle Joe" />
              </Field>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((cat) => (
                <div key={cat} className="animate-fade-in">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">{categoryLabel[cat]}</p>
                  <div className="grid gap-2">
                    {services
                      .filter((s) => s.category === cat)
                      .map((s) => {
                        const on = selectedServices.includes(s.id)
                        const imageUrl = serviceImages[s.id] || 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200&h=200&fit=crop'
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleService(s.id)}
                            className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-all duration-300 ${
                              on
                                ? 'border-[#d4af37] bg-[#d4af37]/10'
                                : 'border-gray-200 bg-white hover:border-[#d4af37]/50 dark:border-gray-700 dark:bg-gray-800'
                            }`}
                          >
                            <img
                              src={imageUrl}
                              alt={s.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <span className="flex-1 font-medium">{s.name}</span>
                            <span className="font-semibold text-[#d4af37]">{money(s.price, state.settings.currencySymbol)}</span>
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>

            <Field label="Haircutter">
              <div className="grid gap-2">
                {cutters.map((c) => {
                  const status = c.status === 'idle' ? 'online' : c.status === 'busy' ? 'busy' : c.status === 'break' ? 'away' : 'offline'
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCutter(c.id)}
                      className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all duration-300 hover:scale-105 ${
                        assignedCutterId === c.id
                          ? 'border-[#d4af37] bg-[#d4af37]/10'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#d4af37]/50'
                      }`}
                    >
                      <AvatarWithStatus name={c.name} status={status} size="md" />
                      <div className="flex-1">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Station {c.station} · {statusLabel[c.status]}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Next ID {(() => {
                  const seq = state.tickets.reduce((m, t) => Math.max(m, t.sequence), 0) + 1
                  return `#${String(seq).padStart(3, '0')}`
                })()} · starts as Queued / Unpaid
              </p>
              <Button
                disabled={!selectedActiveServices.length || !activeShift || !assignedCutterId}
                onClick={() => {
                  const t = createTicket({ alias, walkIn, serviceIds: selectedActiveServices, haircutterId: assignedCutterId })
                  setCreated(t)
                  setAlias('')
                }}
              >
                Issue ticket & notify station
              </Button>
            </div>
            {!activeShift ? <p className="text-sm text-[#ef4444]">Open the shift register before issuing tickets.</p> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-bold">Ready for settlement</h2>
          </CardHeader>
          <CardBody className="grid gap-2">
            {ready.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg bg-white dark:bg-gray-900 p-6 text-center">
                <div>
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37]/10">
                    <Search className="text-[#d4af37]" size={20} />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">No completed unpaid tickets. Clients return here after the chair.</p>
                </div>
              </div>
            ) : (
              ready.map((t) => (
                <div key={t.id} className="group flex items-center justify-between rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 transition-all duration-300 hover:border-[#d4af37]/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4ade80]/10">
                      <span className="text-[#4ade80] font-display text-sm">{t.id.replace('#', '')}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium">{t.alias}</p>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">{money(ticketTotal(t), state.settings.currencySymbol)}</p>
                    </div>
                  </div>
                  <Button onClick={() => setSettleId(t.id)} className="text-xs">
                    Take payment
                  </Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={Boolean(created)}
        title={`Ticket ${created?.id ?? ''}`}
        onClose={() => setCreated(null)}
        footer={<Button onClick={() => setCreated(null)}>Hand to client</Button>}
      >
        {created ? (
          <div className="rounded-2xl border border-dashed border-copper/50 p-5 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">Present at the chair</p>
            <p className="mt-3 font-display text-6xl">{created.id}</p>
            <p className="mt-2 text-sm text-ink-soft">
              {created.alias} · queued · unpaid until desk settlement
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(settleTicket)}
        title={`Settle ${settleTicket?.id ?? ''}`}
        onClose={() => setSettleId(null)}
        footer={
          <Button
            disabled={
              !activeShift ||
              !availableChannels.length ||
              (activeChannel === 'cash' && Number(tendered) < due) ||
              ((activeChannel === 'momo_mtn' || activeChannel === 'momo_airtel') && !ref.trim())
            }
            onClick={() => {
              if (!settleTicket) return
              settlePayment(settleTicket.id, activeChannel, {
                cashTendered: activeChannel === 'cash' ? Number(tendered) : undefined,
                paymentRef: ref || undefined,
              })
              setSettleId(null)
              setRef('')
            }}
          >
            Process payment
          </Button>
        }
      >
        {settleTicket ? (
          <div className="grid gap-4">
            <ul className="grid gap-1 text-sm">
              {settleTicket.serviceIds.map((id) => {
                const s = state.services.find((x) => x.id === id)
                return (
                  <li key={id} className="flex justify-between">
                    <span>{s?.name}</span>
                    <span>{money(s?.price ?? 0, state.settings.currencySymbol)}</span>
                  </li>
                )
              })}
            </ul>
            <p className="flex justify-between font-medium">
              <span>Due</span>
              <span>{money(due, state.settings.currencySymbol)}</span>
            </p>
            <Field label="Payment channel">
              <Select value={activeChannel} onChange={(e) => setChannel(e.target.value as PaymentChannel)} disabled={!availableChannels.length}>
                {enabled.cash ? <option value="cash">Cash (change calculator)</option> : null}
                {enabled.card ? <option value="card">External card POS</option> : null}
                {enabled.momo_mtn ? <option value="momo_mtn">MTN MoMo</option> : null}
                {enabled.momo_airtel ? <option value="momo_airtel">Airtel Money</option> : null}
              </Select>
            </Field>
            {!availableChannels.length ? <p className="text-sm text-rose">Enable at least one payment channel in salon settings.</p> : null}
            {activeChannel === 'cash' ? (
              <>
                <Field label="Cash tendered">
                  <Input type="number" value={tendered} onChange={(e) => setTendered(e.target.value)} />
                </Field>
                <p className="text-sm">
                  Change due:{' '}
                  <span className="font-medium">{money(change, state.settings.currencySymbol)}</span>
                </p>
              </>
            ) : null}
            {activeChannel === 'momo_mtn' || activeChannel === 'momo_airtel' ? (
              <Field label="Transaction reference">
                <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. MTN-9901" />
              </Field>
            ) : null}
            <p className="text-xs text-ink-soft">Marks ticket Completed / Paid and chimes the haircutter station.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export function QueueBoard() {
  const { state, ticketTotal } = useSalon()
  const today = state.tickets.filter((t) => isToday(t.createdAt) && t.status !== 'voided' && t.status !== 'completed')
  const cols = [
    { key: 'queued', title: 'Queued · unpaid', items: today.filter((t) => t.status === 'queued') },
    { key: 'in_progress', title: 'In progress · unpaid', items: today.filter((t) => t.status === 'in_progress') },
    { key: 'ready', title: 'Ready for settlement', items: today.filter((t) => t.status === 'ready') },
  ] as const

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-gray-400">Live queue</p>
        <h1 className="font-display text-4xl">Salon board</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {cols.map((col) => (
          <div key={col.key} className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium">{col.title}</h2>
              <Badge tone={col.key === 'queued' ? 'queued' : col.key === 'ready' ? 'ready' : 'progress'}>
                {col.items.length}
              </Badge>
            </div>
            <div className="grid gap-3">
              {col.items.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Empty lane</p>
              ) : (
                col.items.map((t) => {
                  const cutter = state.staff.find((s) => s.id === t.haircutterId)
                  return (
                    <div key={t.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-2xl">{t.id}</p>
                        <Badge tone={statusTone(t.status)}>{t.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="mt-1 text-sm">{t.alias}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {cutter?.name} · st. {cutter?.station} · {money(ticketTotal(t), state.settings.currencySymbol)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ShiftRegister() {
  const { state, activeShift, openShift, closeShift, ticketTotal } = useSalon()
  const [float, setFloat] = useState('200')
  const [cash, setCash] = useState('')
  const [card, setCard] = useState('')
  const [momo, setMomo] = useState('')
  const [note, setNote] = useState('')

  const paidThisShift = state.tickets.filter((t) =>
    t.paymentStatus === 'paid' && t.paidAt && activeShift &&
    new Date(t.paidAt) >= new Date(activeShift.openedAt),
  )
  const by = (ch: PaymentChannel) => paidThisShift.filter((t) => t.paymentChannel === ch).reduce((s, t) => s + ticketTotal(t), 0)
  const expectedCash = by('cash')
  const expectedCard = by('card')
  const expectedMomo = by('momo_mtn') + by('momo_airtel')
  const system = expectedCash + expectedCard + expectedMomo
  const closeVariance = Number(cash || 0) - (activeShift?.openingFloat ?? 0) + Number(card || 0) + Number(momo || 0) - system
  const closeValuesValid = [cash, card, momo].every((value) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0)

  return (
    <div className="grid max-w-3xl gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Drawer</p>
        <h1 className="font-display text-4xl">Shift opening & close</h1>
      </div>
      <Card>
        <CardBody className="grid gap-4">
          {activeShift ? (
            <>
              <p className="text-sm">
                System sales this shift: {money(system, state.settings.currencySymbol)}. Opening float {money(activeShift.openingFloat, state.settings.currencySymbol)} is counted separately.
              </p>
              <p className="text-xs text-ink-soft">
                Cash {money(by('cash'), state.settings.currencySymbol)} · Card {money(by('card'), state.settings.currencySymbol)} · MoMo{' '}
                {money(by('momo_mtn') + by('momo_airtel'), state.settings.currencySymbol)}
              </p>
              <Field label="Physical cash counted">
                <Input type="number" min="0" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} />
              </Field>
              <Field label="Card POS slip total">
                <Input type="number" min="0" step="0.01" value={card} onChange={(e) => setCard(e.target.value)} />
              </Field>
              <Field label="Mobile money receipts">
                <Input type="number" min="0" step="0.01" value={momo} onChange={(e) => setMomo(e.target.value)} />
              </Field>
              <Field label="Close note">
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              {closeValuesValid ? (
                <p className={`rounded-xl border px-3 py-2 text-sm ${Math.abs(closeVariance) < 0.01 ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400' : 'border-rose/40 bg-rose/10 text-rose'}`}>
                  {Math.abs(closeVariance) < 0.01 ? 'Drawer reconciles.' : `Drawer variance: ${money(closeVariance, state.settings.currencySymbol)}.`} Cash sales are calculated after subtracting the opening float.
                </p>
              ) : null}
              <Button disabled={!closeValuesValid} onClick={() => closeShift(Number(cash), Number(card), Number(momo), note)}>Close shift</Button>
            </>
          ) : (
            <>
              <Field label="Opening cash float">
                <Input type="number" min="0" step="0.01" value={float} onChange={(e) => setFloat(e.target.value)} />
              </Field>
              <Button disabled={!float.trim() || !Number.isFinite(Number(float)) || Number(float) < 0} onClick={() => openShift(Number(float))}>Open shift</Button>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
