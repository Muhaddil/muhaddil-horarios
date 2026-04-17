"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import { Check, Plus, X, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Column } from "@/lib/schedule/data-model"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"
import { format, parseISO, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as Popover from "@radix-ui/react-popover"

const TAG_PALETTE = [
  { bg: "rgba(20,184,166,0.15)", fg: "#5eead4" }, // teal
  { bg: "rgba(16,185,129,0.15)", fg: "#6ee7b7" }, // emerald
  { bg: "rgba(245,158,11,0.16)", fg: "#fcd34d" }, // amber
  { bg: "rgba(59,130,246,0.15)", fg: "#93c5fd" }, // blue
  { bg: "rgba(6,182,212,0.15)", fg: "#67e8f9" }, // cyan
  { bg: "rgba(236,72,153,0.14)", fg: "#f9a8d4" }, // pink
  { bg: "rgba(239,68,68,0.14)", fg: "#fca5a5" }, // red
]

function tagColor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

const baseInput =
  "w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-dim " +
  "border-0 outline-none focus:bg-surface-2 rounded-sm transition-colors"

export function TextCell({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      className={baseInput}
      value={(value as string) || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
    />
  )
}

export function TimeCell({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => { setDraft(value) }, [value])

  const [h, m] = value ? value.split(":").map(Number) : [null, null]

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  const setHour = (hh: number) => {
    const next = `${String(hh).padStart(2, "0")}:${m !== null ? String(m).padStart(2, "0") : "00"}`
    onChange(next)
    setDraft(next)
  }
  const setMinute = (mm: number) => {
    const next = `${h !== null ? String(h).padStart(2, "0") : "00"}:${String(mm).padStart(2, "0")}`
    onChange(next)
    setDraft(next)
  }

  const commitDraft = (raw: string) => {
    const clean = raw.trim()
    const match =
      clean.match(/^(\d{1,2}):(\d{2})$/) ||
      clean.match(/^(\d{2})(\d{2})$/)
    if (match) {
      const hh = parseInt(match[1])
      const mm = parseInt(match[2])
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        const next = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
        onChange(next)
        setDraft(next)
        return
      }
    }
    if (clean === "") {
      onChange("")
      setDraft("")
      return
    }
    setDraft(value)
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2 rounded-sm transition-colors text-left"
        >
          <ClockIcon className="w-3.5 h-3.5 text-dim shrink-0" />
          {value ? (
            <span className="font-mono tabular-nums">{value}</span>
          ) : (
            <span className="text-dim">—</span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="hh-pop z-50 rounded-xl border border-border bg-surface shadow-2xl p-3 animate-in fade-in-0 zoom-in-95 w-41"
        >
          <input
            className="w-full text-center font-mono text-2xl font-semibold bg-surface-2 rounded-lg px-3 py-2 mb-3 outline-none border border-transparent focus:border-accent tabular-nums tracking-widest transition-colors"
            value={draft}
            placeholder="00:00"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commitDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitDraft((e.target as HTMLInputElement).value)
                e.currentTarget.blur()
              }
              if (e.key === "Escape") {
                setDraft(value)
                e.currentTarget.blur()
              }
            }}
            maxLength={5}
          />

          <div className="flex gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-dim text-center mb-1">H</span>
              <div className="h-48 overflow-y-auto scrollbar-thin flex flex-col gap-0.5 pr-1">
                {hours.map((hh) => (
                  <button
                    key={hh}
                    type="button"
                    onClick={() => setHour(hh)}
                    className={cn(
                      "w-14 py-1.5 rounded text-sm font-mono tabular-nums text-center transition-colors",
                      h === hh
                        ? "bg-accent text-white font-semibold"
                        : "hover:bg-surface-2 text-foreground",
                    )}
                  >
                    {String(hh).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px bg-border self-stretch" />

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-dim text-center mb-1">MIN</span>
              <div className="h-48 overflow-y-auto flex flex-col gap-0.5 pl-1">
                {minutes.map((mm) => (
                  <button
                    key={mm}
                    type="button"
                    onClick={() => setMinute(mm)}
                    className={cn(
                      "w-14 py-1.5 rounded text-sm font-mono tabular-nums text-center transition-colors",
                      m === mm
                        ? "bg-accent text-white font-semibold"
                        : "hover:bg-surface-2 text-foreground",
                    )}
                  >
                    {String(mm).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {value && (
            <div className="mt-2 pt-2 border-t border-border flex justify-end">
              <Popover.Close asChild>
                <button
                  type="button"
                  className="text-xs text-dim hover:text-danger transition-colors"
                  onClick={() => { onChange(""); setDraft("") }}
                >
                  Borrar hora
                </button>
              </Popover.Close>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function DateCell({
  value,
  onChange,
}: {
  value: string        // ISO: "2025-06-14"  o ""
  onChange: (v: string) => void
}) {
  const parsed = value && isValid(parseISO(value)) ? parseISO(value) : undefined

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2 rounded-sm transition-colors text-left"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-dim shrink-0" />
          {parsed ? (
            <span className="tabular-nums">
              {format(parsed, "dd MMM yyyy", { locale: es })}
            </span>
          ) : (
            <span className="text-dim">—</span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="hh-pop z-50 rounded-xl border border-border bg-surface shadow-2xl p-3 animate-in fade-in-0 zoom-in-95"
        >
          <DayPicker
            mode="single"
            locale={es}
            selected={parsed}
            defaultMonth={parsed}
            onSelect={(day) => onChange(day ? format(day, "yyyy-MM-dd") : "")}
            classNames={{
              root: "text-sm",
              months: "flex flex-col",
              month: "space-y-2",
              caption: "flex items-center justify-between px-1",
              caption_label: "text-sm font-semibold text-foreground capitalize",
              nav: "flex items-center gap-1",
              nav_button: "p-1 rounded hover:bg-surface-2 text-dim hover:text-foreground transition-colors",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "w-9 text-[11px] font-medium text-dim text-center uppercase",
              row: "flex mt-1",
              cell: "w-9 h-9 text-center p-0",
              day: "w-9 h-9 rounded-lg text-sm hover:bg-surface-2 transition-colors text-foreground",
              day_selected: "!bg-accent !text-white font-semibold",
              day_today: "font-bold text-accent",
              day_outside: "text-dim opacity-40",
              day_disabled: "opacity-25 cursor-not-allowed",
            }}
            footer={
              parsed && (
                <div className="mt-2 pt-2 border-t border-border flex justify-end">
                  <Popover.Close asChild>
                    <button
                      type="button"
                      className="text-xs text-dim hover:text-danger transition-colors"
                      onClick={() => onChange("")}
                    >
                      Borrar fecha
                    </button>
                  </Popover.Close>
                </div>
              )
            }
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function NumberCell({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="number"
      className={cn(baseInput, "font-mono tabular-nums")}
      value={(value as string) || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
    />
  )
}

export function NotesCell({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 240) + "px"
  }, [value])

  return (
    <textarea
      ref={ref}
      className={cn(
        baseInput,
        "resize-none leading-relaxed min-h-[36px] overflow-hidden",
      )}
      value={(value as string) || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Notas…"
      rows={1}
    />
  )
}

export function SelectCell({
  value,
  onChange,
  column,
  onUpdateColumn,
}: {
  value: string
  onChange: (v: string) => void
  column: Column
  onUpdateColumn: (changes: Partial<Column>) => void
}) {
  const [open, setOpen] = useState(false)
  const [newOpt, setNewOpt] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  const addOption = () => {
    const v = newOpt.trim()
    if (!v) return
    if (!column.options.includes(v)) {
      onUpdateColumn({ options: [...column.options, v] })
    }
    onChange(v)
    setNewOpt("")
    setOpen(false)
  }

  const tc = value ? tagColor(String(value)) : null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-start px-3 py-2 text-sm hover:bg-surface-2 rounded-sm transition-colors text-left"
      >
        {value ? (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: tc!.bg, color: tc!.fg }}
          >
            {value as string}
          </span>
        ) : (
          <span className="text-dim text-xs">—</span>
        )}
      </button>

      {open && (
        <div className="hh-pop absolute z-50 left-0 top-full mt-1 min-w-[220px] rounded-lg border border-border bg-surface shadow-2xl p-1">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 rounded"
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
          >
            <X className="w-3 h-3" /> Sin valor
          </button>

          {column.options.map((opt) => {
            const c = tagColor(opt)
            const selected = value === opt
            return (
              <button
                type="button"
                key={opt}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-2 py-1.5 text-sm rounded hover:bg-surface-2",
                  selected && "bg-surface-2",
                )}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
              >
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: c.bg, color: c.fg }}
                >
                  {opt}
                </span>
                {selected && <Check className="w-3.5 h-3.5 text-accent" />}
              </button>
            )
          })}

          <div className="flex items-center gap-1 border-t border-border mt-1 pt-1">
            <input
              ref={inputRef}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-dim"
              placeholder="Nueva opción…"
              value={newOpt}
              onChange={(e) => setNewOpt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addOption()
                }
              }}
            />
            <button
              type="button"
              className="p-1.5 rounded hover:bg-surface-2 text-accent"
              onClick={addOption}
              aria-label="Añadir opción"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function MultiSelectCell({
  value,
  onChange,
  column,
  onUpdateColumn,
}: {
  value: string[] | string
  onChange: (v: string[]) => void
  column: Column
  onUpdateColumn: (changes: Partial<Column>) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const vals: string[] = Array.isArray(value) ? value : value ? [value] : []

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  const toggle = (opt: string) => {
    const next = vals.includes(opt) ? vals.filter((v) => v !== opt) : [...vals, opt]
    onChange(next)
  }

  const allOpts = Array.from(new Set([...column.options, ...vals]))
  const q = search.trim().toLowerCase()
  const displayOpts = q
    ? allOpts.filter((o) => o.toLowerCase().includes(q))
    : allOpts

  const createNew = () => {
    const opt = search.trim()
    if (!opt) return
    if (!column.options.includes(opt)) {
      onUpdateColumn({ options: [...column.options, opt] })
    }
    if (!vals.includes(opt)) onChange([...vals, opt])
    setSearch("")
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center gap-1 px-2 py-1.5 text-sm hover:bg-surface-2 rounded-sm transition-colors min-h-[36px] text-left"
      >
        {vals.length === 0 ? (
          <span className="text-dim text-xs px-1">—</span>
        ) : (
          vals.map((v) => {
            const c = tagColor(v)
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: c.bg, color: c.fg }}
              >
                {v}
                <span
                  role="button"
                  tabIndex={0}
                  className="opacity-70 hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(v)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      e.stopPropagation()
                      toggle(v)
                    }
                  }}
                  aria-label={`Quitar ${v}`}
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            )
          })
        )}
      </button>

      {open && (
        <div className="hh-pop absolute z-50 left-0 top-full mt-1 min-w-[260px] rounded-lg border border-border bg-surface shadow-2xl overflow-hidden">
          <input
            autoFocus
            className="w-full bg-surface-2 px-3 py-2 text-sm outline-none border-b border-border placeholder:text-dim"
            placeholder="Buscar o crear…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter" && search.trim()) {
                e.preventDefault()
                createNew()
              }
            }}
          />
          <div className="max-h-64 overflow-auto p-1">
            {displayOpts.length === 0 && !search && (
              <div className="px-2 py-3 text-xs text-dim text-center">
                Sin opciones todavía. Escribe para crear.
              </div>
            )}
            {displayOpts.map((opt) => {
              const c = tagColor(opt)
              const selected = vals.includes(opt)
              return (
                <button
                  type="button"
                  key={opt}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-2 py-1.5 text-sm rounded hover:bg-surface-2",
                    selected && "bg-surface-2",
                  )}
                  onClick={() => toggle(opt)}
                >
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: c.bg, color: c.fg }}
                  >
                    {opt}
                  </span>
                  {selected && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
              )
            })}
            {search && !displayOpts.includes(search.trim()) && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-surface-2 text-accent"
                onClick={createNew}
              >
                <Plus className="w-3.5 h-3.5" />
                Crear{" "}
                <span className="text-foreground font-medium">
                  &quot;{search.trim()}&quot;
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
