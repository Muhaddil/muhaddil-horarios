"use client"

import { useRef, useState } from "react"
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  COLUMN_TYPES,
  type CellValue,
  type Column,
  type Sheet,
} from "@/lib/schedule/data-model"
import ColumnHeader from "./column-header"
import {
  MultiSelectCell,
  NotesCell,
  NumberCell,
  SelectCell,
  TextCell,
  TimeCell,
} from "./cells"

function CellRenderer({
  column,
  value,
  onChange,
  onUpdateColumn,
}: {
  column: Column
  value: CellValue
  onChange: (v: CellValue) => void
  onUpdateColumn: (changes: Partial<Column>) => void
}) {
  switch (column.type) {
    case COLUMN_TYPES.TIME:
      return (
        <TimeCell
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
        />
      )
    case COLUMN_TYPES.NUMBER:
      return (
        <NumberCell
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
        />
      )
    case COLUMN_TYPES.NOTES:
      return (
        <NotesCell
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
        />
      )
    case COLUMN_TYPES.SELECT:
      return (
        <SelectCell
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
          column={column}
          onUpdateColumn={onUpdateColumn}
        />
      )
    case COLUMN_TYPES.MULTI_SELECT:
      return (
        <MultiSelectCell
          value={value as string[]}
          onChange={(v) => onChange(v)}
          column={column}
          onUpdateColumn={onUpdateColumn}
        />
      )
    default:
      return (
        <TextCell
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
        />
      )
  }
}

export default function SheetGrid({
  sheet,
  onUpdateCell,
  onAddRow,
  onDeleteRow,
  onDuplicateRow,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onResizeColumn,
  onReorderRows,
}: {
  sheet: Sheet
  onUpdateCell: (rowId: string, colId: string, value: CellValue) => void
  onAddRow: (atIndex?: number) => void
  onDeleteRow: (rowId: string) => void
  onDuplicateRow: (rowId: string) => void
  onAddColumn: () => void
  onUpdateColumn: (colId: string, changes: Partial<Column>) => void
  onDeleteColumn: (colId: string) => void
  onResizeColumn: (colId: string, width: number) => void
  onReorderRows: (from: number, to: number) => void
}) {
  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const onRowDragStart = (e: React.DragEvent, idx: number) => {
    dragIdx.current = idx
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(idx))
  }

  const onRowDragOver = (e: React.DragEvent, idx: number) => {
    if (dragIdx.current === null || dragIdx.current === idx) return
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const onRowDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    const from = dragIdx.current
    if (from !== null && from !== toIdx) onReorderRows(from, toIdx)
    dragIdx.current = null
    setDragOverIdx(null)
  }

  const totalWidth =
    40 + sheet.columns.reduce((sum, c) => sum + c.width, 0) + 40

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="min-w-full inline-block" style={{ minWidth: totalWidth }}>
        <div className="sticky top-0 z-20 flex bg-surface border-b border-border-strong">
          <div className="w-10 shrink-0 border-r border-border" />
          {sheet.columns.map((col) => (
            <div
              key={col.id}
              className="border-r border-border shrink-0"
              style={{ width: col.width }}
            >
              <ColumnHeader
                column={col}
                onUpdate={(ch) => onUpdateColumn(col.id, ch)}
                onDelete={() => onDeleteColumn(col.id)}
                onResize={(w) => onResizeColumn(col.id, w)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={onAddColumn}
            title="Añadir columna"
            className="w-10 shrink-0 flex items-center justify-center text-dim hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {sheet.rows.map((row, idx) => (
          <div
            key={row.id}
            draggable
            onDragStart={(e) => onRowDragStart(e, idx)}
            onDragOver={(e) => onRowDragOver(e, idx)}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={(e) => onRowDrop(e, idx)}
            onDragEnd={() => {
              dragIdx.current = null
              setDragOverIdx(null)
            }}
            className={cn(
              "flex border-b border-border/70 hover:bg-surface/40 group transition-colors",
              dragOverIdx === idx && "bg-accent-soft",
            )}
          >
            <div className="w-10 shrink-0 border-r border-border flex items-start justify-center pt-1.5 relative">
              <span className="text-[11px] font-mono text-dim group-hover:opacity-0 transition-opacity tabular-nums">
                {idx + 1}
              </span>
              <div className="absolute inset-0 flex items-start justify-center pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col gap-0.5 items-center">
                  <button
                    type="button"
                    className="cursor-grab active:cursor-grabbing p-0.5 text-dim hover:text-foreground"
                    title="Arrastra para reordenar"
                    aria-label="Mover fila"
                  >
                    <GripVertical className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {sheet.columns.map((col) => (
              <div
                key={col.id}
                className="border-r border-border/70 shrink-0"
                style={{ width: col.width }}
              >
                <CellRenderer
                  column={col}
                  value={row.cells[col.id] ?? ""}
                  onChange={(val) => onUpdateCell(row.id, col.id, val)}
                  onUpdateColumn={(ch) => onUpdateColumn(col.id, ch)}
                />
              </div>
            ))}

            <div className="w-10 shrink-0 flex items-start justify-center pt-1 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  className="p-1 rounded text-dim hover:text-accent hover:bg-surface-2"
                  title="Insertar fila abajo"
                  onClick={() => onAddRow(idx)}
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="p-1 rounded text-dim hover:text-foreground hover:bg-surface-2"
                  title="Duplicar fila"
                  onClick={() => onDuplicateRow(row.id)}
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="p-1 rounded text-dim hover:text-danger hover:bg-danger-soft"
                  title="Eliminar fila"
                  onClick={() => onDeleteRow(row.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => onAddRow()}
          className="flex items-center gap-2 w-full text-left text-sm text-dim hover:text-accent hover:bg-surface/40 px-4 py-2.5 border-b border-border/70 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir fila
        </button>
      </div>
    </div>
  )
}
