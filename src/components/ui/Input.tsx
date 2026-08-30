import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  suffix?: string
  error?: string
}

export function Input({ className, label, suffix, error, id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <label className="min-w-0 grid gap-2 text-body-small font-semibold text-card-foreground" htmlFor={inputId}>
      {label}
      <span className="flex w-full min-w-0 items-center rounded-medium bg-muted px-4 focus-within:ring-2 focus-within:ring-primary">
        <input
          className={cn('min-w-0 flex-1 bg-transparent py-4 text-body font-normal text-foreground outline-none', className)}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {suffix && <span className="text-body-small font-normal text-muted-foreground">{suffix}</span>}
      </span>
      {error && <span className="border-l-2 border-error pl-3 text-caption font-normal text-card-foreground" id={errorId}>{error}</span>}
    </label>
  )
}
