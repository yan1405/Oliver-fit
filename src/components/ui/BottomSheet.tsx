import { useEffect, useId, useRef, type ReactNode } from 'react'

type BottomSheetProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function BottomSheet({ open, title, children, onClose }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="m-0 h-full max-h-none w-full max-w-none items-end bg-transparent p-0 backdrop:bg-foreground/25 open:flex"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="mx-auto max-h-[92vh] w-full max-w-app overflow-y-auto rounded-t-large bg-card px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 text-card-foreground shadow-high">
        <div className="mx-auto mb-5 h-1 w-10 rounded-pill bg-border" aria-hidden="true" />
        <h2 className="font-display text-heading-2 font-bold" id={titleId}>{title}</h2>
        <div className="mt-5">{children}</div>
      </section>
    </dialog>
  )
}
