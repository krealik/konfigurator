"use client"

import type { ReactNode } from "react"
import { SIRKY_LAMIEL_MM, POVRCHY, PRISLUSENSTVO_POHONU, PRISLUSENSTVO_BRANKY, type SirkaLamely, type PovrchId, type Orientacia, type TypProduktu, type Strana, type SmerVykyvu, type PrislusenstvoPolozka } from "@/lib/gate-config"
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

function StranaPicker({
  label,
  value,
  labelVlavo,
  labelVpravo,
  onChange,
}: {
  label: string
  value: Strana
  labelVlavo: string
  labelVpravo: string
  onChange: (v: Strana) => void
}) {
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        {([
          { id: "vlavo" as Strana, nazov: labelVlavo },
          { id: "vpravo" as Strana, nazov: labelVpravo },
        ]).map((s) => {
          const active = value === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              aria-pressed={active}
              className={
                "rounded-md border-2 px-3 py-4 text-base font-bold transition-colors " +
                (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")
              }
            >
              {s.nazov}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold uppercase tracking-wide text-primary">{children}</h3>
}

function PrislusenstvoChecklist({ zoznam, vstup, onChange }: { zoznam: PrislusenstvoPolozka[]; vstup: GateInput; onChange: (v: GateInput) => void }) {
  return (
    <>
      {zoznam.map((polozka) => {
        const mnozstvo = vstup.prislusenstvo[polozka.id] ?? 0
        const zvolene = mnozstvo > 0
        return (
          <div key={polozka.id} className="flex items-center justify-between gap-3 rounded-md border-2 border-input bg-background px-3 py-2.5">
            <button
              type="button"
              onClick={() => onChange({ ...vstup, prislusenstvo: { ...vstup.prislusenstvo, [polozka.id]: zvolene ? 0 : 1 } })}
              aria-pressed={zvolene}
              className={"flex-1 rounded border-2 px-3 py-2 text-left text-sm font-bold transition-colors " +
                (zvolene ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")}
            >
              {zvolene ? "✓ " : ""}{polozka.nazov} <span className="font-normal opacity-70">~{polozka.cena} €{polozka.mnozstvo ? "/ks" : ""}</span>
            </button>
            {polozka.mnozstvo && zvolene && (
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={mnozstvo}
                onChange={(e) => onChange({ ...vstup, prislusenstvo: { ...vstup.prislusenstvo, [polozka.id]: Math.max(1, Number.parseInt(e.target.value, 10) || 1) } })}
                className="w-16 rounded border-2 border-input bg-background px-2 py-2 text-center font-mono text-lg font-bold outline-none focus:border-primary"
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export function GateForm(props: Props) {
  const { vstup, onChange } = props
  const jeBrana = vstup.typProduktu === "dvojkridlovaBrana"
  const jePosuvna = vstup.typProduktu === "posuvnaBrana"
  const jeBranka = !jeBrana && !jePosuvna

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Typ produktu</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {([
            { id: "branka", nazov: "Malá bránka" },
            { id: "dvojkridlovaBrana", nazov: "Dvojkrídlová brána" },
            { id: "posuvnaBrana", nazov: "Posúvna brána" },
          ] as const).map((p) => {
            const active = vstup.typProduktu === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({
                  ...vstup,
                  typProduktu: p.id as TypProduktu,
                  orientacia: p.id === "dvojkridlovaBrana" || p.id === "posuvnaBrana" ? "horizontalne" : vstup.orientacia,
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

      

      {/* --- Zameranie na mieste --- */}
      <div className="flex flex-col gap-4 rounded-md border-2 border-primary/40 bg-secondary/40 p-4">
        <SectionTitle>Zameranie na mieste</SectionTitle>

        {jeBranka && (
          <>
            <NumberField
              label="Svetlá šírka otvoru"
              value={vstup.svetlaSirka}
              suffix="mm"
              hint="rozmer medzi stĺpikmi/múrikmi, ktorý je na mieste k dispozícii"
              onChange={(v) => onChange({ ...vstup, svetlaSirka: v })}
            />
            <NumberField
              label="Vôľa na strane s pántmi"
              value={vstup.vola}
              suffix="mm"
              hint="priestor potrebný na panty a voľné otváranie bez zadrhávania"
              onChange={(v) => onChange({ ...vstup, vola: v })}
            />
            <StranaPicker
              label="Smer otvárania (strana pántov)"
              value={vstup.smerOtvarania}
              labelVlavo="Panty vľavo"
              labelVpravo="Panty vpravo"
              onChange={(v) => onChange({ ...vstup, smerOtvarania: v })}
            />
          </>
        )}

        {jeBrana && (
          <>
            <NumberField
              label="Svetlá šírka otvoru"
              value={vstup.svetlaSirka}
              suffix="mm"
              hint="celý rozmer medzi stĺpikmi, do ktorého idú obe krídla"
              onChange={(v) => onChange({ ...vstup, svetlaSirka: v })}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Vôľa vľavo" value={vstup.volaVlavo} suffix="mm" onChange={(v) => onChange({ ...vstup, volaVlavo: v })} />
              <NumberField label="Vôľa vpravo" value={vstup.volaVpravo} suffix="mm" onChange={(v) => onChange({ ...vstup, volaVpravo: v })} />
            </div>
            <NumberField
              label="Medzera v strede"
              value={vstup.medzeraStred}
              suffix="mm"
              hint="aby sa krídla pri zatváraní o seba nedreli"
              onChange={(v) => onChange({ ...vstup, medzeraStred: v })}
            />
            <div>
              <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Smer otvárania</span>
              <div className="grid grid-cols-2 gap-2">
                {([{ v: "dnu", nazov: "Dnu (na pozemok)" }, { v: "von", nazov: "Von (na ulicu/vjazd)" }] as const).map((o) => {
                  const active = vstup.smerVykyvu === o.v
                  return (
                    <button key={o.v} type="button" onClick={() => onChange({ ...vstup, smerVykyvu: o.v as SmerVykyvu })} aria-pressed={active}
                      className={"rounded-md border-2 py-4 text-base font-bold transition-colors " + (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")}>
                      {o.nazov}
                    </button>
                  )
                })}
              </div>
              <span className="mt-1.5 block text-sm text-muted-foreground">kam sa krídla vykývnu pri otváraní</span>
            </div>
          </>
        )}

        {jePosuvna && (
          <>
            <NumberField
              label="Svetlá šírka otvoru"
              value={vstup.svetlaSirka}
              suffix="mm"
              hint="čo má byť priechodné, keď je brána otvorená"
              onChange={(v) => onChange({ ...vstup, svetlaSirka: v })}
            />
            <NumberField
              label="Presah krídla"
              value={vstup.presah}
              suffix="mm"
              hint="o koľko musí byť krídlo širšie než otvor, aby ho pri zatvorení celé zakrylo"
              onChange={(v) => onChange({ ...vstup, presah: v })}
            />
            <StranaPicker
              label="Strana posunu (zasunutia)"
              value={vstup.stranaPosunu}
              labelVlavo="Posúva sa doľava"
              labelVpravo="Posúva sa doprava"
              onChange={(v) => onChange({ ...vstup, stranaPosunu: v })}
            />
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Výška podmurovky od zeme" value={vstup.vyskaPodmurovky} suffix="mm" onChange={(v) => onChange({ ...vstup, vyskaPodmurovky: v })} />
          <NumberField label="Medzera pod bránou" value={vstup.medzeraPodBranou} suffix="mm" onChange={(v) => onChange({ ...vstup, medzeraPodBranou: v })} />
        </div>
        <NumberField
          label="Požadovaná celková výška"
          value={vstup.celkovaVyska}
          suffix="mm"
          hint="od zeme, vrátane podmurovky aj medzery pod bránou"
          onChange={(v) => onChange({ ...vstup, celkovaVyska: v })}
        />
      </div>

      {jePosuvna && (
        <div className="rounded-md border-2 border-primary/30 bg-secondary/40 px-4 py-3 text-sm text-foreground">
          <strong>Koľajnica / vodiaca lišta</strong> — povinná súčasť posúvnej brány, objednáva sa vždy s produktom (nie je ju možné vynechať).
        </div>
      )}

      {(jeBrana || jePosuvna) && (
        <div>
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pohon (motor)</span>
          <div className="grid grid-cols-2 gap-2">
            {([{ v: false, nazov: "Bez pohonu" }, { v: true, nazov: "S pohonom" }] as const).map((o) => {
              const active = vstup.pohon === o.v
              return (
                <button key={String(o.v)} type="button" onClick={() => onChange({ ...vstup, pohon: o.v })} aria-pressed={active}
                  className={"rounded-md border-2 py-4 text-base font-bold transition-colors " + (active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")}>
                  {o.nazov}
                </button>
              )
            })}
          </div>
          <span className="mt-1.5 block text-sm text-muted-foreground">montážnici to potrebujú vedieť vopred (elektrická prípojka)</span>
        </div>
      )}

      {jeBranka && (
        <div className="flex flex-col gap-3 rounded-md border-2 border-primary/40 bg-secondary/40 p-4">
          <SectionTitle>Príslušenstvo — čo doobjednať</SectionTitle>
          <PrislusenstvoChecklist zoznam={PRISLUSENSTVO_BRANKY} vstup={vstup} onChange={onChange} />
        </div>
      )}

      {vstup.pohon && (jeBrana || jePosuvna) && (
        <div className="flex flex-col gap-3 rounded-md border-2 border-primary/40 bg-secondary/40 p-4">
          <SectionTitle>Príslušenstvo k pohonu — čo doobjednať</SectionTitle>
          <p className="text-xs text-muted-foreground">Jeden pár fotobuniek je súčasťou pohonu (v cene inštalačného kitu) — tu je len doplnkové príslušenstvo navyše.</p>
          <PrislusenstvoChecklist zoznam={PRISLUSENSTVO_POHONU[jePosuvna ? "posuvnaBrana" : "dvojkridlovaBrana"]} vstup={vstup} onChange={onChange} />
        </div>
      )}

      {jeBranka && (
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

      {jePosuvna && (
        <div className="rounded-md border border-primary/30 bg-secondary p-4 text-sm">
          <strong>Horizontálne lamely</strong> — pri posúvnej bráne sú pevne nastavené. Krídlo je jeden súvislý panel bez priečky na pohon.
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
