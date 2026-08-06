// Centrálna konfigurácia produktu.
// Všetky "meniteľné" hodnoty (šírky lamiel, budúce ceny) držíme tu,
// aby sa dali upraviť bez zásahu do UI komponentov.

/** Hrúbka ramenného profilu, ktorá zasahuje do plochy bránky (mm).
 *  Profil je 50×60 mm, strana 50 mm ide dovnútra. */
export const RAM_PROFIL_HRUBKA_MM = 50

/** Dĺžka jednej tyče materiálu pri objednávaní (mm). */
export const DLZKA_TYCE_MM = 6000

/** Lamela sa zasúva do rámového profilu z každej strany o toľkoto (mm).
 *  Rezná dĺžka lamely = viditeľný priestor + 2× toto číslo. */
export const LAMELA_ZASUNUTIE_MM = 15

/** Dostupné šírky lamiel (mm). */
export const SIRKY_LAMIEL_MM = [20, 30, 40, 60, 80, 100, 120, 160, 200] as const
export type SirkaLamely = (typeof SIRKY_LAMIEL_MM)[number]

/** Dostupné povrchové úpravy (vzhľad) lamely.
 *  `drevo` = drevodekor (v náhľade dostane jemný textúrový prechod). */
export const POVRCHY = [
  { id: "antracit", nazov: "Antracit RAL 7016", farba: "#383E42", drevo: false },
  { id: "biela", nazov: "Biela", farba: "#F4F4F0", drevo: false },
  { id: "dub", nazov: "Dub", farba: "#C69A5B", drevo: true },
  { id: "hneda", nazov: "Hnedá RAL 8017", farba: "#45322E", drevo: false },
  { id: "orech", nazov: "Orech", farba: "#6B4A2B", drevo: true },
  { id: "siva", nazov: "Sivá RAL 9006", farba: "#A4A6A9", drevo: false },
  { id: "zlaty-dub", nazov: "Zlatý dub", farba: "#B4762F", drevo: true },
  { id: "cierna", nazov: "Čierna RAL 9005", farba: "#0E0E0E", drevo: false },
] as const
export type PovrchId = (typeof POVRCHY)[number]["id"]

export function najdiPovrch(id: PovrchId) {
  return POVRCHY.find((p) => p.id === id) ?? POVRCHY[0]
}

/** Osadenie (orientácia) lamiel. */
export type Orientacia = "vertikalne" | "horizontalne"

/** Predvolené hodnoty formulára. */
export const DEFAULTS = {
  sirkaKridla: 1200,
  vyskaKridla: 1500,
  sirkaLamely: 100 as SirkaLamely,
  medzera: 30,
  povrch: "antracit" as PovrchId,
  orientacia: "vertikalne" as Orientacia,
}

/** Popis profilu použitého na rám aj stĺpiky. */
export const RAM_PROFIL_NAZOV = "Profil 50×60mm (rám + stĺpiky)"

// Ceny za kus materiálu (€) — jednotné zatiaľ, bez ohľadu na šírku lamely.
// Meníš len tu, nikde v komponentoch.
export const CENNIK = {
  profilKs: 100, // € / 6m tyč profilu 50×60mm
  lamelaKs: 50, // € / 6m tyč lamely
  instalacnyKit: 150, // € — kľučka, zámok, panty a ostatný kovaný materiál
}

/** Výška osi kľučky od spodku krídla (mm). */
export const KLUCKA_VYSKA_MM = 1050

/** Vzdialenosť stredu panta od spodku / od vrchu krídla (mm). */
export const PANT_OD_KRAJA_MM = 100

/** RAL 7016 antracit – firemná farba. */
export const FARBA_RAM = "#383E42"
export const FARBA_LAMELA = "#52585C"
