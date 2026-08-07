"use client"

import type { Prekazka, TypPrekazky } from "@/lib/gate-config"

interface Props {
  navrh: Prekazka
  /** Pozícia na obrazovke (px, viewport), kam sa má popover umiestniť — spravidla miesto, kde používateľ zdvihol prst. */
  screenPos: { x: number; y: number }
  onChange: (p: Prekazka) => void
  onConfirm: () => void
  onCancel: () => void
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

/**
 * Plávajúce okienko, ktoré sa zobrazí HNEĎ po nakreslení prekážky priamo na plátne —
 * bez potreby skrolovať dole do samostatného zoznamu. Používateľ dopíše názov,
 * doladí presné čísla a potvrdí alebo zruší priamo na mieste.
 */
export function ObstaclePopover({ navrh, screenPos, onChange, onConfirm, onCancel }: Props) {
  // Popover sa snaží zmestiť vedľa bodu dotyku, ale neprejsť mimo obrazovku.
  const width = 300
  const left = Math.min(Math.max(8, screenPos.x - width / 2), (typeof window !== "undefined" ? window.innerWidth : 1000) - width - 8)
  const top = Math.max(8, screenPos.y + 16)

  return (
    <>
      {/* Priehľadné pozadie na zatvorenie kliknutím mimo. */}
      <div className="fixed inset-0 z-40" onClick={onCancel} />
      <div
        className="fixed z-50 flex flex-col gap-3 rounded-md border-2 border-primary bg-card p-3 shadow-xl"
        style={{ left, top, width }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          autoFocus
          value={navrh.nazov}
          onChange={(e) => onChange({ ...navrh, nazov: e.target.value })}
          placeholder="napr. stĺp, elektroskriňa..."
          className="w-full rounded border-2 border-input bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary"
        />

        <div className="grid grid-cols-2 gap-2">
          {(["obdlznik", "ciara"] as TypPrekazky[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...navrh, typ: t })}
              className={"rounded border-2 py-1.5 text-xs font-bold transition-colors " +
                (navrh.typ === t ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")}
            >
              {t === "obdlznik" ? "⬜ Obdĺžnik" : "⏐ Čiara / stena"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MiniField label="Pozícia od kraja" value={navrh.poziciaOdKraja} onChange={(v) => onChange({ ...navrh, poziciaOdKraja: v })} />
          <MiniField label={navrh.typ === "ciara" ? "Hrúbka" : "Šírka"} value={navrh.sirka} onChange={(v) => onChange({ ...navrh, sirka: v })} />
          <MiniField label="Výška od (mm)" value={navrh.vyskaOd} onChange={(v) => onChange({ ...navrh, vyskaOd: v })} />
          <MiniField label="Výška do (mm)" value={navrh.vyskaDo} onChange={(v) => onChange({ ...navrh, vyskaDo: v })} />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-md border-2 border-input bg-background py-2.5 text-sm font-bold text-foreground hover:border-destructive hover:text-destructive">
            Zrušiť
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-md border-2 border-primary bg-primary py-2.5 text-sm font-bold text-primary-foreground">
            ✓ Potvrdiť
          </button>
        </div>
      </div>
    </>
  )
}
