"use client"

import { SPOSOBY_KOTVENIA, type Zakaznik, type SposobKotvenia } from "@/lib/gate-config"

interface Props {
  zakaznik: Zakaznik
  onChange: (z: Zakaznik) => void
}

export function ZakaznikForm({ zakaznik, onChange }: Props) {
  const dnes = new Date().toLocaleDateString("sk-SK")

  return (
    <div className="flex flex-col gap-6">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meno zákazníka</span>
        <input
          type="text"
          value={zakaznik.meno}
          onChange={(e) => onChange({ ...zakaznik, meno: e.target.value })}
          placeholder="napr. Ján Novák"
          className="w-full rounded-md border-2 border-input bg-background px-4 py-4 text-lg font-semibold text-foreground outline-none focus:border-primary"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Adresa (voliteľné)</span>
        <input
          type="text"
          value={zakaznik.adresa}
          onChange={(e) => onChange({ ...zakaznik, adresa: e.target.value })}
          placeholder="napr. Nová 12, Považská Bystrica"
          className="w-full rounded-md border-2 border-input bg-background px-4 py-4 text-lg font-semibold text-foreground outline-none focus:border-primary"
        />
      </label>

      <div className="rounded-md border-2 border-input bg-secondary/40 px-4 py-4">
        <span className="block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dátum obhliadky</span>
        <span className="mt-1 block font-mono text-lg font-bold text-foreground">{dnes}</span>
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Spôsob kotvenia</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SPOSOBY_KOTVENIA.map((s) => {
            const active = zakaznik.sposobKotvenia === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ ...zakaznik, sposobKotvenia: s.id as SposobKotvenia })}
                aria-pressed={active}
                className={"rounded-md border-2 px-3 py-4 text-base font-bold transition-colors " +
                  (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")}
              >
                {s.nazov}
              </button>
            )
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Poznámky pre montážnikov</span>
        <textarea
          value={zakaznik.poznamky}
          onChange={(e) => onChange({ ...zakaznik, poznamky: e.target.value })}
          placeholder="napr. prístup len peši, nadväzuje na existujúci plot antracit..."
          rows={5}
          className="w-full rounded-md border-2 border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary"
        />
      </label>
    </div>
  )
}
