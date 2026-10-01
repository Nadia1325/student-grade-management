import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { seedAudit, seedServices, seedShift, seedStaff, seedTickets, defaultSettings } from '../data/seed'
import { chime, isToday, money, padTicket, todayKey, uid } from '../lib/utils'
import type {
  AppNotification,
  AuditEntry,
  PaymentChannel,
  Payout,
  Role,
  SalonSettings,
  SalonState,
  Service,
  Staff,
  StaffStatus,
  Ticket,
} from '../types'

const STORAGE_KEY = 'salloon.v1'

function ticketTotal(ticket: Ticket, services: Service[]) {
  if (typeof ticket.priceOverride === 'number') return ticket.priceOverride
  return ticket.serviceIds.reduce((sum, id) => {
    const s = services.find((x) => x.id === id)
    return sum + (s?.price ?? 0)
  }, 0)
}

function commissionFor(staff: Staff, tickets: Ticket[], services: Service[]) {
  const done = tickets.filter(
    (t) => t.haircutterId === staff.id && t.status === 'completed' && t.paymentStatus === 'paid' && isToday(t.paidAt ?? t.completedAt ?? t.createdAt),
  )
  const revenue = done.reduce((s, t) => s + ticketTotal(t, services), 0)
  const clients = done.length
  const amount =
    staff.commissionType === 'fixed' ? clients * staff.commissionValue : (revenue * staff.commissionValue) / 100
  return { clients, revenue, amount }
}

function commissionForPeriod(staff: Staff, tickets: Ticket[], services: Service[], period: 'daily' | 'weekly') {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'weekly') start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const end = new Date(start)
  end.setDate(end.getDate() + (period === 'daily' ? 1 : 7))
  const done = tickets.filter((ticket) => {
    const paidAt = ticket.paidAt ? new Date(ticket.paidAt) : null
    return ticket.haircutterId === staff.id && ticket.status === 'completed' && ticket.paymentStatus === 'paid' && paidAt && paidAt >= start && paidAt < end
  })
  const revenue = done.reduce((sum, ticket) => sum + ticketTotal(ticket, services), 0)
  const clients = done.length
  const amount = staff.commissionType === 'fixed' ? clients * staff.commissionValue : revenue * staff.commissionValue / 100
  return { clients, revenue, amount }
}

function hydrate(): SalonState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SalonState
      if (parsed?.staff?.length) return { ...parsed, sessionStaffId: parsed.sessionStaffId ?? null }
    }
  } catch {
    /* ignore */
  }
  return {
    settings: defaultSettings,
    staff: seedStaff,
    services: seedServices,
    tickets: seedTickets,
    shifts: [seedShift],
    restocks: [
      {
        id: uid('rs'),
        haircutterId: 'st_h1',
        items: ['blades', 'towels'],
        note: 'Station 1 running low on towels',
        createdAt: new Date(Date.now() - 40 * 60_000).toISOString(),
        status: 'open',
      },
    ],
    audit: seedAudit,
    notifications: [
      {
        id: uid('nt'),
        at: new Date().toISOString(),
        title: 'Floor is live',
        body: 'Two chairs in service. Ticket #026 is ready for settlement.',
        targetRole: 'cashier',
        tone: 'info',
        read: false,
      },
    ],
    payouts: [],
    sessionStaffId: null,
  }
}

type Action =
  | { type: 'hydrate'; state: SalonState }
  | { type: 'login'; staffId: string }
  | { type: 'logout' }
  | { type: 'audit'; entry: AuditEntry }
  | { type: 'notify'; note: AppNotification }
  | { type: 'markRead'; id: string }
  | { type: 'setStaffStatus'; staffId: string; status: StaffStatus }
  | { type: 'createTicket'; ticket: Ticket }
  | { type: 'patchTicket'; id: string; patch: Partial<Ticket> }
  | { type: 'openShift'; cashierId: string; openingFloat: number }
  | { type: 'closeShift'; countedCash: number; countedCardSlips: number; countedMomo: number; note?: string }
  | { type: 'restock'; haircutterId: string; items: string[]; note: string }
  | { type: 'fulfillRestock'; id: string }
  | { type: 'saveSettings'; settings: SalonSettings }
  | { type: 'saveStaff'; staff: Staff }
  | { type: 'saveService'; service: Service }
  | { type: 'approvePayout'; payout: Payout }

function reducer(state: SalonState, action: Action): SalonState {
  switch (action.type) {
    case 'hydrate':
      return action.state
    case 'login':
      return { ...state, sessionStaffId: action.staffId }
    case 'logout':
      return { ...state, sessionStaffId: null }
    case 'audit':
      return { ...state, audit: [action.entry, ...state.audit].slice(0, 400) }
    case 'notify':
      return { ...state, notifications: [action.note, ...state.notifications].slice(0, 80) }
    case 'markRead':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      }
    case 'setStaffStatus':
      return {
        ...state,
        staff: state.staff.map((s) => (s.id === action.staffId ? { ...s, status: action.status } : s)),
      }
    case 'createTicket':
      return { ...state, tickets: [action.ticket, ...state.tickets] }
    case 'patchTicket':
      return {
        ...state,
        tickets: state.tickets.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      }
    case 'openShift':
      return {
        ...state,
        shifts: [
          {
            id: uid('sh'),
            cashierId: action.cashierId,
            openedAt: new Date().toISOString(),
            openingFloat: action.openingFloat,
          },
          ...state.shifts.map((s) => (s.closedAt ? s : { ...s, closedAt: new Date().toISOString() })),
        ],
      }
    case 'closeShift': {
      const open = state.shifts.find((s) => !s.closedAt)
      if (!open) return state
      return {
        ...state,
        shifts: state.shifts.map((s) =>
          s.id === open.id
            ? {
                ...s,
                closedAt: new Date().toISOString(),
                countedCash: action.countedCash,
                countedCardSlips: action.countedCardSlips,
                countedMomo: action.countedMomo,
                note: action.note,
              }
            : s,
        ),
      }
    }
    case 'restock':
      return {
        ...state,
        restocks: [
          {
            id: uid('rs'),
            haircutterId: action.haircutterId,
            items: action.items,
            note: action.note,
            createdAt: new Date().toISOString(),
            status: 'open',
          },
          ...state.restocks,
        ],
      }
    case 'fulfillRestock':
      return {
        ...state,
        restocks: state.restocks.map((r) => (r.id === action.id ? { ...r, status: 'fulfilled' } : r)),
      }
    case 'saveSettings':
      return { ...state, settings: action.settings }
    case 'saveStaff': {
      const exists = state.staff.some((s) => s.id === action.staff.id)
      return {
        ...state,
        staff: exists
          ? state.staff.map((s) => (s.id === action.staff.id ? action.staff : s))
          : [action.staff, ...state.staff],
      }
    }
    case 'saveService': {
      const exists = state.services.some((s) => s.id === action.service.id)
      return {
        ...state,
        services: exists
          ? state.services.map((s) => (s.id === action.service.id ? action.service : s))
          : [action.service, ...state.services],
      }
    }
    case 'approvePayout': {
      const exists = state.payouts.some((p) => p.id === action.payout.id)
      return {
        ...state,
        payouts: exists
          ? state.payouts.map((p) => (p.id === action.payout.id ? action.payout : p))
          : [action.payout, ...state.payouts],
      }
    }
    default:
      return state
  }
}

interface SalonApi {
  state: SalonState
  me: Staff | null
  ticketTotal: (t: Ticket) => number
  login: (email: string, pin: string) => Staff | null
  logout: () => void
  log: (action: string, detail: string) => void
  notify: (note: Omit<AppNotification, 'id' | 'at' | 'read'>) => void
  markRead: (id: string) => void
  setStaffStatus: (staffId: string, status: StaffStatus) => void
  createTicket: (input: {
    alias: string
    walkIn: boolean
    serviceIds: string[]
    haircutterId: string
  }) => Ticket
  acceptTicket: (id: string) => void
  completeService: (id: string) => void
  settlePayment: (id: string, channel: PaymentChannel, extras?: { paymentRef?: string; cashTendered?: number }) => void
  voidTicket: (id: string, reason: string) => void
  refundTicket: (id: string, reason: string) => void
  adjustPrice: (id: string, price: number, reason: string) => void
  reassignTicket: (id: string, haircutterId: string) => void
  openShift: (openingFloat: number) => void
  closeShift: (countedCash: number, countedCardSlips: number, countedMomo: number, note?: string) => void
  requestRestock: (items: string[], note: string) => void
  fulfillRestock: (id: string) => void
  saveSettings: (settings: SalonSettings) => void
  saveStaff: (staff: Staff) => void
  saveService: (service: Service) => void
  approvePayout: (haircutterId: string, period: 'daily' | 'weekly') => void
  commissionFor: (staff: Staff) => { clients: number; revenue: number; amount: number }
  commissionForPeriod: (staff: Staff, period: 'daily' | 'weekly') => { clients: number; revenue: number; amount: number }
  activeShift: SalonState['shifts'][number] | undefined
}

const Ctx = createContext<SalonApi | null>(null)

export function SalonProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, hydrate)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    function syncFromOtherTab(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const incoming = JSON.parse(event.newValue) as SalonState
        if (incoming?.staff?.length && incoming.settings && Array.isArray(incoming.tickets)) {
          dispatch({ type: 'hydrate', state: { ...incoming, sessionStaffId: state.sessionStaffId } })
        }
      } catch {
        // Ignore storage events that do not contain a valid Salloon snapshot.
      }
    }
    window.addEventListener('storage', syncFromOtherTab)
    return () => window.removeEventListener('storage', syncFromOtherTab)
  }, [state.sessionStaffId])

  const me = useMemo(
    () => state.staff.find((s) => s.id === state.sessionStaffId) ?? null,
    [state.staff, state.sessionStaffId],
  )

  const total = useCallback((t: Ticket) => ticketTotal(t, state.services), [state.services])

  const log = useCallback(
    (action: string, detail: string) => {
      dispatch({
        type: 'audit',
        entry: {
          id: uid('au'),
          at: new Date().toISOString(),
          actorId: state.sessionStaffId ?? 'system',
          action,
          detail,
        },
      })
    },
    [state.sessionStaffId],
  )

  const notify = useCallback((note: Omit<AppNotification, 'id' | 'at' | 'read'>) => {
    dispatch({
      type: 'notify',
      note: { ...note, id: uid('nt'), at: new Date().toISOString(), read: false },
    })
    if (note.tone === 'alert' || note.tone === 'success') chime()
  }, [])

  const api = useMemo<SalonApi>(() => {
    return {
      state,
      me,
      ticketTotal: total,
      login: (email, pin) => {
        const staff = state.staff.find(
          (s) => s.active && s.email.toLowerCase() === email.toLowerCase() && s.pin === pin,
        )
        if (!staff) return null
        dispatch({ type: 'login', staffId: staff.id })
        dispatch({
          type: 'audit',
          entry: {
            id: uid('au'),
            at: new Date().toISOString(),
            actorId: staff.id,
            action: 'auth.login',
            detail: `${staff.name} signed in`,
          },
        })
        return staff
      },
      logout: () => {
        if (me) log('auth.logout', `${me.name} signed out`)
        dispatch({ type: 'logout' })
      },
      log,
      notify,
      markRead: (id) => dispatch({ type: 'markRead', id }),
      setStaffStatus: (staffId, status) => {
        dispatch({ type: 'setStaffStatus', staffId, status })
        log('staff.status', `${staffId} → ${status}`)
      },
      createTicket: ({ alias, walkIn, serviceIds, haircutterId }) => {
        if (me?.role !== 'cashier' || !state.shifts.some((shift) => !shift.closedAt)) {
          throw new Error('An open cashier shift is required to create a ticket.')
        }
        if (!serviceIds.length || serviceIds.some((id) => !state.services.some((service) => service.id === id && service.active))) {
          throw new Error('Select at least one active service.')
        }
        const assignedCutter = state.staff.find((staff) => staff.id === haircutterId && staff.role === 'haircutter' && staff.active)
        if (!assignedCutter) throw new Error('Select an active haircutter.')
        const seq = state.tickets.reduce((m, t) => Math.max(m, t.sequence), 0) + 1
        const ticket: Ticket = {
          id: padTicket(seq),
          sequence: seq,
          alias: walkIn ? alias || 'Walk-in' : alias || 'Client',
          walkIn,
          serviceIds,
          haircutterId,
          status: 'queued',
          paymentStatus: 'unpaid',
          createdAt: new Date().toISOString(),
          createdBy: me?.id ?? 'st_cash',
        }
        dispatch({ type: 'createTicket', ticket })
        const cutter = state.staff.find((s) => s.id === haircutterId)
        log('ticket.create', `Issued ${ticket.id} → ${cutter?.name ?? haircutterId}`)
        notify({
          title: `New ticket ${ticket.id}`,
          body: `${ticket.alias} · assigned to ${cutter?.name ?? 'station'}`,
          targetStaffId: haircutterId,
          tone: 'alert',
        })
        notify({
          title: `${ticket.id} queued`,
          body: `Waiting on ${cutter?.name ?? 'haircutter'}`,
          targetRole: 'cashier',
          tone: 'info',
        })
        return ticket
      },
      acceptTicket: (id) => {
        const ticket = state.tickets.find((t) => t.id === id)
        if (
          me?.role !== 'haircutter' ||
          !ticket ||
          ticket.haircutterId !== me.id ||
          ticket.status !== 'queued' ||
          state.tickets.some((item) => item.haircutterId === me.id && item.status === 'in_progress')
        ) return
        dispatch({
          type: 'patchTicket',
          id,
          patch: { status: 'in_progress', acceptedAt: new Date().toISOString() },
        })
        dispatch({ type: 'setStaffStatus', staffId: ticket.haircutterId, status: 'busy' })
        log('ticket.accept', `${id} accepted`)
        notify({
          title: `${id} in the chair`,
          body: 'Haircutter started service',
          targetRole: 'cashier',
          tone: 'info',
        })
      },
      completeService: (id) => {
        const ticket = state.tickets.find((t) => t.id === id)
        if (me?.role !== 'haircutter' || !ticket || ticket.haircutterId !== me.id || ticket.status !== 'in_progress') return
        dispatch({
          type: 'patchTicket',
          id,
          patch: { status: 'ready', completedAt: new Date().toISOString() },
        })
        dispatch({ type: 'setStaffStatus', staffId: ticket.haircutterId, status: 'idle' })
        log('ticket.ready', `${id} ready for settlement`)
        notify({
          title: `${id} ready to settle`,
          body: 'Client should return to the desk',
          targetRole: 'cashier',
          tone: 'alert',
        })
      },
      settlePayment: (id, channel, extras) => {
        const ticket = state.tickets.find((t) => t.id === id)
        if (
          me?.role !== 'cashier' ||
          !state.shifts.some((shift) => !shift.closedAt) ||
          !ticket ||
          ticket.status !== 'ready' ||
          ticket.paymentStatus !== 'unpaid' ||
          !state.settings.channels[channel]
        ) return
        if (channel === 'cash' && (extras?.cashTendered === undefined || extras.cashTendered < total(ticket))) return
        if ((channel === 'momo_mtn' || channel === 'momo_airtel') && !extras?.paymentRef?.trim()) return
        dispatch({
          type: 'patchTicket',
          id,
          patch: {
            status: 'completed',
            paymentStatus: 'paid',
            paymentChannel: channel,
            paymentRef: extras?.paymentRef,
            cashTendered: extras?.cashTendered,
            paidAt: new Date().toISOString(),
          },
        })
        log('ticket.paid', `Settled ${id} via ${channel}`)
        notify({
          title: `${id} paid`,
          body: `Payment confirmed · ${money(total(ticket), state.settings.currencySymbol)}`,
          targetStaffId: ticket.haircutterId,
          tone: 'success',
        })
      },
      voidTicket: (id, reason) => {
        const ticket = state.tickets.find((t) => t.id === id)
        if (me?.role !== 'manager' || !ticket || ticket.status === 'completed' || ticket.status === 'voided' || !reason.trim()) return
        dispatch({ type: 'patchTicket', id, patch: { status: 'voided', voidReason: reason } })
        if (ticket.status === 'in_progress') dispatch({ type: 'setStaffStatus', staffId: ticket.haircutterId, status: 'idle' })
        log('ticket.void', `Voided ${id}: ${reason}`)
      },
      refundTicket: (id, reason) => {
        const ticket = state.tickets.find((t) => t.id === id)
        if (me?.role !== 'manager' || !ticket || ticket.paymentStatus !== 'paid' || !reason.trim()) return
        dispatch({
          type: 'patchTicket',
          id,
          patch: { paymentStatus: 'refunded', refundReason: reason },
        })
        log('ticket.refund', `Refunded ${id}: ${reason}`)
      },
      adjustPrice: (id, price, reason) => {
        const ticket = state.tickets.find((t) => t.id === id)
        if (me?.role !== 'manager' || !ticket || ticket.paymentStatus === 'paid' || !Number.isFinite(price) || price < 0 || !reason.trim()) return
        dispatch({
          type: 'patchTicket',
          id,
          patch: { priceOverride: price, overrideReason: reason },
        })
        log('ticket.price', `Adjusted ${id} to ${price}: ${reason}`)
      },
      reassignTicket: (id, haircutterId) => {
        const ticket = state.tickets.find((t) => t.id === id)
        const cutterExists = state.staff.some((staff) => staff.id === haircutterId && staff.role === 'haircutter' && staff.active)
        if (me?.role !== 'manager' || !ticket || ticket.status !== 'queued' || !cutterExists) return
        dispatch({ type: 'patchTicket', id, patch: { haircutterId } })
        const cutter = state.staff.find((s) => s.id === haircutterId)
        log('ticket.reassign', `${id} → ${cutter?.name ?? haircutterId}`)
        notify({
          title: `Reassigned ${id}`,
          body: 'A queued client was moved to your chair',
          targetStaffId: haircutterId,
          tone: 'alert',
        })
      },
      openShift: (openingFloat) => {
        if (me?.role !== 'cashier' || !Number.isFinite(openingFloat) || openingFloat < 0 || state.shifts.some((shift) => !shift.closedAt)) return
        dispatch({ type: 'openShift', cashierId: me.id, openingFloat })
        log('shift.open', `Opened drawer with ${money(openingFloat, state.settings.currencySymbol)}`)
      },
      closeShift: (countedCash, countedCardSlips, countedMomo, note) => {
        if (
          (me?.role !== 'cashier' && me?.role !== 'manager') ||
          !state.shifts.some((shift) => !shift.closedAt) ||
          [countedCash, countedCardSlips, countedMomo].some((amount) => !Number.isFinite(amount) || amount < 0)
        ) return
        dispatch({ type: 'closeShift', countedCash, countedCardSlips, countedMomo, note })
        log(
          'shift.close',
          `Counted cash ${countedCash}, card slips ${countedCardSlips}, MoMo ${countedMomo}`,
        )
      },
      requestRestock: (items, note) => {
        if (me?.role !== 'haircutter' || !items.length) return
        dispatch({ type: 'restock', haircutterId: me.id, items, note })
        log('station.restock', `${me.name} requested ${items.join(', ')}`)
        notify({
          title: 'Restock request',
          body: `${me.name}: ${items.join(', ')}`,
          targetRole: 'manager',
          tone: 'alert',
        })
      },
      fulfillRestock: (id) => {
        if (me?.role !== 'manager' || !state.restocks.some((request) => request.id === id && request.status === 'open')) return
        dispatch({ type: 'fulfillRestock', id })
        log('station.restock.done', `Fulfilled ${id}`)
      },
      saveSettings: (settings) => {
        if (
          me?.role !== 'admin' ||
          settings.stations < 1 ||
          !settings.name.trim() ||
          !Object.values(settings.channels).some(Boolean)
        ) return
        dispatch({ type: 'saveSettings', settings })
        log('settings.update', 'Salon settings updated')
      },
      saveStaff: (staff) => {
        const existing = state.staff.find((item) => item.id === staff.id)
        const managerCommissionUpdate = me?.role === 'manager' && existing?.role === 'haircutter' && staff.role === 'haircutter' &&
          staff.name === existing.name && staff.email === existing.email && staff.pin === existing.pin &&
          staff.active === existing.active && staff.station === existing.station && staff.status === existing.status
        if (
          (me?.role !== 'admin' && !managerCommissionUpdate) ||
          !staff.name.trim() ||
          !Number.isFinite(staff.commissionValue) ||
          staff.commissionValue < 0 ||
          (me?.role === 'admin' && (!staff.email.trim() || !staff.pin.trim()))
        ) return
        dispatch({ type: 'saveStaff', staff })
        log('staff.save', `${staff.name} (${staff.role})`)
      },
      saveService: (service) => {
        if (
          me?.role !== 'admin' ||
          !service.name.trim() ||
          !Number.isFinite(service.price) ||
          service.price < 0 ||
          !Number.isFinite(service.durationMin) ||
          service.durationMin < 1
        ) return
        dispatch({ type: 'saveService', service })
        log('catalog.save', service.name)
      },
      approvePayout: (haircutterId, period) => {
        const staff = state.staff.find((s) => s.id === haircutterId)
        if (me?.role !== 'manager' || !staff || staff.role !== 'haircutter') return
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        if (period === 'weekly') start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
        const end = new Date(start)
        end.setDate(end.getDate() + (period === 'daily' ? 1 : 7))
        const alreadyApproved = state.payouts.some((payout) => {
          if (payout.haircutterId !== haircutterId || payout.period !== period || !payout.approved || !payout.approvedAt) return false
          const approvedAt = new Date(payout.approvedAt)
          return approvedAt >= start && approvedAt < end
        })
        if (alreadyApproved) return
        const calc = commissionForPeriod(staff, state.tickets, state.services, period)
        const payout: Payout = {
          id: uid('pay'),
          haircutterId,
          period,
          amount: calc.amount,
          clients: calc.clients,
          revenue: calc.revenue,
          approved: true,
          approvedAt: new Date().toISOString(),
          approvedBy: me.id,
        }
        dispatch({ type: 'approvePayout', payout })
        log('payroll.approve', `Approved ${period} payout for ${staff.name}: ${money(calc.amount, state.settings.currencySymbol)}`)
      },
      commissionFor: (staff) => commissionFor(staff, state.tickets, state.services),
      commissionForPeriod: (staff, period) => commissionForPeriod(staff, state.tickets, state.services, period),
      activeShift: state.shifts.find((s) => !s.closedAt),
    }
  }, [state, me, total, log, notify])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useSalon() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('SalonProvider missing')
  return ctx
}

export function useRoleGate(roles: Role[]) {
  const { me } = useSalon()
  return Boolean(me && roles.includes(me.role))
}

export { ticketTotal, todayKey }
