import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <img src="/mascot/confused.png" alt="Rien ici" width={200} className="mb-4 opacity-90" />
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      {description && <p className="text-xs text-muted-foreground mb-4 max-w-xs">{description}</p>}
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline underline-offset-4"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline underline-offset-4"
          >
            {action.label}
          </button>
        ))}
    </div>
  )
}
