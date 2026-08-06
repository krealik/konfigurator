// Centrálna konfigurácia produktu.

export const RAM_PROFIL_HRUBKA_MM = 50
export const DLZKA_TYCE_MM = 6000
export const LAMELA_ZASUNUTIE_MM = 15
export const PRIECKA_VYSKA_OD_ZEME_MM = 250

export const SIRKY_LAMIEL_MM = [20, 30, 40, 60, 80, 100, 120, 160, 200] as const
export type SirkaLamely = (typeof SIRKY_LAMIEL_MM)[number]

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

export type Orientacia = "vertikalne" | "horizontalne"
export type TypProduktu = "branka" | "dvojkridlovaBrana"

export const DEFAULTS = {
  typProduktu: "branka" as TypProduktu,
  nazovZakaznika: "",
  sirkaKridla: 1200,
  vyskaKridla: 1500,
  sirkaLamely: 100 as SirkaLamely,
  medzera: 30,
  povrch: "antracit" as PovrchId,
  orientacia: "vertikalne" as Orientacia,
}

export const RAM_PROFIL_NAZOV = "Profil 50×60mm (rám + stĺpiky)"

export const CENNIK = {
  profilKs: 100,
  lamelaKs: 50,
  instalacnyKitBranka: 150,
  instalacnyKitBrana: 200,
}

export const KLUCKA_VYSKA_MM = 1050
export const PANT_OD_KRAJA_MM = 100
export const FARBA_RAM = "#383E42"
export const FARBA_LAMELA = "#52585C"
