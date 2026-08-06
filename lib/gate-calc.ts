import {
  RAM_PROFIL_HRUBKA_MM,
  DLZKA_TYCE_MM,
  LAMELA_ZASUNUTIE_MM,
  CENNIK,
  najdiPovrch,
  type SirkaLamely,
  type PovrchId,
  type Orientacia,
} from "./gate-config"

export interface GateInput {
  sirkaKridla: number
  vyskaKridla: number
  sirkaLamely: SirkaLamely
  medzera: number
  povrch: PovrchId
  orientacia: Orientacia
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
  spolu: number
}

/** Jedna položka rozpisu na rezanie profilu (dĺžka + počet kusov). */
export interface RezPolozka {
  nazov: string
  dlzkaMm: number
  pocet: number
}

export interface GateResult {
  vnutornaSirka: number
  dlzkaLamely: number
  pocetLamiel: number
  skutocnaMedzera: number
  /** Rezné dĺžky jednotlivých kusov profilu 50×60mm. */
  profilRezy: {
    zvislyRam: RezPolozka
    vodorovnyRam: RezPolozka
    stlpiky: RezPolozka
  }
  material: {
    profil: MaterialPolozka
    lamely: MaterialPolozka
  }
  cena: CenovaKalkulacia
}

/** Koľko tyčí (6 m) treba na pokrytie celkovej dĺžky + koľko materiálu zostane. */
function tyceAOdpad(potrebnaDlzkaMm: number) {
  const pocetTyci = potrebnaDlzkaMm > 0 ? Math.ceil(potrebnaDlzkaMm / DLZKA_TYCE_MM) : 0
  const odpadMm = pocetTyci * DLZKA_TYCE_MM - potrebnaDlzkaMm
  return { pocetTyci, odpadMm }
}

export function vypocitajBranku(vstup: GateInput): GateResult {
  const { sirkaKridla, vyskaKridla, sirkaLamely, medzera, orientacia } = vstup
  const povrch = najdiPovrch(vstup.povrch)

  const vnutornaSirkaOtvoru = sirkaKridla - 2 * RAM_PROFIL_HRUBKA_MM
  const vnutornaVyskaOtvoru = vyskaKridla - 2 * RAM_PROFIL_HRUBKA_MM

  // Pri vertikálnych lamelách sa lamely radia po šírke a majú dĺžku = výška otvoru.
  // Pri horizontálnych sa radia po výške a majú dĺžku = šírka otvoru.
  const vertikalne = orientacia === "vertikalne"
  const rozmerNaRadenie = vertikalne ? vnutornaSirkaOtvoru : vnutornaVyskaOtvoru
  const viditelnaDlzkaLamely = vertikalne ? vnutornaVyskaOtvoru : vnutornaSirkaOtvoru
  // Lamela sa zasúva do rámu z každej strany — rezná dĺžka je preto dlhšia
  // než viditeľný rozmer bránky.
  const dlzkaLamely = viditelnaDlzkaLamely + 2 * LAMELA_ZASUNUTIE_MM

  // Počet lamiel podľa zadanej medzery.
  const pocetLamiel =
    rozmerNaRadenie > 0 ? Math.max(0, Math.floor((rozmerNaRadenie + medzera) / (sirkaLamely + medzera))) : 0

  // Prepočet skutočnej medzery, aby vyšla rovnomerne (aj na krajoch).
  const spotrebovanaSirkaLamiel = pocetLamiel * sirkaLamely
  const skutocnaMedzera = pocetLamiel > 0 ? (rozmerNaRadenie - spotrebovanaSirkaLamiel) / (pocetLamiel + 1) : 0

  // --- Kusovník: Profil 50×60 (rám + stĺpiky) ---
  // Zvislé profily rámu (bočnice): 2 ks v PLNEJ dĺžke = výška krídla.
  //   Sedia na vonkajších rohoch, vodorovné kusy sa opierajú o ne.
  // Vodorovné profily rámu (horná/dolná priečka): 2 ks KRATŠIE, vsadené
  //   MEDZI zvislé kusy → rezná dĺžka = šírka krídla − 2×hrúbka profilu.
  // Stĺpiky: 2 ks, dĺžka = výška krídla (zjednodušený predpoklad).
  const zvislyRamDlzka = vyskaKridla
  const vodorovnyRamDlzka = Math.max(0, sirkaKridla - 2 * RAM_PROFIL_HRUBKA_MM)
  const stlpikDlzka = vyskaKridla

  const profilDlzkaMm = 2 * zvislyRamDlzka + 2 * vodorovnyRamDlzka + 2 * stlpikDlzka
  const profilTyce = tyceAOdpad(profilDlzkaMm)

  // --- Kusovník: Lamely ---
  const lamelyDlzkaMm = pocetLamiel * dlzkaLamely
  const lamelyTyce = tyceAOdpad(lamelyDlzkaMm)

  return {
    vnutornaSirka: rozmerNaRadenie,
    dlzkaLamely,
    pocetLamiel,
    skutocnaMedzera,
    profilRezy: {
      zvislyRam: { nazov: "Zvislý rám (bočnica)", dlzkaMm: zvislyRamDlzka, pocet: 2 },
      vodorovnyRam: { nazov: "Vodorovný rám (priečka)", dlzkaMm: vodorovnyRamDlzka, pocet: 2 },
      stlpiky: { nazov: "Stĺpik", dlzkaMm: stlpikDlzka, pocet: 2 },
    },
    material: {
      profil: {
        nazov: "Profil 50×60mm (rám + stĺpiky)",
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
      instalacnyKit: CENNIK.instalacnyKit,
      spolu: profilTyce.pocetTyci * CENNIK.profilKs + lamelyTyce.pocetTyci * CENNIK.lamelaKs + CENNIK.instalacnyKit,
    },
  }
}
