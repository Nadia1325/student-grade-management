import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

export function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: ReactNode
  hint?: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900',
        accent && 'border-amber-400/50 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-900/20',
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight gradient-text">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  )
}
