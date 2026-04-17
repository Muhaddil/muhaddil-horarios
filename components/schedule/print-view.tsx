"use client"

import { COLUMN_TYPES, type ScheduleState } from "@/lib/schedule/data-model"

function formatValue(
  type: string,
  value: string | string[] | undefined,
): string {
  if (value === undefined || value === null) return ""
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

export default function PrintView({ state }: { state: ScheduleState }) {
  return (
    <div
      className="hh-print-only"
      style={{
        padding: 24,
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#111",
        background: "#fff",
      }}
    >
      <h1 style={{ margin: 0, marginBottom: 20, fontSize: 20, fontWeight: 700 }}>
        {state.title}
      </h1>

      {state.sheets.map((sheet) => {
        const hasAny = sheet.rows.some((row) =>
          sheet.columns.some((col) => {
            const v = row.cells[col.id]
            return Array.isArray(v) ? v.length > 0 : !!v
          }),
        )
        if (!hasAny) return null

        return (
          <div
            key={sheet.id}
            className="print-sheet"
            style={{ marginBottom: 32 }}
          >
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                margin: 0,
                marginBottom: 8,
                paddingBottom: 4,
                borderBottom: `2px solid ${sheet.color}`,
                color: sheet.color,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {sheet.name}
            </h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 10,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid #d1d5db",
                      padding: "4px 8px",
                      background: "#f3f4f6",
                      textAlign: "left",
                      width: 24,
                    }}
                  >
                    #
                  </th>
                  {sheet.columns.map((col) => (
                    <th
                      key={col.id}
                      style={{
                        border: "1px solid #d1d5db",
                        padding: "4px 8px",
                        background: "#f3f4f6",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows
                  .filter((row) =>
                    sheet.columns.some((col) => {
                      const v = row.cells[col.id]
                      return Array.isArray(v) ? v.length > 0 : !!v
                    }),
                  )
                  .map((row, idx) => (
                    <tr
                      key={row.id}
                      style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                    >
                      <td
                        style={{
                          border: "1px solid #d1d5db",
                          padding: "3px 8px",
                          color: "#6b7280",
                          textAlign: "center",
                        }}
                      >
                        {idx + 1}
                      </td>
                      {sheet.columns.map((col) => (
                        <td
                          key={col.id}
                          style={{
                            border: "1px solid #d1d5db",
                            padding: "3px 8px",
                            verticalAlign: "top",
                            whiteSpace:
                              col.type === COLUMN_TYPES.NOTES
                                ? "pre-wrap"
                                : "normal",
                          }}
                        >
                          {formatValue(col.type, row.cells[col.id] as
                            | string
                            | string[])}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )
      })}

      <div
        style={{
          marginTop: 16,
          fontSize: 9,
          color: "#9ca3af",
          borderTop: "1px solid #e5e7eb",
          paddingTop: 8,
        }}
      >
        Generado con Muhaddil Horarios ·{" "}
        {new Date().toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  )
}
