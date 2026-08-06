"use client"

import { useMemo, useState } from "react"
import { DEFAULTS } from "@/lib/gate-config"
import { vypocitajBranku, type GateInput } from "@/lib/gate-calc"
import { GateForm } from "@/components/gate-form"
import { GatePreview } from "@/components/gate-preview"
import { GateResults } from "@/components/gate-results"

export default function Page() {
  const [vstup, setVstup] = useState<GateInput>({ ...DEFAULTS })
  const bezpecnyVstup = useMemo<GateInput>(() => ({
    ...vstup,
    nazovZakaznika: vstup.nazovZakaznika ?? "",
    sirkaKridla: Number.isFinite(vstup.sirkaKridla) ? Math.max(0, vstup.sirkaKridla) : 0,
    vyskaKridla: Number.isFinite(vstup.vyskaKridla) ? Math.max(0, vstup.vyskaKridla) : 0,
    medzera: Number.isFinite(vstup.medzera) ? Math.max(0, vstup.medzera) : 0,
    // Pri dvojkrídlovej bráne je orientácia vždy horizontálna.
    orientacia: vstup.typProduktu === "dvojkridlovaBrana" ? "horizontalne" : vstup.orientacia,
  }), [vstup])
  const vysledok = useMemo(() => vypocitajBranku(bezpecnyVstup), [bezpecnyVstup])
  const jeBrana = bezpecnyVstup.typProduktu === "dvojkridlovaBrana"

  return <div className="min-h-svh bg-background">
    <header className="border-b-2 border-primary bg-primary text-primary-foreground print:hidden"><div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 md:px-6"><div className="flex items-center gap-3"><span className="rounded bg-primary-foreground px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-widest text-primary">Promosteel</span><span className="font-mono text-xs uppercase tracking-widest text-primary-foreground/70">RAL 7016</span></div><h1 className="text-balance text-2xl font-bold md:text-3xl">Konfigurátor {jeBrana ? "dvojkrídlovej brány" : "hliníkovej bránky"}</h1><p className="text-sm text-primary-foreground/70">{jeBrana ? "Dvojkrídlová brána s horizontálnou latovou výplňou — výpočet materiálu" : "Jednokrídlová bránka s latovou výplňou — výpočet materiálu na obhliadke"}</p></div></header>
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 md:px-6 lg:grid-cols-2 print:block print:max-w-none print:px-0 print:py-0">
      <section aria-label="Konfigurácia" className="print:hidden"><h2 className="mb-4 text-lg font-bold text-foreground">Konfigurácia</h2><GateForm vstup={vstup} onChange={setVstup} /></section>
      <section aria-label="Náhľad a výsledky" className="flex flex-col gap-6"><div><h2 className="mb-4 text-lg font-bold text-foreground print:hidden">Náhľad</h2><div className="rounded-md border border-border bg-muted p-4 print:border-none print:bg-white print:p-0"><GatePreview vstup={bezpecnyVstup} vysledok={vysledok} /></div></div><GateResults vstup={bezpecnyVstup} vysledok={vysledok} /></section>
    </main>
  </div>
}
