"use client"

import type { GateInput, GateResult, MaterialPolozka } from "@/lib/gate-calc"

interface Props { vstup: GateInput; vysledok: GateResult }
function fmt(n: number, decimals = 0) { return n.toLocaleString("sk-SK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) }
function ParamRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0"><span className="text-sm text-muted-foreground">{label}</span><span className="font-mono text-lg font-bold tabular-nums text-foreground">{value}</span></div> }
function MaterialCard({ polozka }: { polozka: MaterialPolozka }) { return <div className="rounded-md border border-border bg-card p-4"><h4 className="mb-3 font-semibold text-foreground">{polozka.nazov}</h4><div className="grid grid-cols-4 gap-2 text-center"><div><div className="font-mono text-2xl font-bold tabular-nums text-foreground">{fmt(polozka.potrebnaDlzkaM, 2)}</div><div className="text-xs uppercase tracking-wide text-muted-foreground">bežné metre</div></div><div className="border-x border-border"><div className="font-mono text-2xl font-bold tabular-nums text-primary">{polozka.pocetTyci}</div><div className="text-xs uppercase tracking-wide text-muted-foreground">tyče 6 m</div></div><div className="border-r border-border"><div className="font-mono text-2xl font-bold tabular-nums text-foreground">{fmt(polozka.odpadMm)}</div><div className="text-xs uppercase tracking-wide text-muted-foreground">odpad (mm)</div></div><div><div className="font-mono text-2xl font-bold tabular-nums text-foreground">{fmt(polozka.cenaSpolu)} €</div><div className="text-xs uppercase tracking-wide text-muted-foreground">{polozka.cenaKs} €/ks</div></div></div></div> }

export function nazovProduktu(t: GateInput["typProduktu"]) {
  if (t === "dvojkridlovaBrana") return "Dvojkrídlová brána"
  if (t === "posuvnaBrana") return "Posúvna brána"
  return "Jednokrídlová bránka"
}

export function GateResults({ vstup, vysledok }: Props) {
  const jeBrana = vstup.typProduktu === "dvojkridlovaBrana"
  const jePosuvna = vstup.typProduktu === "posuvnaBrana"
  return <div className="flex flex-col gap-6">
    <section><h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Zameranie na mieste</h3><div className="rounded-md border border-border bg-card px-4">
      <ParamRow label="Svetlá šírka otvoru" value={`${fmt(vstup.svetlaSirka)} mm`} />
      {!jeBrana && !jePosuvna && <ParamRow label="Vôľa na strane s pántmi" value={`${fmt(vstup.vola)} mm`} />}
      {!jeBrana && !jePosuvna && <ParamRow label="Smer otvárania" value={vstup.smerOtvarania === "vlavo" ? "Panty vľavo" : "Panty vpravo"} />}
      {jeBrana && <ParamRow label="Vôľa vľavo / vpravo" value={`${fmt(vstup.volaVlavo)} / ${fmt(vstup.volaVpravo)} mm`} />}
      {jeBrana && <ParamRow label="Medzera v strede" value={`${fmt(vstup.medzeraStred)} mm`} />}
      {jeBrana && <ParamRow label="Smer otvárania" value={vstup.smerVykyvu === "dnu" ? "Dnu (na pozemok)" : "Von (na ulicu/vjazd)"} />}
      {jePosuvna && <ParamRow label="Presah krídla" value={`${fmt(vstup.presah)} mm`} />}
      {jePosuvna && <ParamRow label="Strana posunu" value={vstup.stranaPosunu === "vlavo" ? "Doľava" : "Doprava"} />}
      <ParamRow label="Výška podmurovky" value={`${fmt(vstup.vyskaPodmurovky)} mm`} />
      <ParamRow label="Medzera pod bránou" value={`${fmt(vstup.medzeraPodBranou)} mm`} />
      <ParamRow label="Požadovaná celková výška" value={`${fmt(vstup.celkovaVyska)} mm`} />
      {(jeBrana || jePosuvna) && <ParamRow label="Pohon" value={vstup.pohon ? "Áno" : "Nie"} />}
    </div></section>

    <section><h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Základné údaje</h3><div className="rounded-md border border-border bg-card px-4">
      <ParamRow label="Produkt" value={nazovProduktu(vstup.typProduktu)} />
      <ParamRow label={jeBrana ? "Rozmer jedného krídla" : "Rozmer krídla"} value={`${fmt(vysledok.sirkaKridla)} × ${fmt(vysledok.vyskaKridla)} mm`} />
      <ParamRow label="Lamela" value={`${vstup.sirkaLamely} mm — ${vstup.povrch}`} />
      <ParamRow label="Orientácia lamiel" value={jeBrana || jePosuvna ? "Horizontálna" : vstup.orientacia === "vertikalne" ? "Vertikálna" : "Horizontálna"} />
      {!jeBrana && <><ParamRow label="Počet lamiel" value={`${vysledok.pocetLamiel} ks`} /><ParamRow label="Skutočná medzera" value={`${fmt(vysledok.skutocnaMedzera, 1)} mm`} /></>}
      {jeBrana && <><ParamRow label="Počet lamiel spolu" value={`${vysledok.pocetLamiel} ks`} /><ParamRow label="Spodná časť / krídlo" value={`${vysledok.lamelySpodnaCast?.pocet ?? 0} ks, priestor ${fmt(vysledok.lamelySpodnaCast?.vyskaMm ?? 0)} mm`} /><ParamRow label="Horná časť / krídlo" value={`${vysledok.lamelyHornaCast?.pocet ?? 0} ks, priestor ${fmt(vysledok.lamelyHornaCast?.vyskaMm ?? 0)} mm`} /></>}
      <ParamRow label="Rezná dĺžka lamely" value={`${fmt(vysledok.dlzkaLamely)} mm`} />
      <ParamRow
        label={jePosuvna ? "Priestor na zasunutie" : jeBrana ? "Priestor pri otvorení (každé krídlo)" : "Priestor pri otvorení na 90°"}
        value={`~${fmt(vysledok.priestorPriOtvoreni)} mm`}
      />
    </div></section>

    <section><h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Rozpis na rezanie — profil 50×60 mm</h3><div className="overflow-hidden rounded-md border border-border bg-card">
      {[vysledok.profilRezy.zvislyRam, vysledok.profilRezy.vodorovnyRam, vysledok.profilRezy.strednaPriecka, vysledok.profilRezy.stlpiky].filter(Boolean).map((rez) => <div key={rez!.nazov} className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"><span className="text-sm text-foreground">{rez!.nazov}</span><span className="font-mono text-base font-bold tabular-nums text-foreground">{rez!.pocet}× {fmt(rez!.dlzkaMm)} mm</span></div>)}
    </div></section>

    <section><h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Kusovník materiálu</h3><div className="flex flex-col gap-3"><MaterialCard polozka={vysledok.material.profil} /><MaterialCard polozka={vysledok.material.lamely} /></div></section>

    <section><h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cenová kalkulácia</h3><div className="rounded-md border border-border bg-card px-4">
      <ParamRow label={`Profil 50×60mm (${vysledok.material.profil.pocetTyci}× ${vysledok.material.profil.cenaKs}€)`} value={`${fmt(vysledok.cena.profil)} €`} />
      <ParamRow label={`Lamely (${vysledok.material.lamely.pocetTyci}× ${vysledok.material.lamely.cenaKs}€)`} value={`${fmt(vysledok.cena.lamely)} €`} />
      <ParamRow label={`Inštalačný kit (${nazovProduktu(vstup.typProduktu).toLowerCase()})`} value={`${fmt(vysledok.cena.instalacnyKit)} €`} />
      {vysledok.prislusenstvoVybrane.map((p) => (
        <ParamRow key={p.nazov} label={p.mnozstvo > 1 ? `${p.nazov} (${p.mnozstvo}×)` : p.nazov} value={`${fmt(p.spolu)} €`} />
      ))}
      <div className="flex items-center justify-between gap-4 py-3"><span className="text-sm font-semibold text-foreground">Spolu (materiál)</span><span className="font-mono text-xl font-bold tabular-nums text-primary">{fmt(vysledok.cena.spolu)} €</span></div>
    </div><p className="mt-2 text-xs text-muted-foreground">Orientačný podklad pre cenovú ponuku — bez práce/montáže a bez DPH.</p></section>
  </div>
}
