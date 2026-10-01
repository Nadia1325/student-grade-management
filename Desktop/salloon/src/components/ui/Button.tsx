import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Tone = 'primary' | 'ghost' | 'danger' | 'soft'

export function Button({
  tone = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    primary:
      'gold-gradient text-white hover:opacity-90 shadow-lg transition-all duration-300',
    ghost:
      'bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300',
    danger: 'bg-red-600 text-white hover:opacity-90 transition-all duration-300',
    soft: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-600 transition-all duration-300',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
