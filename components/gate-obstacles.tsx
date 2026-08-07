"use client"

import type { Prekazka } from "@/lib/gate-config"

interface Props {
  prekazky: Prekazka[]
  onChange: (prekazky: Prekazka[]) => void
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

export function GateObstacles({ prekazky, onChange }: Props) {
  function uprav(id: string, patch: Partial<Prekazka>) {
    onChange(prekazky.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function zmaz(id: string) {
    onChange(prekazky.filter((p) => p.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Prekážky (stĺp, stena, elektroskriňa…) nakresli priamo v náhľade vpravo tlačidlom „Kresliť prekážky“. Tu si ich vieš doladiť na presné čísla alebo zmazať.
      </p>

      {prekazky.length === 0 ? (
        <p className="text-sm text-muted-foreground">Zatiaľ žiadne prekážky.</p>
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
