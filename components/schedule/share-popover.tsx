"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import {
  Check,
  ClipboardCopy,
  Copy,
  Download,
  FileJson,
  Link2,
  QrCode,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ScheduleState } from "@/lib/schedule/data-model"
import {
  estimateShareSize,
  getShareURL,
} from "@/lib/schedule/url-state"

type Tab = "link" | "qr" | "json"

const QR_SAFE_LIMIT = 2_500

export default function SharePopover({
  state,
  onImport,
}: {
  state: ScheduleState
  onImport: (imported: ScheduleState) => void
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("link")
  const [copied, setCopied] = useState<"url" | "json" | null>(null)
  const [pasted, setPasted] = useState("")
  const [qrDataURL, setQrDataURL] = useState("")
  const [qrError, setQrError] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const [url, setUrl] = useState("")
  const [size, setSize] = useState(0)

  useEffect(() => {
    if (!open) return
    setUrl(getShareURL(state))
    setSize(estimateShareSize(state))
  }, [open, state])

  useEffect(() => {
    if (!open) return
    const click = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", click)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", click)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  useEffect(() => {
    if (!open || tab !== "qr" || !url) return
    setQrError(null)
    if (url.length > QR_SAFE_LIMIT) {
      setQrError(
        "El horario es demasiado grande para un QR fiable. Usa el enlace o el JSON.",
      )
      setQrDataURL("")
      return
    }
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "L",
      margin: 1,
      width: 260,
      color: { dark: "#0b1014", light: "#eaf2f0" },
    })
      .then(setQrDataURL)
      .catch(() => setQrError("No se pudo generar el QR."))
  }, [open, tab, url])

  const writeClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }

  const copyURL = async () => {
    const ok = await writeClipboard(getShareURL(state))
    if (ok) {
      setCopied("url")
      setTimeout(() => setCopied(null), 1600)
    }
  }

  const copyJSON = async () => {
    const ok = await writeClipboard(JSON.stringify(state, null, 2))
    if (ok) {
      setCopied("json")
      setTimeout(() => setCopied(null), 1600)
    }
  }

  const downloadJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      })
      const href = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = href
      a.download = `${(state.title || "horario").replace(/\s+/g, "_")}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(href), 1000)
    } catch {
      void copyJSON()
    }
  }

  const importFromPaste = () => {
    const text = pasted.trim()
    if (!text) return
    try {
      const parsed = JSON.parse(text) as ScheduleState
      if (
        parsed &&
        Array.isArray((parsed as ScheduleState).sheets) &&
        typeof (parsed as ScheduleState).title === "string"
      ) {
        onImport(parsed)
        setPasted("")
        setOpen(false)
      } else {
        alert("El JSON no tiene la forma esperada.")
      }
    } catch {
      alert("No se pudo leer el JSON. Revisa el formato.")
    }
  }

  const sizeKb = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} kB`
  const sizePct = Math.min(100, Math.round((size / 6000) * 100))
  const sizeTone =
    size < 1500
      ? "text-success"
      : size < 3500
        ? "text-highlight"
        : "text-danger"
  const sizeBar =
    size < 1500
      ? "bg-success"
      : size < 3500
        ? "bg-highlight"
        : "bg-danger"

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md px-3 h-9 text-sm font-medium bg-accent text-accent-foreground hover:bg-accent-strong transition-colors"
      >
        <Link2 className="w-4 h-4" />
        Compartir
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Compartir horario"
          className="hh-pop absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-surface shadow-2xl overflow-hidden z-50"
        >
          <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Compartir</div>
              <p className="text-[11px] text-dim mt-0.5 leading-relaxed">
                Todo el contenido viaja en el enlace. Sin servidor.
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className={cn("text-[10px] font-mono", sizeTone)}>
                {sizeKb}
              </span>
              <div className="mt-1 w-16 h-1 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all", sizeBar)}
                  style={{ width: `${sizePct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mx-3 flex gap-0.5 p-0.5 bg-surface-2/60 rounded-md">
            {(
              [
                { key: "link", label: "Enlace", Icon: Link2 },
                { key: "qr", label: "QR", Icon: QrCode },
                { key: "json", label: "JSON", Icon: FileJson },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 h-7 rounded text-xs font-medium transition-colors",
                  tab === key
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-3">
            {tab === "link" && (
              <div className="hh-fade">
                <div className="flex items-center gap-1.5 rounded-md bg-background border border-border pl-2.5 pr-1 h-9">
                  <span className="truncate text-xs font-mono text-muted-foreground flex-1">
                    {url.replace(/^https?:\/\//, "")}
                  </span>
                  <button
                    type="button"
                    onClick={copyURL}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium transition-all",
                      copied === "url"
                        ? "bg-success/15 text-success"
                        : "bg-accent text-accent-foreground hover:bg-accent-strong",
                    )}
                  >
                    {copied === "url" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-dim mt-2 leading-relaxed">
                  Compatible con WhatsApp, correo y marcadores.
                </p>
              </div>
            )}

            {tab === "qr" && (
              <div className="hh-fade">
                <div className="rounded-md bg-[#eaf2f0] border border-border p-3 flex items-center justify-center min-h-[240px]">
                  {qrError ? (
                    <p className="text-[11px] text-danger text-center px-3">
                      {qrError}
                    </p>
                  ) : qrDataURL ? (
                    <img
                      src={qrDataURL || "/placeholder.svg"}
                      alt="Código QR con el enlace al horario"
                      width={220}
                      height={220}
                      className="rounded"
                    />
                  ) : (
                    <div className="h-[220px] w-[220px] animate-pulse bg-surface-2/40 rounded" />
                  )}
                </div>
                <p className="text-[11px] text-dim text-center mt-2">
                  Escanea con la cámara del móvil.
                </p>
              </div>
            )}

            {tab === "json" && (
              <div className="hh-fade space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={downloadJSON}
                    className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-medium text-foreground transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </button>
                  <button
                    type="button"
                    onClick={copyJSON}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-medium transition-colors",
                      copied === "json"
                        ? "bg-success/15 text-success"
                        : "bg-surface-2 hover:bg-surface-3 text-foreground",
                    )}
                  >
                    {copied === "json" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="w-3.5 h-3.5" />
                        Copiar JSON
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-1">
                  <label className="text-[11px] text-dim block mb-1">
                    Pega un JSON para importar
                  </label>
                  <textarea
                    value={pasted}
                    onChange={(e) => setPasted(e.target.value)}
                    placeholder='{ "title": "...", "sheets": [...] }'
                    rows={4}
                    className="w-full rounded-md bg-background border border-border px-2.5 py-2 text-[11px] font-mono text-foreground placeholder:text-dim outline-none focus:border-accent resize-none"
                  />
                  <button
                    type="button"
                    onClick={importFromPaste}
                    disabled={!pasted.trim()}
                    className="mt-1.5 w-full h-8 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Importar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
