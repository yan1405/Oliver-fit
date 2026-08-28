import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'solid' | 'glass'
}

export function Card({ className, variant = 'solid', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-large p-6 text-card-foreground',
        variant === 'solid'
          ? 'bg-card shadow-medium'
          : 'border border-glass-border bg-glass shadow-medium backdrop-blur-[20px]',
        className,
      )}
      {...props}
    />
  )
}
