export type Role = 'admin' | 'manager' | 'cashier' | 'haircutter'

export type StaffStatus = 'idle' | 'busy' | 'break' | 'offline'

export type TicketStatus = 'queued' | 'in_progress' | 'ready' | 'completed' | 'voided'

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

export type PaymentChannel = 'cash' | 'card' | 'momo_mtn' | 'momo_airtel'

export type ServiceCategory = 'haircuts' | 'shaving' | 'dyeing' | 'treatments'

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  price: number
  durationMin: number
  active: boolean
}

export interface Staff {
  id: string
  name: string
  role: Role
  email: string
  station?: number
  status: StaffStatus
  active: boolean
  pin: string
  commissionType: 'percent' | 'fixed'
  commissionValue: number
}

export interface Ticket {
  id: string
  sequence: number
  alias: string
  walkIn: boolean
  serviceIds: string[]
  haircutterId: string
  status: TicketStatus
  paymentStatus: PaymentStatus
  paymentChannel?: PaymentChannel
  paymentRef?: string
  cashTendered?: number
  createdAt: string
  acceptedAt?: string
  completedAt?: string
  paidAt?: string
  voidReason?: string
  refundReason?: string
  priceOverride?: number
  overrideReason?: string
  createdBy: string
}

export interface Shift {
  id: string
  cashierId: string
  openedAt: string
  closedAt?: string
  openingFloat: number
  countedCash?: number
  countedCardSlips?: number
  countedMomo?: number
  note?: string
}

export interface RestockRequest {
  id: string
  haircutterId: string
  items: string[]
  note: string
  createdAt: string
  status: 'open' | 'fulfilled'
}

export interface AuditEntry {
  id: string
  at: string
  actorId: string
  action: string
  detail: string
}

export interface AppNotification {
  id: string
  at: string
  title: string
  body: string
  targetStaffId?: string
  targetRole?: Role
  tone: 'info' | 'success' | 'alert'
  read: boolean
}

export interface SalonSettings {
  name: string
  hours: string
  stations: number
  currency: string
  currencySymbol: string
  channels: Record<PaymentChannel, boolean>
}

export interface Payout {
  id: string
  haircutterId: string
  period: 'daily' | 'weekly'
  amount: number
  clients: number
  revenue: number
  approved: boolean
  approvedAt?: string
  approvedBy?: string
}

export interface SalonState {
  settings: SalonSettings
  staff: Staff[]
  services: Service[]
  tickets: Ticket[]
  shifts: Shift[]
  restocks: RestockRequest[]
  audit: AuditEntry[]
  notifications: AppNotification[]
  payouts: Payout[]
  sessionStaffId: string | null
}
