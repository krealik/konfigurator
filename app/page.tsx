"use client"

import { useMemo, useState } from "react"
import { DEFAULTS, DEFAULTS_POLOZKY } from "@/lib/gate-config"
import type { Prekazka } from "@/lib/gate-config"
import { vypocitajBranku, vypocitajZZamerania, type GateInput } from "@/lib/gate-calc"
import { GateForm } from "@/components/gate-form"
import { GatePreview } from "@/components/gate-preview"
import { GateResults } from "@/components/gate-results"
import { ScenaPreview } from "@/components/scena-preview"

type PolozkaId = string

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
    nazovZakaznika: vstup.nazovZakaznika ?? "",
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
    prekazky: Array.isArray(vstup.prekazky) ? vstup.prekazky : [],
    orientacia:
      vstup.typProduktu === "dvojkridlovaBrana" || vstup.typProduktu === "posuvnaBrana"
        ? "horizontalne"
        : vstup.orientacia,
  }
}

const PRVA_POLOZKA_ID = novyId()

export default function Page() {
  // Spoločné prekážky pre celú scénu
  const [prekazky, setPrekazky] = useState<Prekazka[]>([])

  // Zoznam položiek (produktov) na zákazke
  const [polozky, setPolozky] = useState<Polozka[]>([
    { id: PRVA_POLOZKA_ID, vstup: { ...DEFAULTS, prekazky: [] } },
  ])

  // Aktívna vybraná položka
  const [aktivnaId, setAktivnaId] = useState<PolozkaId>(PRVA_POLOZKA_ID)

  // Mód kreslenia prekážok
  const [kreslenie, setKreslenie] = useState(false)

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

  function pridajPrekazku(p: Prekazka) {
    setPrekazky((prev) => [...prev, p])
  }

  const nazovAktivnejPolozkySuffix = polozky.length > 1
    ? ` (${polozky.findIndex((p) => p.id === aktivnaId) + 1}/${polozky.length})`
    : ""

  const jeBrana = aktivnaVypocitana.vstup.typProduktu === "dvojkridlovaBrana"
  const jePosuvna = aktivnaVypocitana.vstup.typProduktu === "posuvnaBrana"
  const nazovProduktu = jeBrana ? "dvojkrídlovej brány" : jePosuvna ? "posúvnej brány" : "hliníkovej bránky"

  const jednaPolozka = polozky.length === 1

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b-2 border-primary bg-primary text-primary-foreground print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded bg-primary-foreground px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-widest text-primary">Promosteel</span>
            <span className="font-mono text-xs uppercase tracking-widest text-primary-foreground/70">RAL 7016</span>
          </div>
          <h1 className="text-balance text-2xl font-bold md:text-3xl">
            Konfigurátor {nazovProduktu}{nazovAktivnejPolozkySuffix}
          </h1>
        </div>
      </header>

      {/* Keď je aktívne kreslenie → celá šírka pre náhľad */}
      {kreslenie ? (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setKreslenie(false)}
              className="rounded-md border-2 border-primary bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors"
            >
              ✕ Hotovo — späť na formulár
            </button>
            <span className="text-sm text-muted-foreground">
              Ťahaním nakresli obdĺžnik (stĺp, skriňa) alebo klikni pre čiaru (stena, tenký stĺp). Všetky produkty zdieľajú tieto prekážky.
            </span>
          </div>
          <div className="rounded-md border border-border bg-muted p-2 md:p-4">
            {jednaPolozka ? (
              <GatePreview
                vstup={aktivnaVypocitana.vstup}
                vysledok={aktivnaVypocitana.vysledok}
                kreslenie={true}
                onPridajPrekazku={pridajPrekazku}
              />
            ) : (
              <ScenaPreview
                polozky={vypocitane}
                prekazky={prekazky}
                kreslenie={true}
                onPridajPrekazku={pridajPrekazku}
                aktivnaId={aktivnaId}
                onKlikPolozku={setAktivnaId}
              />
            )}
          </div>
        </div>
      ) : (
        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 md:px-6 lg:grid-cols-2 print:block print:max-w-none print:px-0 print:py-0">
          {/* Ľavý stĺpec — formulár */}
          <section aria-label="Konfigurácia" className="print:hidden">
            {/* Záložky položiek */}
            {polozky.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {polozky.map((pol, idx) => {
                  const v = vypocitane.find((vv) => vv.id === pol.id)
                  const typ = v?.vstup.typProduktu
                  const nazov = typ === "dvojkridlovaBrana" ? "Brána" : typ === "posuvnaBrana" ? "Posuvná" : "Bránka"
                  return (
                    <div key={pol.id} className="flex items-stretch rounded-md border-2 overflow-hidden"
                      style={{ borderColor: aktivnaId === pol.id ? "var(--color-primary)" : "var(--color-input)" }}>
                      <button
                        type="button"
                        onClick={() => setAktivnaId(pol.id)}
                        className={"px-4 py-2.5 text-sm font-bold transition-colors " +
                          (aktivnaId === pol.id ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-secondary")}
                      >
                        {idx + 1}. {nazov}
                      </button>
                      {polozky.length > 1 && (
                        <button type="button" onClick={() => zmazPolozku(pol.id)}
                          className={"px-2.5 text-xs font-bold transition-colors " +
                            (aktivnaId === pol.id ? "bg-primary/70 text-primary-foreground" : "bg-background text-muted-foreground hover:text-destructive")}
                          aria-label="Zmazať položku">×</button>
                      )}
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={pridajPolozku}
                  className="rounded-md border-2 border-dashed border-primary/50 px-4 py-2.5 text-sm font-bold text-primary/70 hover:border-primary hover:text-primary transition-colors"
                >
                  + Pridať produkt
                </button>
              </div>
            )}

            {polozky.length === 1 && (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={pridajPolozku}
                  className="rounded-md border-2 border-dashed border-primary/50 px-4 py-2.5 text-sm font-bold text-primary/70 hover:border-primary hover:text-primary transition-colors"
                >
                  + Pridať ďalší produkt na tú istú zákazku
                </button>
              </div>
            )}

            <h2 className="mb-4 text-lg font-bold text-foreground">Konfigurácia</h2>
            <GateForm vstup={aktivna.vstup} onChange={zmenVstup} prekazky={prekazky} onZmenPrekazky={setPrekazky} />
          </section>

          {/* Pravý stĺpec — náhľad + výsledky */}
          <section aria-label="Náhľad a výsledky" className="flex flex-col gap-6">
            {aktivnaVypocitana.vysledok.varovania.length > 0 && (
              <div className="rounded-md border-2 border-destructive/50 bg-destructive/10 p-4 text-sm font-semibold text-destructive print:hidden">
                {aktivnaVypocitana.vysledok.varovania.map((v) => <p key={v}>⚠ {v}</p>)}
              </div>
            )}

            <div>
              <h2 className="mb-4 text-lg font-bold text-foreground print:hidden">Náhľad</h2>
              <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => setKreslenie(true)}
                  className="rounded-md border-2 border-input bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:border-primary transition-colors"
                >
                  ✎ Kresliť prekážky
                </button>
                {prekazky.length > 0 && (
                  <span className="text-sm text-muted-foreground">{prekazky.length} {prekazky.length === 1 ? "prekážka" : prekazky.length < 5 ? "prekážky" : "prekážok"} zakreslené</span>
                )}
              </div>
              <div className="rounded-md border border-border bg-muted p-4 print:border-none print:bg-white print:p-0">
                {jednaPolozka ? (
                  <GatePreview
                    vstup={aktivnaVypocitana.vstup}
                    vysledok={aktivnaVypocitana.vysledok}
                    kreslenie={false}
                  />
                ) : (
                  <ScenaPreview
                    polozky={vypocitane}
                    prekazky={prekazky}
                    kreslenie={false}
                    aktivnaId={aktivnaId}
                    onKlikPolozku={setAktivnaId}
                  />
                )}
              </div>
            </div>

            <GateResults vstup={aktivnaVypocitana.vstup} vysledok={aktivnaVypocitana.vysledok} />
          </section>
        </main>
      )}
    </div>
  )
}
