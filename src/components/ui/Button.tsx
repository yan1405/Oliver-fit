import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variants = {
  primary: 'bg-primary text-primary-foreground shadow-low active:opacity-80',
  secondary: 'bg-muted text-card-foreground active:opacity-70',
  ghost: 'bg-transparent text-primary active:bg-muted',
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-12 items-center justify-center rounded-medium px-5 py-3 text-heading-3 font-bold transition-[opacity,background-color] duration-200 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
