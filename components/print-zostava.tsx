"use client"

import type { GateInput, GateResult } from "@/lib/gate-calc"
import { nazovProduktu } from "@/components/gate-results"
import { GatePreview } from "@/components/gate-preview"
import { SPOSOBY_KOTVENIA, type Zakaznik } from "@/lib/gate-config"

interface VypocitanaPolozka {
  id: string
  vstup: GateInput
  vysledok: GateResult
}

interface Props {
  zakaznik: Zakaznik
  polozky: VypocitanaPolozka[]
}

function fmt(n: number, decimals = 0) { return n.toLocaleString("sk-SK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) }

function nazovKotvenia(id: Zakaznik["sposobKotvenia"]) {
  return SPOSOBY_KOTVENIA.find((s) => s.id === id)?.nazov ?? id
}

/**
 * Viacstranová tlačová zostava — vidí ju len tlačiareň (@media print), na obrazovke je skrytá.
 * Strana 1: cenová ponuka pre zákazníka (bez rezného plánu). Strana 2+: výrobný list pre
 * každý produkt na zákazke (rezný plán, kusovník, poznámky pre montážnikov).
 */
export function PrintZostava({ zakaznik, polozky }: Props) {
  const dnes = new Date().toLocaleDateString("sk-SK")
  const cenaSpoluVsetko = polozky.reduce((s, p) => s + p.vysledok.cena.spolu, 0)

  return (
    <div className="hidden print:block">
      {/* --- STRANA 1: Cenová ponuka pre zákazníka --- */}
      <section className="print-page">
        <header className="mb-4 border-b-2 border-black pb-2">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold">Promosteel</span>
            <span className="text-sm">{dnes}</span>
          </div>
          <h1 className="mt-1 text-xl font-bold">Cenová ponuka</h1>
        </header>

        <div className="mb-4 text-sm">
          <p><strong>Zákazník:</strong> {zakaznik.meno || "Neuvedený"}</p>
          {zakaznik.adresa && <p><strong>Adresa:</strong> {zakaznik.adresa}</p>}
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-2">Položka</th>
              <th className="py-2">Rozmer</th>
              <th className="py-2 text-right">Cena</th>
            </tr>
          </thead>
          <tbody>
            {polozky.map((p, i) => (
              <tr key={p.id} className="border-b border-black/30">
                <td className="py-2">{i + 1}. {nazovProduktu(p.vstup.typProduktu)}{p.vysledok.pohon ? " (s pohonom)" : ""}</td>
                <td className="py-2">
                  {p.vstup.typProduktu === "dvojkridlovaBrana"
                    ? `2× ${fmt(p.vysledok.sirkaKridla)} × ${fmt(p.vysledok.vyskaKridla)} mm`
                    : `${fmt(p.vysledok.sirkaKridla)} × ${fmt(p.vysledok.vyskaKridla)} mm`}
                </td>
                <td className="py-2 text-right font-mono">{fmt(p.vysledok.cena.spolu)} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex justify-end">
          <div className="text-right">
            <div className="text-sm">Spolu bez DPH</div>
            <div className="font-mono text-2xl font-bold">{fmt(cenaSpoluVsetko)} €</div>
          </div>
        </div>

        <p className="mt-6 text-xs text-black/70">
          Orientačná cenová ponuka na materiál a inštalačný kit, bez práce a montáže. Platnosť ponuky 30 dní.
        </p>
      </section>

      {/* --- STRANA 2+: Výrobný list pre každý produkt --- */}
      {polozky.map((p, i) => (
        <section key={p.id} className="print-page">
          <header className="mb-4 border-b-2 border-black pb-2">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold">Promosteel — Výrobný list</span>
              <span className="text-sm">{dnes}</span>
            </div>
            <h2 className="mt-1 text-lg font-bold">
              {i + 1}. {nazovProduktu(p.vstup.typProduktu)} — {zakaznik.meno || "Neuvedený zákazník"}
            </h2>
          </header>

          <div className="mb-4">
            <GatePreview vstup={p.vstup} vysledok={p.vysledok} />
          </div>

          <table className="mb-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2">Rozpis na rezanie — profil 50×60 mm</th>
                <th className="py-2 text-right">Počet × dĺžka</th>
              </tr>
            </thead>
            <tbody>
              {[p.vysledok.profilRezy.zvislyRam, p.vysledok.profilRezy.vodorovnyRam, p.vysledok.profilRezy.strednaPriecka, p.vysledok.profilRezy.stlpiky]
                .filter(Boolean)
                .map((rez) => (
                  <tr key={rez!.nazov} className="border-b border-black/30">
                    <td className="py-1.5">{rez!.nazov}</td>
                    <td className="py-1.5 text-right font-mono">{rez!.pocet}× {fmt(rez!.dlzkaMm)} mm</td>
                  </tr>
                ))}
            </tbody>
          </table>

          <table className="mb-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2">Materiál na objednanie</th>
                <th className="py-2 text-right">Bm</th>
                <th className="py-2 text-right">Tyče 6m</th>
                <th className="py-2 text-right">Odpad</th>
              </tr>
            </thead>
            <tbody>
              {[p.vysledok.material.profil, p.vysledok.material.lamely].map((m) => (
                <tr key={m.nazov} className="border-b border-black/30">
                  <td className="py-1.5">{m.nazov}</td>
                  <td className="py-1.5 text-right font-mono">{fmt(m.potrebnaDlzkaM, 2)}</td>
                  <td className="py-1.5 text-right font-mono">{m.pocetTyci}</td>
                  <td className="py-1.5 text-right font-mono">{fmt(m.odpadMm)} mm</td>
                </tr>
              ))}
            </tbody>
          </table>

          {p.vysledok.prislusenstvoVybrane.length > 0 && (
            <table className="mb-4 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-2">Príslušenstvo na doobjednanie</th>
                  <th className="py-2 text-right">Množstvo</th>
                </tr>
              </thead>
              <tbody>
                {p.vysledok.prislusenstvoVybrane.map((pr) => (
                  <tr key={pr.nazov} className="border-b border-black/30">
                    <td className="py-1.5">{pr.nazov}</td>
                    <td className="py-1.5 text-right font-mono">{pr.mnozstvo}× ({fmt(pr.spolu)} €)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Spôsob kotvenia:</strong> {nazovKotvenia(zakaznik.sposobKotvenia)}</p>
            <p><strong>Pohon:</strong> {p.vysledok.pohon ? "Áno" : "Nie"}</p>
          </div>

          {zakaznik.poznamky && (
            <p className="mt-2 text-sm"><strong>Poznámky pre montážnikov:</strong> {zakaznik.poznamky}</p>
          )}
        </section>
      ))}
    </div>
  )
}
