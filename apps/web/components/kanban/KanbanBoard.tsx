'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateApplicationStatus, type Application } from '@/lib/applications'

const COLUMNS = [
  {
    status: 'SENT',
    label: 'Envoyée',
    headerCls: 'bg-slate-100 text-slate-700',
    dotCls: 'bg-slate-400',
    overCls: 'bg-slate-50 ring-2 ring-slate-200',
  },
  {
    status: 'FOLLOW_UP',
    label: 'À relancer',
    headerCls: 'bg-blue-50 text-blue-700',
    dotCls: 'bg-blue-400',
    overCls: 'bg-blue-50 ring-2 ring-blue-200',
  },
  {
    status: 'INTERVIEW',
    label: 'Entretien',
    headerCls: 'bg-emerald-50 text-emerald-700',
    dotCls: 'bg-emerald-400',
    overCls: 'bg-emerald-50 ring-2 ring-emerald-200',
  },
  {
    status: 'OFFER',
    label: 'Offre',
    headerCls: 'bg-violet-50 text-violet-700',
    dotCls: 'bg-violet-500',
    overCls: 'bg-violet-50 ring-2 ring-violet-200',
  },
  {
    status: 'REJECTED',
    label: 'Refusé',
    headerCls: 'bg-red-50 text-red-700',
    dotCls: 'bg-red-400',
    overCls: 'bg-red-50 ring-2 ring-red-200',
  },
  {
    status: 'ARCHIVED',
    label: 'Archivée',
    headerCls: 'bg-slate-50 text-slate-500',
    dotCls: 'bg-slate-300',
    overCls: 'bg-slate-100 ring-2 ring-slate-200',
  },
]

interface Props {
  apps: Application[]
  onStatusChange: (appId: string, newStatus: string) => void
}

export function KanbanBoard({ apps, onStatusChange }: Props) {
  const dragging = useRef<Application | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStatus, setOverStatus] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  function effectiveStatus(app: Application) {
    return overrides[app.id] ?? app.status
  }

  function handleDragStart(app: Application) {
    dragging.current = app
    setDraggingId(app.id)
  }

  function handleDragEnd() {
    dragging.current = null
    setDraggingId(null)
    setOverStatus(null)
  }

  async function handleDrop(newStatus: string) {
    const app = dragging.current
    dragging.current = null
    setDraggingId(null)
    setOverStatus(null)

    if (!app || effectiveStatus(app) === newStatus) return

    setOverrides((prev) => ({ ...prev, [app.id]: newStatus }))

    try {
      await updateApplicationStatus(app.id, newStatus)
      onStatusChange(app.id, newStatus)
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[app.id]
        return next
      })
    } catch {
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[app.id]
        return next
      })
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-6 -mx-6 px-6 min-h-[calc(100vh-280px)]">
      {COLUMNS.map((col) => {
        const colApps = apps.filter((a) => effectiveStatus(a) === col.status)
        const isOver =
          overStatus === col.status &&
          dragging.current !== null &&
          effectiveStatus(dragging.current) !== col.status

        return (
          <div
            key={col.status}
            className="flex-shrink-0 w-52 flex flex-col gap-2"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setOverStatus(col.status)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOverStatus(null)
              }
            }}
            onDrop={(e) => {
              e.preventDefault()
              handleDrop(col.status)
            }}
          >
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${col.headerCls}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dotCls}`} />
              <span className="text-xs font-semibold flex-1">{col.label}</span>
              <span className="text-xs font-bold tabular-nums opacity-60">{colApps.length}</span>
            </div>

            <div
              className={`flex-1 flex flex-col gap-2 rounded-xl p-1 transition-all duration-150 ${
                isOver ? col.overCls : ''
              }`}
            >
              {colApps.map((app) => (
                <KanbanCard
                  key={app.id}
                  app={app}
                  isDragging={draggingId === app.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}

              <div
                className={`flex-1 flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-150 min-h-16 ${
                  isOver ? 'border-primary/30' : 'border-transparent'
                }`}
              >
                {isOver && (
                  <p className="text-xs font-medium text-primary/50">Déposer ici</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({
  app,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  app: Application
  isDragging: boolean
  onDragStart: (app: Application) => void
  onDragEnd: () => void
}) {
  const router = useRouter()
  const dragMoved = useRef(false)

  return (
    <div
      draggable
      onDragStart={(e) => {
        dragMoved.current = false
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', app.id)
        onDragStart(app)
      }}
      onDrag={() => {
        dragMoved.current = true
      }}
      onDragEnd={onDragEnd}
      onClick={() => {
        if (!dragMoved.current) router.push(`/applications/${app.id}`)
      }}
      className={`bg-white rounded-xl border border-border p-3 cursor-grab active:cursor-grabbing select-none transition-all duration-150 hover:shadow-sm hover:border-primary/20 group ${
        isDragging ? 'opacity-30 scale-95 shadow-none' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/10 transition-colors">
          <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
            {app.company[0].toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-snug truncate">{app.company}</p>
          <p className="text-xs text-muted-foreground leading-snug truncate">{app.position}</p>
        </div>
      </div>

      {app.location && (
        <p className="text-xs text-muted-foreground/50 mt-2 truncate">{app.location}</p>
      )}

      <p className="text-xs text-muted-foreground/40 mt-1.5 tabular-nums">
        {new Date(app.appliedAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        })}
      </p>
    </div>
  )
}
