"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Hexagon, Printer, Sparkles, Layout, Share2, MousePointer2, ShieldCheck, Globe } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import {
  COLUMN_TYPES,
  type CellValue,
  type Column,
  type ScheduleState,
  type Sheet,
  createColumn,
  createInitialState,
  createRow,
  createSheet,
  duplicateRow as duplicateRowFn,
} from "@/lib/schedule/data-model"
import { loadFromURL, saveToURL } from "@/lib/schedule/url-state"
import SheetGrid from "./sheet-grid"
import SheetTabs from "./sheet-tabs"
import PrintView from "./print-view"
import SharePopover from "./share-popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function ScheduleApp() {
  const [state, setState] = useState<ScheduleState | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fromURL = loadFromURL()
    setState(fromURL ?? createInitialState())

    const hasVisited = localStorage.getItem("horarios-app-visited")
    if (!hasVisited) {
      setIsWelcomeOpen(true)
      localStorage.setItem("horarios-app-visited", "true")
    }
  }, [])

  useEffect(() => {
    if (!state) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveToURL(state), 500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state])

  const activeSheet: Sheet | undefined = useMemo(
    () => state?.sheets.find((s) => s.id === state.activeSheetId) ?? state?.sheets[0],
    [state],
  )

  const updateState = useCallback(
    (updater: (prev: ScheduleState) => ScheduleState) => {
      setState((prev) => (prev ? updater(prev) : prev))
    },
    [],
  )

  const addSheet = useCallback(
    (template: "blank" | "actividades" | "turnos" | "deportes") => {
      updateState((prev) => {
        const name = `Hoja ${prev.sheets.length + 1}`
        const newSheet = createSheet(name, template, prev.sheets.length)
        return {
          ...prev,
          sheets: [...prev.sheets, newSheet],
          activeSheetId: newSheet.id,
        }
      })
    },
    [updateState],
  )

  const deleteSheet = useCallback(
    (sheetId: string) => {
      updateState((prev) => {
        if (prev.sheets.length === 1) return prev
        const sheets = prev.sheets.filter((s) => s.id !== sheetId)
        const activeSheetId =
          prev.activeSheetId === sheetId ? sheets[0].id : prev.activeSheetId
        return { ...prev, sheets, activeSheetId }
      })
    },
    [updateState],
  )

  const renameSheet = useCallback(
    (sheetId: string, name: string) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => (s.id === sheetId ? { ...s, name } : s)),
      }))
    },
    [updateState],
  )

  const reorderSheets = useCallback(
    (from: number, to: number) => {
      updateState((prev) => {
        const sheets = [...prev.sheets]
        const [r] = sheets.splice(from, 1)
        sheets.splice(to, 0, r)
        return { ...prev, sheets }
      })
    },
    [updateState],
  )

  const updateColumn = useCallback(
    (sheetId: string, colId: string, changes: Partial<Column>) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) =>
          s.id !== sheetId
            ? s
            : {
              ...s,
              columns: s.columns.map((c) =>
                c.id !== colId ? c : { ...c, ...changes },
              ),
            },
        ),
      }))
    },
    [updateState],
  )

  const addColumn = useCallback(
    (sheetId: string) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id !== sheetId) return s
          const col = createColumn("Nueva columna", COLUMN_TYPES.TEXT)
          return {
            ...s,
            columns: [...s.columns, col],
            rows: s.rows.map((r) => ({
              ...r,
              cells: { ...r.cells, [col.id]: "" as CellValue },
            })),
          }
        }),
      }))
    },
    [updateState],
  )

  const deleteColumn = useCallback(
    (sheetId: string, colId: string) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id !== sheetId) return s
          return {
            ...s,
            columns: s.columns.filter((c) => c.id !== colId),
            rows: s.rows.map((r) => {
              const { [colId]: _drop, ...rest } = r.cells
              return { ...r, cells: rest }
            }),
          }
        }),
      }))
    },
    [updateState],
  )

  const resizeColumn = useCallback(
    (sheetId: string, colId: string, width: number) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) =>
          s.id !== sheetId
            ? s
            : {
              ...s,
              columns: s.columns.map((c) =>
                c.id !== colId ? c : { ...c, width: Math.max(60, width) },
              ),
            },
        ),
      }))
    },
    [updateState],
  )

  const addRow = useCallback(
    (sheetId: string, atIndex?: number) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id !== sheetId) return s
          const newRow = createRow(s.columns)
          const rows = [...s.rows]
          if (atIndex !== undefined) rows.splice(atIndex + 1, 0, newRow)
          else rows.push(newRow)
          return { ...s, rows }
        }),
      }))
    },
    [updateState],
  )

  const deleteRow = useCallback(
    (sheetId: string, rowId: string) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) =>
          s.id !== sheetId ? s : { ...s, rows: s.rows.filter((r) => r.id !== rowId) },
        ),
      }))
    },
    [updateState],
  )

  const updateCell = useCallback(
    (sheetId: string, rowId: string, colId: string, value: CellValue) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) =>
          s.id !== sheetId
            ? s
            : {
              ...s,
              rows: s.rows.map((r) =>
                r.id !== rowId
                  ? r
                  : { ...r, cells: { ...r.cells, [colId]: value } },
              ),
            },
        ),
      }))
    },
    [updateState],
  )

  const duplicateRow = useCallback(
    (sheetId: string, rowId: string) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id !== sheetId) return s
          const idx = s.rows.findIndex((r) => r.id === rowId)
          if (idx === -1) return s
          const rows = [...s.rows]
          rows.splice(idx + 1, 0, duplicateRowFn(s.rows[idx]))
          return { ...s, rows }
        }),
      }))
    },
    [updateState],
  )

  const reorderRows = useCallback(
    (sheetId: string, from: number, to: number) => {
      updateState((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id !== sheetId) return s
          const rows = [...s.rows]
          const [r] = rows.splice(from, 1)
          rows.splice(to, 0, r)
          return { ...s, rows }
        }),
      }))
    },
    [updateState],
  )

  const handlePrint = () => {
    setIsPrinting(true)
    const t = setTimeout(() => window.print(), 180)
    const done = () => {
      setIsPrinting(false)
      window.removeEventListener("afterprint", done)
      clearTimeout(t)
    }
    window.addEventListener("afterprint", done)
  }

  const handleImport = (imported: ScheduleState) => {
    const safe: ScheduleState = {
      title: imported.title || "Mi Horario",
      sheets: imported.sheets.map((s) => ({
        id: s.id || uuidv4(),
        name: s.name || "Hoja",
        color: s.color || "#14b8a6",
        columns: s.columns.map((c) => ({ ...c, id: c.id || uuidv4() })),
        rows: s.rows.map((r) => ({ ...r, id: r.id || uuidv4() })),
      })),
      activeSheetId: "",
    }
    safe.activeSheetId = imported.activeSheetId || safe.sheets[0]?.id || ""
    setState(safe)
  }

  if (!state) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hexagon className="w-4 h-4 animate-pulse text-accent" />
          <span className="text-sm">Cargando…</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {isPrinting && <PrintView state={state} />}

      <div
        className={
          isPrinting
            ? "hh-no-print flex flex-col h-dvh"
            : "flex flex-col h-dvh"
        }
      >
        <header className="shrink-0 flex items-center justify-between gap-3 px-3 sm:px-5 h-14 border-b border-border bg-surface/60 backdrop-blur-sm hh-no-print">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent-soft text-accent shrink-0">
              <Hexagon className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-[0.18em] text-dim font-medium">
                Muhaddil Horarios
              </span>
              {editingTitle ? (
                <input
                  autoFocus
                  value={state.title}
                  onChange={(e) =>
                    setState((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev,
                    )
                  }
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingTitle(false)
                    if (e.key === "Escape") setEditingTitle(false)
                  }}
                  className="bg-transparent outline-none text-base sm:text-lg font-semibold tracking-tight border-b border-accent w-full max-w-[360px]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTitle(true)}
                  className="text-base sm:text-lg font-semibold tracking-tight text-left hover:text-accent transition-colors truncate max-w-[220px] sm:max-w-[360px]"
                  title="Haz clic para editar"
                >
                  {state.title}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://muhaddil.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-3 h-9 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              title="Otras páginas de Muhaddil"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Otras páginas</span>
            </a>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-md px-3 h-9 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <SharePopover state={state} onImport={handleImport} />
          </div>
        </header>

        <SheetTabs
          sheets={state.sheets}
          activeSheetId={state.activeSheetId}
          onSelect={(id) =>
            setState((prev) =>
              prev ? { ...prev, activeSheetId: id } : prev,
            )
          }
          onAdd={addSheet}
          onDelete={deleteSheet}
          onRename={renameSheet}
          onReorder={reorderSheets}
        />

        {activeSheet && (
          <SheetGrid
            key={activeSheet.id}
            sheet={activeSheet}
            onUpdateCell={(rowId, colId, val) =>
              updateCell(activeSheet.id, rowId, colId, val)
            }
            onAddRow={(atIdx) => addRow(activeSheet.id, atIdx)}
            onDeleteRow={(rowId) => deleteRow(activeSheet.id, rowId)}
            onDuplicateRow={(rowId) => duplicateRow(activeSheet.id, rowId)}
            onAddColumn={() => addColumn(activeSheet.id)}
            onUpdateColumn={(colId, ch) =>
              updateColumn(activeSheet.id, colId, ch)
            }
            onDeleteColumn={(colId) => deleteColumn(activeSheet.id, colId)}
            onResizeColumn={(colId, w) =>
              resizeColumn(activeSheet.id, colId, w)
            }
            onReorderRows={(from, to) =>
              reorderRows(activeSheet.id, from, to)
            }
          />
        )}

        <div className="shrink-0 flex items-center justify-between gap-4 px-4 h-8 border-t border-border bg-surface/50 text-[11px] text-dim font-mono hh-no-print">
          <span>
            {activeSheet?.rows.length ?? 0} filas · {activeSheet?.columns.length ?? 0} columnas
          </span>
          <span className="hidden sm:inline">
            Se guarda automáticamente en la URL
          </span>
        </div>
      </div>

      <Dialog open={isWelcomeOpen} onOpenChange={setIsWelcomeOpen}>
        <DialogContent className="sm:max-w-[500px] border-accent/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-accent" />
              ¡Bienvenido a Muhaddil Horarios!
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Tu nueva herramienta para organizar horarios de forma rápida y sencilla.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-accent/10 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Privacidad Local (Sin Servidores)</h4>
                <p className="text-sm text-muted-foreground">Tus datos no se guardan en ninguna base de datos externa. Todo vive en tu navegador y en la URL que generas.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-accent/10 p-2 rounded-lg">
                <Layout className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Organización por Pestañas</h4>
                <p className="text-sm text-muted-foreground">Crea diferentes hojas para tus actividades, turnos o deportes usando plantillas.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-accent/10 p-2 rounded-lg">
                <MousePointer2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Edición Intuitiva</h4>
                <p className="text-sm text-muted-foreground">Haz clic en cualquier celda para editar. Cambia el título o añade filas y columnas fácilmente.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-accent/10 p-2 rounded-lg">
                <Share2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Comparte al Instante</h4>
                <p className="text-sm text-muted-foreground">Todo se guarda en la URL. Copia el enlace o genera un QR para que otros vean tu horario.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setIsWelcomeOpen(false)} 
              className="w-full bg-accent hover:bg-accent/90 text-white"
            >
              ¡Entendido, empezar a crear!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
