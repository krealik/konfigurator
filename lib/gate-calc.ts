import {
  RAM_PROFIL_HRUBKA_MM,
  DLZKA_TYCE_MM,
  LAMELA_ZASUNUTIE_MM,
  PRIECKA_VYSKA_OD_ZEME_MM,
  CENNIK,
  najdiPovrch,
  type SirkaLamely,
  type PovrchId,
  type Orientacia,
  type TypProduktu,
  type Strana,
  type Prekazka,
} from "./gate-config"

export interface GateInput {
  typProduktu: TypProduktu

  // --- Zameranie na mieste ---
  svetlaSirka: number
  vola: number
  smerOtvarania: Strana

  volaVlavo: number
  volaVpravo: number
  medzeraStred: number

  presah: number
  stranaPosunu: Strana

  vyskaPodmurovky: number
  medzeraPodBranou: number
  celkovaVyska: number

  sirkaLamely: SirkaLamely
  medzera: number
  povrch: PovrchId
  orientacia: Orientacia

  /** Pohon (motor) — relevantné len pri dvojkrídlovej a posúvnej bráne. */
  pohon: boolean

  // Prekážky sú spoločné pre celú scénu — uchovávané v GateInput pre spätnú kompatibilitu.
  prekazky: Prekazka[]
}

export interface ZameranieVysledok {
  sirkaKridla: number
  vyskaKridla: number
  varovania: string[]
}

export function vypocitajZZamerania(vstup: GateInput): ZameranieVysledok {
  const varovania: string[] = []

  let sirkaKridla: number
  if (vstup.typProduktu === "dvojkridlovaBrana") {
    sirkaKridla = (vstup.svetlaSirka - vstup.volaVlavo - vstup.volaVpravo - vstup.medzeraStred) / 2
  } else if (vstup.typProduktu === "posuvnaBrana") {
    sirkaKridla = vstup.svetlaSirka + vstup.presah
  } else {
    sirkaKridla = vstup.svetlaSirka - vstup.vola
  }
  if (sirkaKridla <= 0) {
    varovania.push("Šírka krídla vyšla 0 alebo menej — skontroluj svetlú šírku otvoru a vôľu/presah.")
    sirkaKridla = 0
  }

  let vyskaKridla = vstup.celkovaVyska - vstup.vyskaPodmurovky - vstup.medzeraPodBranou
  if (vyskaKridla <= 0) {
    varovania.push("Výška krídla vyšla 0 alebo menej — skontroluj celkovú výšku, výšku podmurovky a medzeru pod bránou.")
    vyskaKridla = 0
  }

  return { sirkaKridla, vyskaKridla, varovania }
}

export interface MaterialPolozka {
  nazov: string
  potrebnaDlzkaMm: number
  potrebnaDlzkaM: number
  pocetTyci: number
  odpadMm: number
  cenaKs: number
  cenaSpolu: number
}

export interface CenovaKalkulacia {
  profil: number
  lamely: number
  instalacnyKit: number
  pohon: number
  spolu: number
}

export interface RezPolozka {
  nazov: string
  dlzkaMm: number
  pocet: number
}

export interface GateResult {
  typProduktu: TypProduktu
  sirkaKridla: number
  vyskaKridla: number
  pocetKridiel: number
  vnutornaSirka: number
  dlzkaLamely: number
  pocetLamiel: number
  skutocnaMedzera: number
  lamelySpodnaCast?: { vyskaMm: number; pocet: number; skutocnaMedzera: number }
  lamelyHornaCast?: { vyskaMm: number; pocet: number; skutocnaMedzera: number }
  profilRezy: {
    zvislyRam: RezPolozka
    vodorovnyRam: RezPolozka
    strednaPriecka?: RezPolozka
    stlpiky: RezPolozka
  }
  material: {
    profil: MaterialPolozka
    lamely: MaterialPolozka
  }
  cena: CenovaKalkulacia
  priestorPriOtvoreni: number
  smerOtvarania?: Strana
  stranaPosunu?: Strana
  pohon: boolean
  varovania: string[]
}

function tyceAOdpad(potrebnaDlzkaMm: number) {
  const pocetTyci = potrebnaDlzkaMm > 0 ? Math.ceil(potrebnaDlzkaMm / DLZKA_TYCE_MM) : 0
  const odpadMm = pocetTyci * DLZKA_TYCE_MM - potrebnaDlzkaMm
  return { pocetTyci, odpadMm }
}

function pocetARovnomernaMedzera(rozmer: number, sirka: number, medzera: number) {
  const pocet = rozmer > 0 ? Math.max(0, Math.floor((rozmer + medzera) / (sirka + medzera))) : 0
  const spotrebovanaSirka = pocet * sirka
  const skutocnaMedzera = pocet > 0 ? (rozmer - spotrebovanaSirka) / (pocet + 1) : 0
  return { pocet, skutocnaMedzera }
}

export function vypocitajBranku(vstup: GateInput, zameranie: ZameranieVysledok): GateResult {
  const { sirkaLamely, medzera } = vstup
  const { sirkaKridla, vyskaKridla, varovania } = zameranie
  const povrch = najdiPovrch(vstup.povrch)
  const jeBrana = vstup.typProduktu === "dvojkridlovaBrana"
  const jePosuvna = vstup.typProduktu === "posuvnaBrana"
  const pocetKridiel = jeBrana ? 2 : 1
  const orientacia = jeBrana || jePosuvna ? "horizontalne" : vstup.orientacia

  const vnutornaSirkaOtvoru = Math.max(0, sirkaKridla - 2 * RAM_PROFIL_HRUBKA_MM)
  const vnutornaVyskaOtvoru = Math.max(0, vyskaKridla - 2 * RAM_PROFIL_HRUBKA_MM)
  const vertikalne = orientacia === "vertikalne"

  let pocetLamiel = 0
  let skutocnaMedzera = 0
  let dlzkaLamely = 0
  let lamelySpodnaCast: GateResult["lamelySpodnaCast"]
  let lamelyHornaCast: GateResult["lamelyHornaCast"]

  if (jeBrana) {
    const spodnaVyska = Math.max(0, PRIECKA_VYSKA_OD_ZEME_MM - RAM_PROFIL_HRUBKA_MM)
    const hornaVyska = Math.max(0, vnutornaVyskaOtvoru - spodnaVyska - RAM_PROFIL_HRUBKA_MM)
    const spodna = pocetARovnomernaMedzera(spodnaVyska, sirkaLamely, medzera)
    const horna = pocetARovnomernaMedzera(hornaVyska, sirkaLamely, medzera)

    lamelySpodnaCast = { vyskaMm: spodnaVyska, pocet: spodna.pocet, skutocnaMedzera: spodna.skutocnaMedzera }
    lamelyHornaCast = { vyskaMm: hornaVyska, pocet: horna.pocet, skutocnaMedzera: horna.skutocnaMedzera }
    pocetLamiel = (spodna.pocet + horna.pocet) * pocetKridiel
    skutocnaMedzera = (spodna.skutocnaMedzera + horna.skutocnaMedzera) / 2
    dlzkaLamely = vnutornaSirkaOtvoru + 2 * LAMELA_ZASUNUTIE_MM
  } else {
    const rozmerNaRadenie = vertikalne ? vnutornaSirkaOtvoru : vnutornaVyskaOtvoru
    const viditelnaDlzkaLamely = vertikalne ? vnutornaVyskaOtvoru : vnutornaSirkaOtvoru
    const radenie = pocetARovnomernaMedzera(rozmerNaRadenie, sirkaLamely, medzera)
    pocetLamiel = radenie.pocet
    skutocnaMedzera = radenie.skutocnaMedzera
    dlzkaLamely = viditelnaDlzkaLamely + 2 * LAMELA_ZASUNUTIE_MM
  }

  const zvislyRamDlzka = vyskaKridla
  const vodorovnyRamDlzka = Math.max(0, sirkaKridla - 2 * RAM_PROFIL_HRUBKA_MM)
  const stlpikDlzka = vyskaKridla
  const pocetZvislych = jeBrana ? 4 : 2
  const pocetVodorovnych = jeBrana ? 4 : 2
  const pocetStrednych = jeBrana ? 2 : 0
  const profilDlzkaMm =
    pocetZvislych * zvislyRamDlzka +
    pocetVodorovnych * vodorovnyRamDlzka +
    pocetStrednych * vodorovnyRamDlzka +
    (jeBrana ? 0 : 2 * stlpikDlzka)
  const profilTyce = tyceAOdpad(profilDlzkaMm)

  const lamelyDlzkaMm = pocetLamiel * dlzkaLamely
  const lamelyTyce = tyceAOdpad(lamelyDlzkaMm)
  const instalacnyKit = jeBrana
    ? CENNIK.instalacnyKitBrana
    : jePosuvna
      ? CENNIK.instalacnyKitPosuvna
      : CENNIK.instalacnyKitBranka
  // Pohon má zmysel len pri dvojkrídlovej a posúvnej bráne (bránka sa vždy otvára ručne).
  const cenaPohonu = vstup.pohon && (jeBrana || jePosuvna) ? CENNIK.pohonPriplatok : 0

  return {
    typProduktu: vstup.typProduktu,
    sirkaKridla,
    vyskaKridla,
    pocetKridiel,
    vnutornaSirka: vnutornaSirkaOtvoru,
    dlzkaLamely,
    pocetLamiel,
    skutocnaMedzera,
    lamelySpodnaCast,
    lamelyHornaCast,
    profilRezy: {
      zvislyRam: { nazov: jeBrana ? "Zvislý rám — bočnice krídel" : "Zvislý rám (bočnica)", dlzkaMm: zvislyRamDlzka, pocet: pocetZvislych },
      vodorovnyRam: { nazov: "Vodorovný rám — horný + dolný", dlzkaMm: vodorovnyRamDlzka, pocet: pocetVodorovnych },
      ...(jeBrana ? { strednaPriecka: { nazov: `Priečka pohonu — ${PRIECKA_VYSKA_OD_ZEME_MM} mm od zeme`, dlzkaMm: vodorovnyRamDlzka, pocet: pocetStrednych } } : {}),
      stlpiky: { nazov: "Stĺpik", dlzkaMm: stlpikDlzka, pocet: jeBrana ? 0 : 2 },
    },
    material: {
      profil: {
        nazov: "Profil 50×60mm (rám + priečka)",
        potrebnaDlzkaMm: profilDlzkaMm,
        potrebnaDlzkaM: profilDlzkaMm / 1000,
        pocetTyci: profilTyce.pocetTyci,
        odpadMm: profilTyce.odpadMm,
        cenaKs: CENNIK.profilKs,
        cenaSpolu: profilTyce.pocetTyci * CENNIK.profilKs,
      },
      lamely: {
        nazov: `Lamela ${sirkaLamely}mm — ${povrch.nazov}`,
        potrebnaDlzkaMm: lamelyDlzkaMm,
        potrebnaDlzkaM: lamelyDlzkaMm / 1000,
        pocetTyci: lamelyTyce.pocetTyci,
        odpadMm: lamelyTyce.odpadMm,
        cenaKs: CENNIK.lamelaKs,
        cenaSpolu: lamelyTyce.pocetTyci * CENNIK.lamelaKs,
      },
    },
    cena: {
      profil: profilTyce.pocetTyci * CENNIK.profilKs,
      lamely: lamelyTyce.pocetTyci * CENNIK.lamelaKs,
      instalacnyKit,
      pohon: cenaPohonu,
      spolu: profilTyce.pocetTyci * CENNIK.profilKs + lamelyTyce.pocetTyci * CENNIK.lamelaKs + instalacnyKit + cenaPohonu,
    },
    priestorPriOtvoreni: sirkaKridla,
    smerOtvarania: !jeBrana && !jePosuvna ? vstup.smerOtvarania : undefined,
    stranaPosunu: jePosuvna ? vstup.stranaPosunu : undefined,
    pohon: vstup.pohon && (jeBrana || jePosuvna),
    varovania,
  }
}
