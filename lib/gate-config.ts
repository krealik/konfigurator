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
export type TypProduktu = "branka" | "dvojkridlovaBrana" | "posuvnaBrana"

/** Strana — použitá pre smer otvárania (bránka) aj stranu posunu (posúvna brána). */
export type Strana = "vlavo" | "vpravo"

/** Smer výkyvu krídel dvojkrídlovej brány — dovnútra pozemku alebo von na ulicu/vjazd. */
export type SmerVykyvu = "dnu" | "von"

export type SposobKotvenia = "murik" | "stlpiky-beton" | "existujuce-stlpy"
export const SPOSOBY_KOTVENIA = [
  { id: "murik", nazov: "Múrik" },
  { id: "stlpiky-beton", nazov: "Stĺpiky do betónu" },
  { id: "existujuce-stlpy", nazov: "Existujúce stĺpy" },
] as const

/** Údaje o zákazke, spoločné pre všetky produkty na nej — zadávajú sa raz. */
export interface Zakaznik {
  meno: string
  adresa: string
  sposobKotvenia: SposobKotvenia
  poznamky: string
}

export const DEFAULTS_ZAKAZNIK: Zakaznik = {
  meno: "",
  adresa: "",
  sposobKotvenia: "stlpiky-beton",
  poznamky: "",
}

/** Jedna položka voliteľného príslušenstva (k pohonu, alebo štrukturálna ako koľajnica). */
export interface PrislusenstvoPolozka {
  id: string
  nazov: string
  /** Orientačná cena (€/ks) — zatiaľ hrubý odhad, doladí sa neskôr podľa reálneho cenníka. */
  cena: number
  /** Ak true, dá sa zvoliť množstvo (napr. diaľkový ovládač); inak je to jednoducho zapnuté/vypnuté. */
  mnozstvo?: boolean
}

/** Koľajnica/vodiaca lišta — štrukturálna súčasť posúvnej brány, potrebná aj bez pohonu. */
export const PRISLUSENSTVO_KOLAJNICA: PrislusenstvoPolozka = { id: "kolajnica", nazov: "Koľajnica / vodiaca lišta", cena: 180 }

/** Príslušenstvo pre malú bránku — nezávisí od pohonu, bránka sa vždy otvára ručne. */
export const PRISLUSENSTVO_BRANKY: PrislusenstvoPolozka[] = [
  { id: "el-zamok", nazov: "Elektrický zámok", cena: 90 },
  { id: "kryca-lista", nazov: "Krycia lišta", cena: 25 },
]

/**
 * Príslušenstvo k pohonu — líši sa podľa typu brány, relevantné len keď je zapnutý pohon.
 * Jeden pár fotobuniek je súčasťou pohonu (v cene inštalačného kitu) — tu je len DOPLNKOVÉ
 * príslušenstvo, ktoré sa objednáva navyše.
 */
export const PRISLUSENSTVO_POHONU: Record<"dvojkridlovaBrana" | "posuvnaBrana", PrislusenstvoPolozka[]> = {
  dvojkridlovaBrana: [
    { id: "ramena", nazov: "Ramená pohonu (pár)", cena: 250 },
    { id: "majak", nazov: "Maják (výstražné svetlo)", cena: 45 },
    { id: "fotobunky-dalsie", nazov: "Ďalší pár fotobuniek", cena: 80, mnozstvo: true },
    { id: "ovladac", nazov: "Ďalší diaľkový ovládač", cena: 20, mnozstvo: true },
  ],
  posuvnaBrana: [
    { id: "motor", nazov: "Motor pohonu", cena: 350 },
    { id: "majak", nazov: "Maják (výstražné svetlo)", cena: 45 },
    { id: "fotobunky-dalsie", nazov: "Ďalší pár fotobuniek", cena: 80, mnozstvo: true },
    { id: "stop", nazov: "STOP tlačidlo", cena: 25 },
    { id: "ovladac", nazov: "Ďalší diaľkový ovládač", cena: 20, mnozstvo: true },
  ],
}

/** Typ prekážky: obdĺžnik (murovaný stĺp, skriňa…), čiara (stena domu…) alebo existujúci stĺp (referenčný bod). */
export type TypPrekazky = "obdlznik" | "ciara" | "existujuci-stlp"

/**
 * Prekážka na mieste osadenia (stĺp, stena domu, elektroskriňa…).
 * Môže byť obdĺžnik alebo čiara (zvislá stena/stĺp).
 */
export interface Prekazka {
  id: string
  nazov: string
  typ: TypPrekazky
  /** Vzdialenosť ľavého okraja prekážky od ľavého okraja zamerania (mm). */
  poziciaOdKraja: number
  /** Šírka prekážky (mm) — pri type "ciara" je to hrúbka čiary (napr. priemer stĺpa). */
  sirka: number
  /** Spodná hrana prekážky, výška od zeme (mm). */
  vyskaOd: number
  /** Horná hrana prekážky, výška od zeme (mm). */
  vyskaDo: number
}

/** Jedna položka v scéne (jeden produkt na danej zákazke). */
export interface PolozkaSceny {
  id: string
  /** Horizontálna pozícia ľavého okraja produktu v spoločnej scéne (mm). */
  poziciaX: number
}

export const DEFAULTS_POLOZKY = {
  typProduktu: "branka" as TypProduktu,

  // --- Zameranie na mieste ---
  svetlaSirka: 1300,
  vola: 100,
  smerOtvarania: "vlavo" as Strana,

  volaVlavo: 60,
  volaVpravo: 60,
  medzeraStred: 20,
  /** Len dvojkrídlová brána — smer výkyvu krídel pri otváraní. */
  smerVykyvu: "dnu" as SmerVykyvu,

  presah: 500,
  stranaPosunu: "vpravo" as Strana,

  vyskaPodmurovky: 0,
  medzeraPodBranou: 100,
  celkovaVyska: 1600,

  sirkaLamely: 100 as SirkaLamely,
  medzera: 30,
  povrch: "antracit" as PovrchId,
  orientacia: "vertikalne" as Orientacia,

  /** Pohon (motor) — relevantné len pri dvojkrídlovej a posúvnej bráne, otvára zoznam príslušenstva. */
  pohon: false,
  /** Koľajnica/vodiaca lišta — len posúvna brána; štrukturálna súčasť, potrebná aj bez pohonu. */
  kolajnica: true,
  /** Vybrané príslušenstvo k pohonu: id položky → množstvo (1 pre bežný checkbox, viac pri ovládačoch). */
  prislusenstvo: {} as Record<string, number>,
  /** Pozícia ľavého okraja krídla v spoločnej scéne (mm) — undefined = appka ho rozmiestni sama vedľa ostatných. */
  umiestnenieX: undefined as number | undefined,
}

export const DEFAULTS = {
  ...DEFAULTS_POLOZKY,
  // --- Prekážky na mieste (stĺp, stena, elektroskriňa…) ---
  prekazky: [] as Prekazka[],
}

export const RAM_PROFIL_NAZOV = "Profil 50×60mm (rám + stĺpiky)"

export const CENNIK = {
  profilKs: 100,
  lamelaKs: 50,
  instalacnyKitBranka: 150,
  instalacnyKitBrana: 200,
  instalacnyKitPosuvna: 350,
}

export const KLUCKA_VYSKA_MM = 1050
export const PANT_OD_KRAJA_MM = 100
export const FARBA_RAM = "#383E42"
export const FARBA_LAMELA = "#52585C"
