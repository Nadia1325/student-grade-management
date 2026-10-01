export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function money(amount: number, symbol = '₵') {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function padTicket(n: number) {
  return `#${String(n).padStart(3, '0')}`
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function todayKey(iso = new Date().toISOString()) {
  return iso.slice(0, 10)
}

export function isToday(iso: string) {
  return todayKey(iso) === todayKey()
}

export function elapsed(fromIso: string, toIso = new Date().toISOString()) {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime()
  const m = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h <= 0) return `${rem}m`
  return `${h}h ${rem}m`
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function chime() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.04
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.18)
    osc.onended = () => void ctx.close()
  } catch {
    /* ignore */
  }
}
