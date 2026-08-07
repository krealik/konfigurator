"use client"

import { useMemo, useState } from "react"
import { DEFAULTS, DEFAULTS_POLOZKY, DEFAULTS_ZAKAZNIK } from "@/lib/gate-config"
import type { Prekazka, Zakaznik } from "@/lib/gate-config"
import { vypocitajBranku, vypocitajZZamerania, type GateInput } from "@/lib/gate-calc"
import { GateForm } from "@/components/gate-form"
import { GatePreview } from "@/components/gate-preview"
import { GateResults, nazovProduktu } from "@/components/gate-results"
import { ScenaPreview } from "@/components/scena-preview"
import { ZakaznikForm } from "@/components/zakaznik-form"
import { GateObstacles } from "@/components/gate-obstacles"
import { ObstaclePopover } from "@/components/obstacle-popover"
import { PrintZostava } from "@/components/print-zostava"

type PolozkaId = string
type Zalozka = "zakaznik" | "merania" | "scena" | "vysledok"

interface Polozka {
  id: PolozkaId
  vstup: GateInput
}

function novyId() {
  return `p${Date.now()}${Math.round(Math.random() * 9999)}`
}

function bezpecnyVstupFn(vstup: GateInput): GateInput {
  const num = (v: number) => (Number.isFinite(v) ? Math.max(0, v) : 0)
  return {
    ...vstup,
    svetlaSirka: num(vstup.svetlaSirka),
    vola: num(vstup.vola),
    volaVlavo: num(vstup.volaVlavo),
    volaVpravo: num(vstup.volaVpravo),
    medzeraStred: num(vstup.medzeraStred),
    presah: num(vstup.presah),
    vyskaPodmurovky: num(vstup.vyskaPodmurovky),
    medzeraPodBranou: num(vstup.medzeraPodBranou),
    celkovaVyska: num(vstup.celkovaVyska),
    medzera: num(vstup.medzera),
    pohon: !!vstup.pohon,
    prekazky: Array.isArray(vstup.prekazky) ? vstup.prekazky : [],
    orientacia:
      vstup.typProduktu === "dvojkridlovaBrana" || vstup.typProduktu === "posuvnaBrana"
        ? "horizontalne"
        : vstup.orientacia,
  }
}

const PRVA_POLOZKA_ID = novyId()

const ZALOZKY: { id: Zalozka; nazov: string }[] = [
  { id: "zakaznik", nazov: "1 · Zákazník" },
  { id: "merania", nazov: "2 · Merania a produkty" },
  { id: "scena", nazov: "3 · Scéna" },
  { id: "vysledok", nazov: "4 · Výsledok / PDF" },
]

export default function Page() {
  const [zakaznik, setZakaznik] = useState<Zakaznik>({ ...DEFAULTS_ZAKAZNIK })
  const [zalozka, setZalozka] = useState<Zalozka>("zakaznik")

  // Spoločné prekážky pre celú scénu
  const [prekazky, setPrekazky] = useState<Prekazka[]>([])

  // Zoznam položiek (produktov) na zákazke
  const [polozky, setPolozky] = useState<Polozka[]>([
    { id: PRVA_POLOZKA_ID, vstup: { ...DEFAULTS, prekazky: [] } },
  ])

  // Aktívna vybraná položka
  const [aktivnaId, setAktivnaId] = useState<PolozkaId>(PRVA_POLOZKA_ID)

  // Návrh prekážky práve nakreslenej na plátne — čaká na potvrdenie v popoveri.
  const [navrh, setNavrh] = useState<{ prekazka: Prekazka; screenPos: { x: number; y: number } } | null>(null)

  const aktivna = polozky.find((p) => p.id === aktivnaId) ?? polozky[0]

  // Vypočítané výsledky pre každú položku
  const vypocitane = useMemo(() => {
    return polozky.map((pol) => {
      const vstupSPrekazkami = bezpecnyVstupFn({ ...pol.vstup, prekazky })
      const zameranie = vypocitajZZamerania(vstupSPrekazkami)
      const vysledok = vypocitajBranku(vstupSPrekazkami, zameranie)
      return { id: pol.id, vstup: vstupSPrekazkami, zameranie, vysledok }
    })
  }, [polozky, prekazky])

  const aktivnaVypocitana = vypocitane.find((v) => v.id === aktivnaId) ?? vypocitane[0]

  function zmenVstup(vstup: GateInput) {
    setPolozky((prev) => prev.map((p) => (p.id === aktivnaId ? { ...p, vstup } : p)))
  }

  function pridajPolozku() {
    const id = novyId()
    setPolozky((prev) => [...prev, { id, vstup: { ...DEFAULTS_POLOZKY, prekazky: [] } as GateInput }])
    setAktivnaId(id)
  }

  function zmazPolozku(id: PolozkaId) {
    if (polozky.length <= 1) return
    const novzoz = polozky.filter((p) => p.id !== id)
    setPolozky(novzoz)
    if (aktivnaId === id) setAktivnaId(novzoz[0].id)
  }

  // Nakreslenie prekážky na plátne nič priamo nepridá — len otvorí návrh v popoveri.
  function otvorNavrh(p: Prekazka, screenPos: { x: number; y: number }) {
    setNavrh({ prekazka: p, screenPos })
  }
  function potvrdNavrh() {
    if (navrh) setPrekazky((prev) => [...prev, navrh.prekazka])
    setNavrh(null)
  }
  function zrusNavrh() {
    setNavrh(null)
  }

  const nazovAktivnejPolozkySuffix = polozky.length > 1
    ? ` (${polozky.findIndex((p) => p.id === aktivnaId) + 1}/${polozky.length})`
    : ""

  const jednaPolozka = polozky.length === 1
  const nadpisProduktu = nazovProduktu(aktivnaVypocitana.vstup.typProduktu)

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b-2 border-primary bg-primary text-primary-foreground print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:px-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-primary-foreground px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-widest text-primary">Promosteel</span>
              <span className="font-mono text-xs uppercase tracking-widest text-primary-foreground/70">RAL 7016</span>
            </div>
            <h1 className="text-balance text-2xl font-bold md:text-3xl">
              Konfigurátor {nadpisProduktu.toLowerCase()}{nazovAktivnejPolozkySuffix}
            </h1>
          </div>

          {/* Trvalá navigácia — voľne prepínateľná, žiadny krok nie je uzamknutý. */}
          <nav className="flex flex-wrap gap-2">
            {ZALOZKY.map((z) => {
              const active = zalozka === z.id
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZalozka(z.id)}
                  className={"rounded-md border-2 px-4 py-2 text-sm font-bold transition-colors " +
                    (active
                      ? "border-primary-foreground bg-primary-foreground text-primary"
                      : "border-primary-foreground/40 bg-transparent text-primary-foreground/80 hover:border-primary-foreground")}
                >
                  {z.nazov}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 print:hidden">
        {/* --- Záložka: Zákazník --- */}
        {zalozka === "zakaznik" && (
          <div className="mx-auto max-w-xl">
            <h2 className="mb-4 text-lg font-bold text-foreground">Zákazník a miesto</h2>
            <ZakaznikForm zakaznik={zakaznik} onChange={setZakaznik} />
          </div>
        )}

        {/* --- Záložka: Merania a produkty --- */}
        {zalozka === "merania" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section aria-label="Konfigurácia">
              {polozky.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {polozky.map((pol, idx) => {
                    const v = vypocitane.find((vv) => vv.id === pol.id)
                    const nazov = v ? nazovProduktu(v.vstup.typProduktu) : ""
                    return (
                      <div key={pol.id} className="flex items-stretch overflow-hidden rounded-md border-2"
                        style={{ borderColor: aktivnaId === pol.id ? "var(--color-primary)" : "var(--color-input)" }}>
                        <button
                          type="button"
                          onClick={() => setAktivnaId(pol.id)}
                          className={"px-4 py-2.5 text-sm font-bold transition-colors " +
                            (aktivnaId === pol.id ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-secondary")}
                        >
                          {idx + 1}. {nazov}
                        </button>
                        <button type="button" onClick={() => zmazPolozku(pol.id)}
                          className={"px-2.5 text-xs font-bold transition-colors " +
                            (aktivnaId === pol.id ? "bg-primary/70 text-primary-foreground" : "bg-background text-muted-foreground hover:text-destructive")}
                          aria-label="Zmazať položku">×</button>
                      </div>
                    )
                  })}
                  <button type="button" onClick={pridajPolozku}
                    className="rounded-md border-2 border-dashed border-primary/50 px-4 py-2.5 text-sm font-bold text-primary/70 hover:border-primary hover:text-primary transition-colors">
                    + Pridať produkt
                  </button>
                </div>
              )}
              {polozky.length === 1 && (
                <div className="mb-4 flex justify-end">
                  <button type="button" onClick={pridajPolozku}
                    className="rounded-md border-2 border-dashed border-primary/50 px-4 py-2.5 text-sm font-bold text-primary/70 hover:border-primary hover:text-primary transition-colors">
                    + Pridať ďalší produkt na tú istú zákazku
                  </button>
                </div>
              )}

              <h2 className="mb-4 text-lg font-bold text-foreground">Konfigurácia</h2>
              <GateForm vstup={aktivna.vstup} onChange={zmenVstup} />
            </section>

            <section aria-label="Náhľad" className="flex flex-col gap-4">
              {aktivnaVypocitana.vysledok.varovania.length > 0 && (
                <div className="rounded-md border-2 border-destructive/50 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                  {aktivnaVypocitana.vysledok.varovania.map((v) => <p key={v}>⚠ {v}</p>)}
                </div>
              )}
              <h2 className="text-lg font-bold text-foreground">Náhľad</h2>
              <div className="rounded-md border border-border bg-muted p-4">
                {jednaPolozka ? (
                  <GatePreview vstup={aktivnaVypocitana.vstup} vysledok={aktivnaVypocitana.vysledok} kreslenie={false} />
                ) : (
                  <ScenaPreview polozky={vypocitane} prekazky={prekazky} kreslenie={false} aktivnaId={aktivnaId} onKlikPolozku={setAktivnaId} />
                )}
              </div>
            </section>
          </div>
        )}

        {/* --- Záložka: Scéna (kreslenie prekážok) --- */}
        {zalozka === "scena" && (
          <div>
            <div className="mb-4">
              <h2 className="mb-1 text-lg font-bold text-foreground">Scéna a prekážky</h2>
              <p className="text-sm text-muted-foreground">
                Ťahaním nakresli obdĺžnik (stĺp, skriňa) alebo úzky ťah pre stenu. Po nakreslení sa zobrazí okienko na doladenie — priamo na mieste, bez skrolovania.
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted p-2 md:p-4">
              {jednaPolozka ? (
                <GatePreview vstup={aktivnaVypocitana.vstup} vysledok={aktivnaVypocitana.vysledok} kreslenie={true} onPridajPrekazku={otvorNavrh} />
              ) : (
                <ScenaPreview polozky={vypocitane} prekazky={prekazky} kreslenie={true} onPridajPrekazku={otvorNavrh} aktivnaId={aktivnaId} onKlikPolozku={setAktivnaId} />
              )}
            </div>

            {prekazky.filter((p) => p.typ === "existujuci-stlp").length >= 2 && (() => {
              const stlpy = prekazky.filter((p) => p.typ === "existujuci-stlp").sort((a, b) => a.poziciaOdKraja - b.poziciaOdKraja)
              const lavy = stlpy[0], pravy = stlpy[stlpy.length - 1]
              const odvodenaSirka = Math.max(0, Math.round(pravy.poziciaOdKraja - (lavy.poziciaOdKraja + lavy.sirka)))
              return (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border-2 border-primary/40 bg-secondary/40 p-4">
                  <span className="text-sm text-foreground">
                    Vzdialenosť medzi krajnými existujúcimi stĺpmi: <strong className="font-mono">{odvodenaSirka} mm</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => zmenVstup({ ...aktivna.vstup, svetlaSirka: odvodenaSirka })}
                    className="rounded-md border-2 border-primary bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    Použiť ako svetlú šírku pre „{nazovProduktu(aktivna.vstup.typProduktu)}"
                  </button>
                </div>
              )
            })()}

            {prekazky.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Zakreslené prekážky — doladiť/zmazať</h3>
                <GateObstacles prekazky={prekazky} onChange={setPrekazky} />
              </div>
            )}
          </div>
        )}

        {/* --- Záložka: Výsledok / PDF --- */}
        {zalozka === "vysledok" && (
          <div className="mx-auto max-w-3xl">
            {polozky.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {polozky.map((pol, idx) => {
                  const v = vypocitane.find((vv) => vv.id === pol.id)
                  const nazov = v ? nazovProduktu(v.vstup.typProduktu) : ""
                  return (
                    <button key={pol.id} type="button" onClick={() => setAktivnaId(pol.id)}
                      className={"rounded-md border-2 px-4 py-2.5 text-sm font-bold transition-colors " +
                        (aktivnaId === pol.id ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:border-primary")}>
                      {idx + 1}. {nazov}
                    </button>
                  )
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="mb-6 w-full rounded-md bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:opacity-90"
            >
              Stiahnuť PDF / Tlačiť (cenová ponuka + výrobné listy)
            </button>

            {aktivnaVypocitana.vysledok.varovania.length > 0 && (
              <div className="mb-4 rounded-md border-2 border-destructive/50 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                {aktivnaVypocitana.vysledok.varovania.map((v) => <p key={v}>⚠ {v}</p>)}
              </div>
            )}

            <div className="mb-6 rounded-md border border-border bg-muted p-4">
              <GatePreview vstup={aktivnaVypocitana.vstup} vysledok={aktivnaVypocitana.vysledok} kreslenie={false} />
            </div>

            <GateResults vstup={aktivnaVypocitana.vstup} vysledok={aktivnaVypocitana.vysledok} />
          </div>
        )}
      </main>

      {/* Viacstranová tlačová zostava — viditeľná len pri tlači, nezávisle od aktívnej záložky. */}
      <PrintZostava zakaznik={zakaznik} polozky={vypocitane} />

      {navrh && (
        <ObstaclePopover
          navrh={navrh.prekazka}
          screenPos={navrh.screenPos}
          onChange={(p) => setNavrh((n) => (n ? { ...n, prekazka: p } : n))}
          onConfirm={potvrdNavrh}
          onCancel={zrusNavrh}
        />
      )}
    </div>
  )
}
