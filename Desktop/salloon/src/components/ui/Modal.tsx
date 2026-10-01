import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center dark:bg-black/60">
      <button className="absolute inset-0" aria-label="Close dialog" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-line bg-paper p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl">{title}</h2>
          <Button tone="ghost" className="h-9 w-9 rounded-full p-0" onClick={onClose} aria-label="Close">
            <X size={16} />
          </Button>
        </div>
        {children}
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  )
}
