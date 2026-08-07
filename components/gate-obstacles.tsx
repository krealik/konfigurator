"use client"

import { useRef, useState } from "react"
import type { Prekazka } from "@/lib/gate-config"

interface Props {
  prekazky: Prekazka[]
  /** Približná šírka priestoru, ktorý sa kreslí (mm) — použije sa ako mierka plátna. */
  sirkaPriestoru: number
  /** Približná výška priestoru, ktorý sa kreslí (mm) — použije sa ako mierka plátna. */
  vyskaPriestoru: number
  onChange: (prekazky: Prekazka[]) => void
}

function novaPrekazka(x: number, y: number, w: number, h: number, vyskaPriestoru: number): Prekazka {
  const poziciaOdKraja = Math.round(Math.min(x, x + w))
  const sirka = Math.round(Math.abs(w))
  const yTop = Math.min(y, y + h)
  const yBottom = Math.max(y, y + h)
  const vyskaOd = Math.round(Math.max(0, vyskaPriestoru - yBottom))
  const vyskaDo = Math.round(Math.max(0, vyskaPriestoru - yTop))
  return {
    id: `p${Date.now()}${Math.round(Math.random() * 1000)}`,
    nazov: "Prekážka",
    poziciaOdKraja,
    sirka,
    vyskaOd,
    vyskaDo,
  }
}

function MiniField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        className="w-full rounded border-2 border-input bg-background px-2 py-2 font-mono text-sm font-bold tabular-nums text-foreground outline-none focus:border-primary"
      />
    </label>
  )
}

export function GateObstacles({ prekazky, sirkaPriestoru, vyskaPriestoru, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [kreslim, setKreslim] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  const W = Math.max(200, sirkaPriestoru || 2000)
  const H = Math.max(200, vyskaPriestoru || 1800)
  const marginTop = H * 0.08

  function bodNaPlatne(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const relX = (clientX - rect.left) / rect.width
    const relY = (clientY - rect.top) / rect.height
    return { x: relX * W, y: relY * (H + marginTop) - marginTop }
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    const { x, y } = bodNaPlatne(e.clientX, e.clientY)
    setKreslim({ x, y, w: 0, h: 0 })
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!kreslim) return
    const { x, y } = bodNaPlatne(e.clientX, e.clientY)
    setKreslim((k) => (k ? { ...k, w: x - k.x, h: y - k.y } : k))
  }

  function onPointerUp() {
    if (kreslim && (Math.abs(kreslim.w) > 15 || Math.abs(kreslim.h) > 15)) {
      const nova = novaPrekazka(kreslim.x, kreslim.y, kreslim.w, kreslim.h, H)
      onChange([...prekazky, nova])
    }
    setKreslim(null)
  }

  function uprav(id: string, patch: Partial<Prekazka>) {
    onChange(prekazky.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function zmaz(id: string) {
    onChange(prekazky.filter((p) => p.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Ťahaním myšou/prstom nakresli obdĺžnik na miesto, kde je stĺp, stena, elektroskriňa a podobne. Presné rozmery si potom doladíš v zozname nižšie.
      </p>

      <svg
        ref={svgRef}
        viewBox={`0 ${-marginTop} ${W} ${H + marginTop}`}
        className="h-auto w-full touch-none rounded-md border-2 border-dashed border-input bg-background"
        style={{ aspectRatio: `${W} / ${H + marginTop}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="img"
        aria-label="Plátno na zakreslenie prekážok"
      >
        {/* Mriežka po 500 mm. */}
        <g stroke="rgba(0,0,0,.08)" strokeWidth={2}>
          {Array.from({ length: Math.floor(W / 500) + 1 }, (_, i) => i * 500).map((x) => (
            <line key={`vx${x}`} x1={x} y1={0} x2={x} y2={H} />
          ))}
          {Array.from({ length: Math.floor(H / 500) + 1 }, (_, i) => i * 500).map((y) => (
            <line key={`hy${y}`} x1={0} y1={H - y} x2={W} y2={H - y} />
          ))}
        </g>

        {/* Zem. */}
        <line x1={0} y1={H} x2={W} y2={H} stroke="#383E42" strokeWidth={6} />
        <text x={W - 8} y={H - 10} fontSize={Math.max(16, H / 45)} textAnchor="end" fontFamily="monospace" fill="#5B6166">zem</text>

        {/* Uložené prekážky. */}
        {prekazky.map((p) => {
          const y = H - p.vyskaDo
          const h = Math.max(0, p.vyskaDo - p.vyskaOd)
          return (
            <g key={p.id}>
              <rect x={p.poziciaOdKraja} y={y} width={p.sirka} height={h} fill="rgba(91,97,102,0.25)" stroke="#5B6166" strokeWidth={3} />
              <text x={p.poziciaOdKraja + p.sirka / 2} y={y + h / 2} fontSize={Math.max(14, H / 50)} textAnchor="middle" dominantBaseline="middle" fontFamily="monospace" fontWeight={700} fill="#2A2A2A">
                {p.nazov}
              </text>
            </g>
          )
        })}

        {/* Rozkreslovaný obdĺžnik. */}
        {kreslim && (
          <rect
            x={Math.min(kreslim.x, kreslim.x + kreslim.w)}
            y={Math.min(kreslim.y, kreslim.y + kreslim.h)}
            width={Math.abs(kreslim.w)}
            height={Math.abs(kreslim.h)}
            fill="rgba(56,62,66,0.2)"
            stroke="#383E42"
            strokeWidth={3}
            strokeDasharray="10 8"
          />
        )}
      </svg>

      {prekazky.length === 0 ? (
        <p className="text-sm text-muted-foreground">Zatiaľ žiadne prekážky — nakresli prvú na plátne vyššie.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {prekazky.map((p) => (
            <div key={p.id} className="rounded-md border-2 border-input bg-secondary/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="text"
                  value={p.nazov}
                  onChange={(e) => uprav(p.id, { nazov: e.target.value })}
                  placeholder="napr. stĺp, elektroskriňa..."
                  className="w-full rounded border-2 border-input bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => zmaz(p.id)}
                  aria-label={`Zmazať prekážku ${p.nazov}`}
                  className="shrink-0 rounded border-2 border-destructive/50 px-3 py-2 text-sm font-bold text-destructive hover:bg-destructive/10"
                >
                  Zmazať
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniField label="Pozícia od kraja" value={p.poziciaOdKraja} onChange={(v) => uprav(p.id, { poziciaOdKraja: v })} />
                <MiniField label="Šírka" value={p.sirka} onChange={(v) => uprav(p.id, { sirka: v })} />
                <MiniField label="Výška od" value={p.vyskaOd} onChange={(v) => uprav(p.id, { vyskaOd: v })} />
                <MiniField label="Výška do" value={p.vyskaDo} onChange={(v) => uprav(p.id, { vyskaDo: v })} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
