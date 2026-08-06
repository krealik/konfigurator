"use client"

import { SIRKY_LAMIEL_MM, POVRCHY, type SirkaLamely, type PovrchId, type Orientacia, type TypProduktu } from "@/lib/gate-config"
import type { GateInput } from "@/lib/gate-calc"

interface Props {
  vstup: GateInput
  onChange: (vstup: GateInput) => void
}

function NumberField({
  label,
  value,
  suffix,
  hint,
  onChange,
}: {
  label: string
  value: number
  suffix: string
  hint?: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-stretch overflow-hidden rounded-md border-2 border-input bg-background focus-within:border-primary">
        <input
          type="number"
          inputMode="numeric"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
          className="w-full bg-transparent px-4 py-4 font-mono text-3xl font-bold tabular-nums text-foreground outline-none"
        />
        <span className="flex items-center bg-secondary px-4 font-mono text-lg font-semibold text-secondary-foreground">
          {suffix}
        </span>
      </div>
      {hint ? <span className="mt-1.5 block text-sm text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export function GateForm({ vstup, onChange }: Props) {
  const jeBrana = vstup.typProduktu === "dvojkridlovaBrana"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Typ produktu</span>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "branka", nazov: "Jednokrídlová bránka" },
            { id: "dvojkridlovaBrana", nazov: "Dvojkrídlová brána" },
          ] as const).map((p) => {
            const active = vstup.typProduktu === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({
                  ...vstup,
                  typProduktu: p.id as TypProduktu,
                  orientacia: p.id === "dvojkridlovaBrana" ? "horizontalne" : vstup.orientacia,
                })}
                className={
                  "rounded-md border-2 px-3 py-4 text-base font-bold transition-colors " +
                  (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")
                }
              >
                {p.nazov}
              </button>
            )
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Názov zákazníka</span>
        <input
          type="text"
          value={vstup.nazovZakaznika}
          onChange={(e) => onChange({ ...vstup, nazovZakaznika: e.target.value })}
          placeholder="napr. Ján Novák"
          className="w-full rounded-md border-2 border-input bg-background px-4 py-4 text-lg font-semibold text-foreground outline-none focus:border-primary"
        />
      </label>

      <NumberField
        label={jeBrana ? "Celková šírka brány" : "Šírka krídla"}
        value={vstup.sirkaKridla}
        suffix="mm"
        hint={jeBrana ? `Brána sa automaticky rozdelí na 2 krídla po ${Math.round(vstup.sirkaKridla / 2)} mm.` : undefined}
        onChange={(v) => onChange({ ...vstup, sirkaKridla: v })}
      />
      <NumberField
        label={jeBrana ? "Výška brány" : "Výška krídla"}
        value={vstup.vyskaKridla}
        suffix="mm"
        onChange={(v) => onChange({ ...vstup, vyskaKridla: v })}
      />

      {!jeBrana && (
        <div>
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Osadenie lamiel</span>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: "vertikalne", nazov: "Vertikálne", ikona: "vert" },
              { id: "horizontalne", nazov: "Horizontálne", ikona: "horiz" },
            ] as const).map((o) => {
              const active = vstup.orientacia === o.id
              return (
                <button key={o.id} type="button" onClick={() => onChange({ ...vstup, orientacia: o.id as Orientacia })} aria-pressed={active}
                  className={"flex items-center justify-center gap-3 rounded-md border-2 py-4 text-base font-bold transition-colors " + (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")}>
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    {o.ikona === "vert" ? <><rect x="4" y="3" width="3" height="18" rx="1" /><rect x="10.5" y="3" width="3" height="18" rx="1" /><rect x="17" y="3" width="3" height="18" rx="1" /></> : <><rect x="3" y="4" width="18" height="3" rx="1" /><rect x="3" y="10.5" width="18" height="3" rx="1" /><rect x="3" y="17" width="18" height="3" rx="1" /></>}
                  </svg>
                  {o.nazov}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {jeBrana && (
        <div className="rounded-md border border-primary/30 bg-secondary p-4 text-sm">
          <strong>Horizontálne lamely</strong> — pri dvojkrídlovej bráne sú pevne nastavené. V každom krídle sa počíta samostatne spodná a horná časť okolo priečky pohonu.
        </div>
      )}

      <div>
        <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Šírka lamely</span>
        <div className="grid grid-cols-4 gap-2">
          {SIRKY_LAMIEL_MM.map((s) => {
            const active = vstup.sirkaLamely === s
            return <button key={s} type="button" onClick={() => onChange({ ...vstup, sirkaLamely: s as SirkaLamely })} aria-pressed={active}
              className={"rounded-md border-2 py-4 font-mono text-xl font-bold tabular-nums transition-colors " + (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")}>{s}</button>
          })}
        </div>
        <span className="mt-1.5 block text-sm text-muted-foreground">rozmer v mm</span>
      </div>

      <NumberField label="Medzera medzi lamelami" value={vstup.medzera} suffix="mm" hint="štandardná medzera pre estetický vzhľad" onChange={(v) => onChange({ ...vstup, medzera: v })} />

      <div>
        <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vzhľad lamely</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {POVRCHY.map((p) => {
            const active = vstup.povrch === p.id
            return <button key={p.id} type="button" onClick={() => onChange({ ...vstup, povrch: p.id as PovrchId })} aria-pressed={active} title={p.nazov}
              className={"flex flex-col items-center gap-2 rounded-md border-2 p-2 text-center transition-colors " + (active ? "border-primary bg-secondary" : "border-input bg-background hover:border-primary")}>
              <span className="h-10 w-full rounded ring-1 ring-inset ring-black/10" style={p.drevo ? { backgroundImage: `repeating-linear-gradient(90deg, ${p.farba}, ${p.farba} 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 4px), linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.15))`, backgroundColor: p.farba } : { backgroundColor: p.farba }} aria-hidden="true" />
              <span className="text-xs font-semibold leading-tight text-foreground">{p.nazov}</span>
            </button>
          })}
        </div>
      </div>
    </div>
  )
}
