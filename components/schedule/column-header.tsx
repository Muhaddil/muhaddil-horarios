"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  COLUMN_TYPE_LABELS,
  type Column,
  type ColumnType,
} from "@/lib/schedule/data-model"

const TYPE_GLYPH: Record<ColumnType, string> = {
  text: "Aa",
  time: "⏱",
  select: "◉",
  multi_select: "⊞",
  notes: "¶",
  number: "#",
}

export default function ColumnHeader({
  column,
  onUpdate,
  onDelete,
  onResize,
}: {
  column: Column
  onUpdate: (changes: Partial<Column>) => void
  onDelete: () => void
  onResize: (w: number) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [name, setName] = useState(column.name)
  const thRef = useRef<HTMLDivElement>(null)

  useEffect(() => setName(column.name), [column.name])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = column.width
    let raf = 0
    let latest = startW

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const onMove = (ev: MouseEvent) => {
      latest = Math.max(60, Math.min(600, startW + (ev.clientX - startX)))
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0
          onResize(latest)
        })
      }
    }
    const onUp = () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
      if (raf) cancelAnimationFrame(raf)
      onResize(latest)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  const commitName = () => {
    const v = name.trim()
    if (v && v !== column.name) onUpdate({ name: v })
    else setName(column.name)
  }

  return (
    <div
      ref={thRef}
      className="relative flex items-center h-full group"
      style={{ width: column.width }}
    >
      <button
        type="button"
        className="flex flex-1 items-center gap-2 h-full px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className="font-mono text-[10px] text-dim w-4 shrink-0">
          {TYPE_GLYPH[column.type]}
        </span>
        <span className="truncate">{column.name}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 ml-auto text-dim shrink-0 transition-transform",
            menuOpen && "rotate-180 text-accent",
          )}
        />
      </button>

      <button
        type="button"
        aria-label="Redimensionar columna"
        tabIndex={-1}
        onMouseDown={handleResizeStart}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent active:bg-accent z-10"
      />

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              commitName()
              setMenuOpen(false)
            }}
          />
          <div className="hh-pop absolute z-50 left-0 top-full mt-1 w-64 rounded-lg border border-border bg-surface shadow-2xl p-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitName()
                  setMenuOpen(false)
                } else if (e.key === "Escape") {
                  setName(column.name)
                  setMenuOpen(false)
                }
              }}
              onBlur={commitName}
              placeholder="Nombre de columna"
              className="w-full bg-surface-2 rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
            <div className="mt-2 px-2 py-1 text-[10px] uppercase tracking-wider text-dim">
              Tipo
            </div>
            {(Object.keys(COLUMN_TYPE_LABELS) as ColumnType[]).map((t) => (
              <button
                type="button"
                key={t}
                className={cn(
                  "flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-surface-2",
                  column.type === t && "text-accent",
                )}
                onClick={() => {
                  onUpdate({ type: t })
                  setMenuOpen(false)
                }}
              >
                <span className="font-mono text-[11px] text-dim w-4">
                  {TYPE_GLYPH[t]}
                </span>
                <span>{COLUMN_TYPE_LABELS[t]}</span>
                {column.type === t && (
                  <Check className="w-3.5 h-3.5 ml-auto" />
                )}
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded text-danger hover:bg-danger-soft"
              onClick={() => {
                if (
                  window.confirm(
                    `¿Eliminar columna "${column.name}"? Esto borra todos sus valores.`,
                  )
                ) {
                  onDelete()
                  setMenuOpen(false)
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar columna
            </button>
          </div>
        </>
      )}
    </div>
  )
}
