import LZString from "lz-string"
import { v4 as uuidv4 } from "uuid"
import {
  COLUMN_TYPES,
  type Column,
  type ColumnType,
  type Row,
  type ScheduleState,
  type Sheet,
} from "./data-model"

/**
 * Compact serialization format.
 *
 *   [title, activeSheetIdx, [
 *     [sheetName, color, [
 *        [colName, typeCode]                    // no custom width, no options
 *      | [colName, typeCode, width]             // no options
 *      | [colName, typeCode, width, options[]]  // full
 *     ], [
 *        [cell0, cell1, …]                      // positional, aligned with columns
 *     ]]
 *   ]]
 */
const TYPE_CODES: Record<ColumnType, number> = {
  text: 0,
  time: 1,
  select: 2,
  multi_select: 3,
  notes: 4,
  number: 5,
}
const CODE_TYPES: Record<number, ColumnType> = {
  0: COLUMN_TYPES.TEXT,
  1: COLUMN_TYPES.TIME,
  2: COLUMN_TYPES.SELECT,
  3: COLUMN_TYPES.MULTI_SELECT,
  4: COLUMN_TYPES.NOTES,
  5: COLUMN_TYPES.NUMBER,
}
const DEFAULT_WIDTH = 160

type CompactCol =
  | [string, number]
  | [string, number, number]
  | [string, number, number, string[]]
type CompactSheet = [
  string, // name
  string, // color
  CompactCol[],
  Array<Array<string | string[]>>,
]
type Compact = [string, number, CompactSheet[]]

function isCompactShape(parsed: unknown): parsed is Compact {
  return (
    Array.isArray(parsed) &&
    parsed.length === 3 &&
    typeof parsed[0] === "string" &&
    typeof parsed[1] === "number" &&
    Array.isArray(parsed[2])
  )
}

export function encodeState(state: ScheduleState): string | null {
  try {
    const sheetsC: CompactSheet[] = state.sheets.map((s) => {
      const cols: CompactCol[] = s.columns.map((c) => {
        const hasOpts = c.options.length > 0
        const width = c.width ?? DEFAULT_WIDTH
        const hasWidth = width !== DEFAULT_WIDTH
        const typeCode = TYPE_CODES[c.type] ?? 0
        if (hasOpts) return [c.name, typeCode, width, c.options]
        if (hasWidth) return [c.name, typeCode, width]
        return [c.name, typeCode]
      })
      const rows = s.rows.map((r) =>
        s.columns.map((c) => {
          const v = r.cells[c.id]
          if (v == null) return c.type === COLUMN_TYPES.MULTI_SELECT ? [] : ""
          return v
        }),
      )
      return [s.name, s.color, cols, rows]
    })
    const activeIdx = Math.max(
      0,
      state.sheets.findIndex((s) => s.id === state.activeSheetId),
    )
    const compact: Compact = [state.title, activeIdx, sheetsC]
    const json = JSON.stringify(compact)
    return LZString.compressToEncodedURIComponent(json)
  } catch {
    return null
  }
}

export function decodeState(encoded: string): ScheduleState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const parsed = JSON.parse(json) as unknown

    if (
      !isCompactShape(parsed) &&
      parsed &&
      typeof parsed === "object" &&
      "sheets" in (parsed as Record<string, unknown>)
    ) {
      return parsed as ScheduleState
    }
    if (!isCompactShape(parsed)) return null

    const [title, activeIdx, sheetsC] = parsed
    const sheets: Sheet[] = sheetsC.map((sc) => {
      const [name, color, colsC, rowsC] = sc
      const columns: Column[] = colsC.map((cc) => {
        const colName = cc[0]
        const typeCode = cc[1]
        const width = typeof cc[2] === "number" ? cc[2] : DEFAULT_WIDTH
        const opts = Array.isArray(cc[3]) ? (cc[3] as string[]) : []
        return {
          id: uuidv4(),
          name: colName,
          type: CODE_TYPES[typeCode] ?? COLUMN_TYPES.TEXT,
          width,
          options: opts,
        }
      })
      const rows: Row[] = (rowsC ?? []).map((cells) => {
        const obj: Record<string, string | string[]> = {}
        columns.forEach((c, i) => {
          const v = cells?.[i]
          obj[c.id] = Array.isArray(v)
            ? (v as string[])
            : typeof v === "string"
              ? v
              : c.type === COLUMN_TYPES.MULTI_SELECT
                ? []
                : ""
        })
        return { id: uuidv4(), cells: obj }
      })
      return { id: uuidv4(), name, color, columns, rows }
    })
    const activeSheetId =
      sheets[Math.min(activeIdx, sheets.length - 1)]?.id ??
      sheets[0]?.id ??
      ""
    return { title, sheets, activeSheetId }
  } catch {
    return null
  }
}

export function saveToURL(state: ScheduleState) {
  if (typeof window === "undefined") return
  const encoded = encodeState(state)
  if (encoded) {
    window.history.replaceState(null, "", "#" + encoded)
  }
}

export function loadFromURL(): ScheduleState | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash.slice(1)
  if (!hash) return null
  return decodeState(hash)
}

export function getShareURL(state: ScheduleState): string {
  if (typeof window === "undefined") return ""
  const encoded = encodeState(state)
  const base = window.location.origin + window.location.pathname
  return encoded ? `${base}#${encoded}` : base
}

export function estimateShareSize(state: ScheduleState): number {
  const encoded = encodeState(state)
  return encoded ? encoded.length : 0
}
