import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
  Legend,
} from 'recharts'
import { Download } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Field'
import { KpiCard } from '../../components/ui/KpiCard'
import { formatTime, isToday, money, uid, todayKey } from '../../lib/utils'
import { useSalon } from '../../store/SalonContext'
import type { PaymentChannel, Role, Service, ServiceCategory, Staff } from '../../types'

const COLORS = ['#d4af37', '#4ade80', '#f4d03f', '#b8960c', '#888888']

function exportToPDF() {
  window.print()
}

export function AdminIntel() {
  const { state, ticketTotal } = useSalon()
  const tickets = state.tickets.filter((t) => t.status === 'completed' && t.paymentStatus === 'paid')
  const revenue = tickets.reduce((sum, t) => sum + ticketTotal(t), 0)
  const today = tickets.filter((t) => isToday(t.completedAt ?? t.createdAt))
  const todayRevenue = today.reduce((sum, t) => sum + ticketTotal(t), 0)
  const averageTicket = tickets.length ? revenue / tickets.length : 0

  const paymentMix = useMemo(() => {
    const mix: Record<string, number> = {}
    tickets.forEach((t) => {
      const ch = t.paymentChannel ?? 'unpaid'
      mix[ch] = (mix[ch] ?? 0) + ticketTotal(t)
    })
    return Object.entries(mix).map(([channel, amount]) => ({ channel, amount }))
  }, [tickets, ticketTotal])

  const productivity = useMemo(() => state.staff
    .filter((staff) => staff.role === 'haircutter')
    .map((staff) => {
      const staffTickets = tickets.filter((ticket) => ticket.haircutterId === staff.id)
      const revenue = staffTickets.reduce((sum, ticket) => sum + ticketTotal(ticket), 0)
      const durations = staffTickets
        .filter((ticket) => ticket.completedAt)
        .map((ticket) => Math.max(0, (new Date(ticket.completedAt!).getTime() - new Date(ticket.acceptedAt ?? ticket.createdAt).getTime()) / 60_000))
      return {
        name: staff.name,
        clients: staffTickets.length,
        averageMinutes: durations.length ? durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length : 0,
        commission: staff.commissionType === 'fixed' ? staffTickets.length * staff.commissionValue : revenue * staff.commissionValue / 100,
      }
    })
    .sort((a, b) => b.clients - a.clients), [tickets, state.staff, ticketTotal])

  const revenueTrend = useMemo(() => {
    const byDay: Record<string, number> = {}
    tickets.forEach((t) => {
      const day = todayKey(t.completedAt ?? t.createdAt)
      byDay[day] = (byDay[day] ?? 0) + ticketTotal(t)
    })
    return Object.entries(byDay)
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-7)
  }, [tickets, ticketTotal])

  return (
    <div className="grid gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Admin</p>
          <h1 className="font-display text-2xl font-bold gradient-text">Business intelligence</h1>
        </div>
        <Button tone="soft" className="gap-2 text-xs" onClick={() => exportToPDF()}>
          <Download size={16} />
          Export PDF
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total revenue" value={money(revenue, state.settings.currencySymbol)} />
        <KpiCard label="Tickets completed" value={tickets.length} />
        <KpiCard label="Average ticket" value={money(averageTicket, state.settings.currencySymbol)} />
        <KpiCard label="Today revenue" value={money(todayRevenue, state.settings.currencySymbol)} accent />
        <KpiCard label="Today tickets" value={today.length} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg">Revenue trend (7 days)</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value) => money(typeof value === 'number' ? value : Number(value ?? 0), state.settings.currencySymbol)}
                />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#d4af37" strokeWidth={2} dot={{ fill: '#d4af37', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg">Payment mix (Pie)</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentMix}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  nameKey="channel"
                  label={(props) => `${String(props.name ?? '')} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#888888"
                  dataKey="amount"
                >
                  {paymentMix.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value) => money(typeof value === 'number' ? value : Number(value ?? 0), state.settings.currencySymbol)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg">Payment mix (Bar)</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentMix}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                <XAxis dataKey="channel" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value) => money(typeof value === 'number' ? value : Number(value ?? 0), state.settings.currencySymbol)}
                />
                <Legend />
                <Bar dataKey="amount" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg">Haircutter productivity</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend />
                <Bar dataKey="clients" fill="#f4d03f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-display text-lg">Haircutter performance</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-gray-600 dark:text-gray-400">
              <tr>
                <th className="pb-2">Haircutter</th>
                <th>Paid clients</th>
                <th>Average service time</th>
                <th>Commission earned</th>
              </tr>
            </thead>
            <tbody>
              {productivity.map((staff) => (
                <tr key={staff.name} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="py-2">{staff.name}</td>
                  <td>{staff.clients}</td>
                  <td>{staff.averageMinutes ? `${Math.round(staff.averageMinutes)} min` : '—'}</td>
                  <td>{money(staff.commission, state.settings.currencySymbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  )
}

export function AdminStaff() {
  const { state, saveStaff } = useSalon()
  const blank: Staff = {
    id: uid('st'),
    name: '',
    role: 'haircutter',
    email: '',
    station: state.settings.stations,
    status: 'offline',
    active: true,
    pin: '1234',
    commissionType: 'percent',
    commissionValue: 35,
  }
  const [form, setForm] = useState<Staff>(blank)

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">RBAC</p>
        <h1 className="font-display text-2xl font-bold gradient-text">Staff & access</h1>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="text-[10px] uppercase text-gray-600 dark:text-gray-400">
              <tr>
                <th className="pb-2">Name</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.staff.map((s) => (
                <tr key={s.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="py-2">
                    {s.name}
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">{s.email}</div>
                  </td>
                  <td className="capitalize">{s.role}</td>
                  <td>
                    <Badge tone={s.active ? 'idle' : 'offline'}>{s.active ? 'Active' : 'Suspended'}</Badge>
                  </td>
                  <td>
                    <Button tone="ghost" className="h-7 px-2 py-0 text-[10px]" onClick={() => setForm(s)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-display text-lg">Permission matrix</h2>
          </CardHeader>
          <CardBody className="overflow-x-auto text-xs">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="text-[10px] uppercase text-gray-600 dark:text-gray-400">
                  <th className="pb-2">Surface</th>
                  <th>Admin</th>
                  <th>Manager</th>
                  <th>Cashier</th>
                  <th>Haircutter</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Issue tickets', '—', 'override', 'yes', 'no'],
                  ['Start service', '—', 'override', 'no', 'yes, ticket-gated'],
                  ['Drawer close', 'yes', 'yes', 'yes', 'no'],
                  ['Approve payroll', 'yes', 'yes', 'no', 'no'],
                  ['Catalog & PIN', 'yes', 'no', 'no', 'no'],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-gray-200 dark:border-gray-700">
                    {row.map((cell) => (
                      <td key={cell} className="py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-display text-lg">{state.staff.some((s) => s.id === form.id) ? 'Edit account' : 'New account'}</h2>
        </CardHeader>
        <CardBody className="grid gap-3">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-xs" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="text-xs" />
          </Field>
          <Field label="PIN">
            <Input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} className="text-xs" />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="text-xs">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="haircutter">Haircutter</option>
            </Select>
          </Field>
          {form.role === 'haircutter' ? (
            <Field label="Station">
              <Input
                type="number"
                value={form.station ?? 1}
                onChange={(e) => setForm({ ...form, station: Number(e.target.value) })}
                className="text-xs"
              />
            </Field>
          ) : null}
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active (uncheck to suspend)
          </label>
          <Button
            onClick={() => {
              saveStaff(form)
              setForm({ ...blank, id: uid('st') })
            }}
            className="text-xs"
          >
            Save staff
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

export function AdminCatalog() {
  const { state, saveService } = useSalon()
  const blank: Service = {
    id: uid('sv'),
    name: '',
    category: 'haircuts',
    price: 40,
    durationMin: 25,
    active: true,
  }
  const [form, setForm] = useState<Service>(blank)

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Master catalog</p>
        <h1 className="font-display text-2xl font-bold gradient-text">Services & pricing</h1>
        <div className="mt-6 grid gap-2">
          {state.services.map((s) => (
            <button
              key={s.id}
              onClick={() => setForm(s)}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-left hover:border-[#d4af37]/50 transition-all"
            >
              <span>
                <span className="text-xs font-medium">{s.name}</span>
                <span className="ml-2 text-[10px] uppercase text-gray-600 dark:text-gray-400">{s.category}</span>
              </span>
              <span className="text-xs">
                {money(s.price, state.settings.currencySymbol)} · {s.durationMin}m
              </span>
            </button>
          ))}
        </div>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-display text-lg">Service form</h2>
        </CardHeader>
        <CardBody className="grid gap-3">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-xs" />
          </Field>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
              className="text-xs"
            >
              <option value="haircuts">Haircuts</option>
              <option value="shaving">Shaving</option>
              <option value="dyeing">Dyeing</option>
              <option value="treatments">Treatments</option>
            </Select>
          </Field>
          <Field label="Base price">
            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="text-xs" />
          </Field>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              value={form.durationMin}
              onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
              className="text-xs"
            />
          </Field>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active (uncheck to hide from cashier)
          </label>
          <Button
            onClick={() => {
              saveService(form)
              setForm({ ...blank, id: uid('sv') })
            }}
            className="text-xs"
          >
            Save service
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

export function AdminSettings() {
  const { state, saveSettings } = useSalon()
  const [form, setForm] = useState(state.settings)
  const hasPaymentChannel = Object.values(form.channels).some(Boolean)

  return (
    <div className="grid max-w-xl gap-5">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Single location</p>
        <h1 className="font-display text-2xl font-bold gradient-text">Salon settings</h1>
      </div>
      <Card>
        <CardBody className="grid gap-3">
          <Field label="Salon name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-xs" />
          </Field>
          <Field label="Business hours">
            <Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="text-xs" />
          </Field>
          <Field label="Physical stations">
            <Input type="number" value={form.stations} onChange={(e) => setForm({ ...form, stations: Number(e.target.value) })} className="text-xs" />
          </Field>
          <Field label="Currency code">
            <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="text-xs" />
          </Field>
          <Field label="Symbol">
            <Input value={form.currencySymbol} onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })} className="text-xs" />
          </Field>
          <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Out-of-system channels</p>
          {(Object.keys(form.channels) as PaymentChannel[]).map((ch) => (
            <label key={ch} className="flex items-center gap-2 text-xs capitalize">
              <input
                type="checkbox"
                checked={form.channels[ch]}
                onChange={(e) => setForm({ ...form, channels: { ...form.channels, [ch]: e.target.checked } })}
              />
              {ch.replace('_', ' ')}
            </label>
          ))}
          {!hasPaymentChannel ? <p className="text-xs text-red-600 dark:text-red-400">Enable at least one payment channel.</p> : null}
          <Button disabled={!form.name.trim() || form.stations < 1 || !hasPaymentChannel} onClick={() => saveSettings(form)} className="text-xs">Save settings</Button>
        </CardBody>
      </Card>
    </div>
  )
}

export function AdminLogs() {
  const { state } = useSalon()
  const who = (id: string) => state.staff.find((s) => s.id === id)?.name ?? id
  const todayLogins = state.audit.filter((a) => a.action === 'auth.login' && isToday(a.at))

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400">Security</p>
        <h1 className="font-display text-2xl font-bold gradient-text">Audit trail</h1>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{todayLogins.length} sign-ins recorded today. Overrides, voids, and price edits are immutable here.</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="text-[10px] uppercase text-gray-600 dark:text-gray-400">
            <tr>
              <th className="p-3">When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {state.audit.map((a) => (
              <tr key={a.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-3 whitespace-nowrap">{formatTime(a.at)}</td>
                <td>{who(a.actorId)}</td>
                <td className="font-mono text-[10px]">{a.action}</td>
                <td>{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
