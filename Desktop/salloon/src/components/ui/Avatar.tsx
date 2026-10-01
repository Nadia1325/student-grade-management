import { cn } from '../../lib/utils'

const avatarColors = [
  'bg-[#d4af37]',
  'bg-[#b8960c]',
  'bg-[#f4d03f]',
  'bg-[#888888]',
  'bg-[#666666]',
  'bg-[#444444]',
]

function getAvatarColor(name: string) {
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return avatarColors[index % avatarColors.length]
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white shadow-lg transition-all duration-300 hover:scale-110',
        getAvatarColor(name),
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  )
}

export function AvatarWithStatus({
  name,
  status,
  size = 'md',
  className,
}: {
  name: string
  status: 'online' | 'offline' | 'busy' | 'away'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const statusColors = {
    online: 'bg-[#4ade80]',
    offline: 'bg-[#333333]',
    busy: 'bg-[#d4af37]',
    away: 'bg-[#888888]',
  }

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
    xl: 'h-5 w-5',
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar name={name} size={size} />
      <span
        className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-[var(--bg-primary)]',
          statusColors[status],
          sizeClasses[size],
        )}
      />
    </div>
  )
}
