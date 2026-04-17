"use client"

import { useRef, useState } from "react"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SHEET_TEMPLATES, type Sheet } from "@/lib/schedule/data-model"
import * as Popover from "@radix-ui/react-popover"
import * as AlertDialog from "@radix-ui/react-alert-dialog"

export default function SheetTabs({
  sheets,
  activeSheetId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  onReorder,
}: {
  sheets: Sheet[]
  activeSheetId: string
  onSelect: (id: string) => void
  onAdd: (template: "blank" | "actividades" | "turnos" | "deportes") => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onReorder: (from: number, to: number) => void
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [sheetToDelete, setSheetToDelete] = useState<Sheet | null>(null)
  const dragRef = useRef<number | null>(null)

  const startRename = (sheet: Sheet, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingId(sheet.id)
    setRenameValue(sheet.name)
  }

  const commitRename = (id: string) => {
    const v = renameValue.trim()
    if (v) onRename(id, v)
    setRenamingId(null)
  }

  return (
    <>
      <div className="flex items-end gap-0.5 border-b border-border px-2 overflow-x-auto bg-surface/50 hh-no-print">
        {sheets.map((sheet, idx) => {
          const active = sheet.id === activeSheetId
          return (
            <div
              key={sheet.id}
              draggable
              onDragStart={(e) => {
                dragRef.current = idx
                e.dataTransfer.effectAllowed = "move"
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const from = dragRef.current
                if (from !== null && from !== idx) onReorder(from, idx)
                dragRef.current = null
              }}
              onClick={() => onSelect(sheet.id)}
              onDoubleClick={(e) => startRename(sheet, e)}
              className={cn(
                "group relative flex items-center gap-2 px-3 pt-2 pb-2 text-sm cursor-pointer select-none shrink-0 rounded-t-md border-x border-t transition-colors",
                active
                  ? "bg-background border-border text-foreground"
                  : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-surface/60",
              )}
              style={
                active
                  ? { boxShadow: `inset 0 2px 0 0 ${sheet.color}` }
                  : undefined
              }
              title="Doble clic para renombrar"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: sheet.color }}
              />
              {renamingId === sheet.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(sheet.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(sheet.id)
                    if (e.key === "Escape") setRenamingId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent outline-none text-sm min-w-[80px] max-w-[160px] border-b border-accent"
                />
              ) : (
                <span className="truncate max-w-[180px]">{sheet.name}</span>
              )}
              {sheets.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSheetToDelete(sheet)
                  }}
                  className={cn(
                    "p-0.5 rounded hover:bg-danger-soft hover:text-danger transition-all",
                    active ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-60",
                  )}
                  aria-label={`Eliminar ${sheet.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )
        })}

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 mb-1 ml-1 rounded-md text-dim hover:text-accent hover:bg-accent-soft text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva hoja
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="top"
              align="start"
              sideOffset={6}
              className="hh-pop z-50 w-64 rounded-lg border border-border bg-surface shadow-2xl p-1 animate-in fade-in-0 zoom-in-95"
            >
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-dim">
                Crear desde plantilla
              </div>
              {SHEET_TEMPLATES.map((t) => (
                <Popover.Close asChild key={t.key}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 px-2 py-1.5 text-left rounded hover:bg-surface-2"
                    onClick={() => onAdd(t.key)}
                  >
                    <span className="text-sm text-foreground">{t.label}</span>
                    <span className="text-[11px] text-dim">{t.description}</span>
                  </button>
                </Popover.Close>
              ))}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <AlertDialog.Root
        open={!!sheetToDelete}
        onOpenChange={(open) => { if (!open) setSheetToDelete(null) }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in-0" />
          <AlertDialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-xl border border-border bg-surface shadow-2xl p-6 animate-in fade-in-0 zoom-in-95">
            <AlertDialog.Title className="text-base font-semibold text-foreground">
              ¿Eliminar hoja?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              Se eliminará{" "}
              <span className="font-medium text-foreground">
                "{sheetToDelete?.name}"
              </span>{" "}
              y se perderán todas sus filas. Esta acción no se puede deshacer.
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md text-sm border border-border hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md text-sm bg-danger text-white hover:bg-danger/90 transition-colors"
                  onClick={() => {
                    if (sheetToDelete) onDelete(sheetToDelete.id)
                    setSheetToDelete(null)
                  }}
                >
                  Eliminar
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}