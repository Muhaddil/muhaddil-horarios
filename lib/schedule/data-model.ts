import { v4 as uuidv4 } from "uuid"

export const COLUMN_TYPES = {
  TEXT: "text",
  TIME: "time",
  SELECT: "select",
  MULTI_SELECT: "multi_select",
  NOTES: "notes",
  NUMBER: "number",
} as const

export type ColumnType = (typeof COLUMN_TYPES)[keyof typeof COLUMN_TYPES]

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: "Texto",
  time: "Hora",
  select: "Selección",
  multi_select: "Multi-selección",
  notes: "Notas",
  number: "Número",
}

export const COLUMN_TYPE_ICONS: Record<ColumnType, string> = {
  text: "T",
  time: "t",
  select: "s",
  multi_select: "m",
  notes: "n",
  number: "#",
}

export type Column = {
  id: string
  name: string
  type: ColumnType
  width: number
  options: string[]
}

export type CellValue = string | string[]

export type Row = {
  id: string
  cells: Record<string, CellValue>
}

export type Sheet = {
  id: string
  name: string
  columns: Column[]
  rows: Row[]
  color: string
}

export type ScheduleState = {
  title: string
  sheets: Sheet[]
  activeSheetId: string
}

export type CreateColumnOptions = {
  width?: number
  selectOptions?: string[]
}

export function createColumn(
  name: string,
  type: ColumnType = COLUMN_TYPES.TEXT,
  opts: CreateColumnOptions = {},
): Column {
  return {
    id: uuidv4(),
    name,
    type,
    width: opts.width ?? 160,
    options: opts.selectOptions ?? [],
  }
}

export function createRow(columns: Column[]): Row {
  const cells: Record<string, CellValue> = {}
  columns.forEach((c) => {
    cells[c.id] = c.type === COLUMN_TYPES.MULTI_SELECT ? [] : ""
  })
  return { id: uuidv4(), cells }
}

const SHEET_COLORS = [
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
]

export function nextSheetColor(existingCount: number): string {
  return SHEET_COLORS[existingCount % SHEET_COLORS.length]
}

type TemplateKey = "blank" | "actividades" | "turnos" | "deportes"

export const SHEET_TEMPLATES: {
  key: TemplateKey
  label: string
  description: string
}[] = [
  { key: "blank", label: "En blanco", description: "Sólo nombre y notas" },
  {
    key: "actividades",
    label: "Actividades",
    description: "Horarios con hora, lugar y asistentes",
  },
  {
    key: "turnos",
    label: "Turnos",
    description: "Rotaciones de personas por ubicación",
  },
  {
    key: "deportes",
    label: "Deportes",
    description: "Partidos, fases y árbitros",
  },
]

function templateColumns(t: TemplateKey): Column[] {
  switch (t) {
    case "actividades":
      return [
        createColumn("Actividad", COLUMN_TYPES.TEXT, { width: 200 }),
        createColumn("Inicio", COLUMN_TYPES.TIME, { width: 110 }),
        createColumn("Fin", COLUMN_TYPES.TIME, { width: 110 }),
        createColumn("Ubicación", COLUMN_TYPES.TEXT, { width: 160 }),
        createColumn("Asistentes", COLUMN_TYPES.MULTI_SELECT, { width: 260 }),
        createColumn("Notas", COLUMN_TYPES.NOTES, { width: 220 }),
      ]
    case "turnos":
      return [
        createColumn("Persona", COLUMN_TYPES.TEXT, { width: 180 }),
        createColumn("Ubicación", COLUMN_TYPES.SELECT, {
          width: 150,
          selectOptions: ["Polideportivo", "Entrada", "Reserva"],
        }),
        createColumn("Horas", COLUMN_TYPES.TIME, { width: 130 }),
        createColumn("Notas", COLUMN_TYPES.NOTES, { width: 260 }),
      ]
    case "deportes":
      return [
        createColumn("Partido", COLUMN_TYPES.TEXT, { width: 160 }),
        createColumn("Categoría", COLUMN_TYPES.SELECT, {
          width: 140,
          selectOptions: ["LH", "DBH", "Primaria"],
        }),
        createColumn("Hora", COLUMN_TYPES.TIME, { width: 110 }),
        createColumn("Fase", COLUMN_TYPES.SELECT, {
          width: 150,
          selectOptions: [
            "Fase de grupos",
            "Semifinal 1",
            "Semifinal 2",
            "Final",
            "3º y 4º",
          ],
        }),
        createColumn("Campo", COLUMN_TYPES.SELECT, {
          width: 120,
          selectOptions: ["Campo 1", "Campo 2", "Campo 3"],
        }),
        createColumn("Árbitros", COLUMN_TYPES.MULTI_SELECT, { width: 200 }),
        createColumn("Equipos", COLUMN_TYPES.TEXT, { width: 180 }),
        createColumn("Notas", COLUMN_TYPES.NOTES, { width: 200 }),
      ]
    default:
      return [
        createColumn("Nombre", COLUMN_TYPES.TEXT, { width: 220 }),
        createColumn("Notas", COLUMN_TYPES.NOTES, { width: 320 }),
      ]
  }
}

export function createSheet(
  name: string,
  template: TemplateKey = "blank",
  existingCount = 0,
): Sheet {
  const columns = templateColumns(template)
  return {
    id: uuidv4(),
    name,
    columns,
    rows: Array.from({ length: 5 }, () => createRow(columns)),
    color: nextSheetColor(existingCount),
  }
}

export function createInitialState(): ScheduleState {
  const s1 = createSheet("Actividades", "actividades", 0)
  const s2 = createSheet("Turnos", "turnos", 1)
  const s3 = createSheet("Deportes", "deportes", 2)
  return {
    title: "Mi Horario",
    sheets: [s1, s2, s3],
    activeSheetId: s1.id,
  }
}

export function duplicateRow(row: Row): Row {
  return {
    id: uuidv4(),
    cells: Object.fromEntries(
      Object.entries(row.cells).map(([k, v]) => [
        k,
        Array.isArray(v) ? [...v] : v,
      ]),
    ),
  }
}
