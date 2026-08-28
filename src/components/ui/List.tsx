import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function List({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('overflow-hidden rounded-large bg-card shadow-low', className)} {...props} />
}

type ListItemProps = {
  label: string
  detail?: string
  leading?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
}

export function ListItem({ label, detail, leading, trailing, onClick }: ListItemProps) {
  const content = (
    <>
      {leading}
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-body text-card-foreground">{label}</span>
        {detail && <span className="mt-1 block text-body-small text-muted-foreground">{detail}</span>}
      </span>
      {trailing ?? (onClick && <Chevron />)}
    </>
  )

  return (
    <li className="border-b-[0.5px] border-border last:border-b-0">
      {onClick ? (
        <button className="flex min-h-12 w-full items-center gap-3 px-4 py-3 active:bg-muted" type="button" onClick={onClick}>
          {content}
        </button>
      ) : (
        <div className="flex min-h-12 items-center gap-3 px-4 py-3">{content}</div>
      )}
    </li>
  )
}

function Chevron() {
  return (
    <svg aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" viewBox="0 0 16 16" fill="none">
      <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
