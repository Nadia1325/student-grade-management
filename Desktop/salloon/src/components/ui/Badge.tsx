import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

const tones = {
  queued: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  progress: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white',
  ready: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  void: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  idle: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  busy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  break: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  offline: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

export function Badge({
  tone,
  children,
  className,
}: {
  tone: keyof typeof tones
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
