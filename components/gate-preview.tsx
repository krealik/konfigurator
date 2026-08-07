"use client"

import { useRef, useState } from "react"
import { RAM_PROFIL_HRUBKA_MM, PRIECKA_VYSKA_OD_ZEME_MM, FARBA_RAM, najdiPovrch, KLUCKA_VYSKA_MM, PANT_OD_KRAJA_MM, type Prekazka } from "@/lib/gate-config"
import type { GateInput, GateResult } from "@/lib/gate-calc"

const CUT_COLOR = "#E63946"
/** Predvolená hrúbka nakreslenej čiary (stĺp/stena) v mm — upraviteľná potom v popoveri. */
export const HRUBKA_CIARY_MM = 100
interface Props {
  vstup: GateInput
  vysledok: GateResult
  /** Keď je true, náhľad je v móde kreslenia prekážok (ťahaním myšou/prstom). */
  kreslenie?: boolean
  /** Zavolané po dokreslení novej prekážky (súradnice už prepočítané do mm priestoru krídla) —
   *  spolu s pozíciou na obrazovke (px), kam sa má umiestniť potvrdzovací popover. */
  onPridajPrekazku?: (p: Prekazka, screenPos: { x: number; y: number }) => void
  /** Zavolané pri ťahaní existujúcej prekážky (dopasovanie polohy priamo na plátne). */
  onPresunPrekazku?: (id: string, patch: Partial<Prekazka>) => void
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

const MARKER_SUFFIX: Record<string, string> = { "#383E42": "", "#2A2A2A": "Dark", "#5B6166": "Gray" }

/** Vodorovná technická kóta so šípkami na koncoch a popiskom nad čiarou. Text má biely obrys, aby bol čitateľný aj nad tmavými lamelami. */
function DimLineH({ y, x1, x2, label, fontSize, tick, stroke, color = "#383E42" }:
  { y: number; x1: number; x2: number; label: string; fontSize: number; tick: number; stroke: number; color?: string }) {
  const suf = MARKER_SUFFIX[color] ?? ""
  return <g stroke={color} strokeWidth={stroke} fill={color}>
    <line x1={x1} y1={y - tick * 0.5} x2={x1} y2={y + tick * 0.5} />
    <line x1={x2} y1={y - tick * 0.5} x2={x2} y2={y + tick * 0.5} />
    <line x1={x1} y1={y} x2={x2} y2={y} markerStart={`url(#arrowStart${suf})`} markerEnd={`url(#arrowEnd${suf})`} />
    <text x={(x1 + x2) / 2} y={y - tick * 0.6} fontSize={fontSize} textAnchor="middle" fontWeight={700} stroke="white" strokeWidth={fontSize * 0.22} paintOrder="stroke" fontFamily="monospace">{label}</text>
  </g>
}

/** Zvislá technická kóta so šípkami na koncoch a popiskom otočeným pozdĺž čiary. Text má biely obrys, aby bol čitateľný aj nad tmavými lamelami. */
function DimLineV({ x, y1, y2, label, fontSize, tick, stroke, color = "#383E42" }:
  { x: number; y1: number; y2: number; label: string; fontSize: number; tick: number; stroke: number; color?: string }) {
  const suf = MARKER_SUFFIX[color] ?? ""
  return <g stroke={color} strokeWidth={stroke} fill={color}>
    <line x1={x - tick * 0.5} y1={y1} x2={x + tick * 0.5} y2={y1} />
    <line x1={x - tick * 0.5} y1={y2} x2={x + tick * 0.5} y2={y2} />
    <line x1={x} y1={y1} x2={x} y2={y2} markerStart={`url(#arrowStart${suf})`} markerEnd={`url(#arrowEnd${suf})`} />
    <text x={x - tick * 0.6} y={(y1 + y2) / 2} fontSize={fontSize} textAnchor="middle" fontWeight={700} stroke="white" strokeWidth={fontSize * 0.22} paintOrder="stroke" fontFamily="monospace" transform={`rotate(-90 ${x - tick * 0.6} ${(y1 + y2) / 2})`}>{label}</text>
  </g>
}

/** Spoločné SVG marker definície pre šípky na kótach — vlož raz do <defs>. */
function DimArrowDefs() {
  return <>
    <marker id="arrowStart" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M6,0 L0,3 L6,6" fill="none" stroke="#383E42" strokeWidth="1.4" /></marker>
    <marker id="arrowEnd" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto"><path d="M2,0 L8,3 L2,6" fill="none" stroke="#383E42" strokeWidth="1.4" /></marker>
    <marker id="arrowStartDark" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M6,0 L0,3 L6,6" fill="none" stroke="#2A2A2A" strokeWidth="1.4" /></marker>
    <marker id="arrowEndDark" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto"><path d="M2,0 L8,3 L2,6" fill="none" stroke="#2A2A2A" strokeWidth="1.4" /></marker>
    <marker id="arrowStartGray" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M6,0 L0,3 L6,6" fill="none" stroke="#5B6166" strokeWidth="1.4" /></marker>
    <marker id="arrowEndGray" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto"><path d="M2,0 L8,3 L2,6" fill="none" stroke="#5B6166" strokeWidth="1.4" /></marker>
  </>
}

/**
 * Vykreslí zakreslené prekážky (stĺp, stena, elektroskriňa…) ako sivé referenčné bloky
 * v pozadí náhľadu — len orientačne, appka kolízie automaticky nekontroluje.
 * Súradnice prekážok sú od ľavého okraja zamerania a od zeme; vyskaKridla určuje, kde je zem (Y=0 je vrch).
 */
function PrekazkyLayer({ prekazky, vyskaKridla }: { prekazky: Prekazka[]; vyskaKridla: number }) {
  if (!prekazky || prekazky.length === 0) return null
  const fontSize = clamp(vyskaKridla / 42, 20, 34)
  return (
    <g>
      {prekazky.map((p) => {
        const y = vyskaKridla - p.vyskaDo
        const h = Math.max(0, p.vyskaDo - p.vyskaOd)
        if (p.typ === "ciara") {
          // Čiara (stena, stĺp) — zvislá čiara s hrúbkou
          const cx = p.poziciaOdKraja + p.sirka / 2
          return (
            <g key={p.id}>
              <line x1={cx} y1={y} x2={cx} y2={y + h} stroke="#5B6166" strokeWidth={Math.max(p.sirka, 3)} />
              <text x={cx} y={y - fontSize * 0.4} fontSize={fontSize} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5B6166" stroke="white" strokeWidth={fontSize*0.22} paintOrder="stroke">{p.nazov}</text>
            </g>
          )
        }
        if (p.typ === "existujuci-stlp") {
          // Existujúci stĺp — referenčný bod (plná výplň, iná farba), z neho sa odvodzuje svetlá šírka.
          return (
            <g key={p.id}>
              <rect x={p.poziciaOdKraja} y={y} width={p.sirka} height={h} fill="#8B5E34" stroke="#5C3A1E" strokeWidth={2.5} />
              <text x={p.poziciaOdKraja + p.sirka / 2} y={y - fontSize * 0.4} fontSize={fontSize} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5C3A1E">
                {p.nazov}
              </text>
            </g>
          )
        }
        return (
          <g key={p.id}>
            <rect x={p.poziciaOdKraja} y={y} width={p.sirka} height={h} fill="rgba(91,97,102,0.2)" stroke="#5B6166" strokeWidth={2.5} strokeDasharray="10 7" />
            <text x={p.poziciaOdKraja + p.sirka / 2} y={y - fontSize * 0.4} fontSize={fontSize} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5B6166">
              {p.nazov}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/**
 * Prevedie súradnice myši/prsta (klientské px) na mm súradnice vo vnútri prekreslenej skupiny
 * krídla (rovnaký priestor ako sirkaKridla/vyskaKridla a PrekazkyLayer) — odpočíta okraje aj
 * transform celého SVG (viewBox, zoom, veľkosť na obrazovke).
 */
function bodDoMm(svg: SVGSVGElement, clientX: number, clientY: number, marginL: number, marginT: number) {
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const p = pt.matrixTransform(ctm.inverse())
  return { x: p.x - marginL, y: p.y - marginT }
}

/**
 * Spoločná logika kreslenia prekážky v náhľade — jeden hook pre všetky tri varianty
 * (bránka, dvojkrídlová, posúvna), líšia sa len svojím marginL/marginT/vyskaKridla.
 *
 * Kreslenie funguje na DVA KLIKY (nie ťahanie): prvý klik označí prvý bod (napr. jeden stĺp),
 * druhý klik označí druhý bod (napr. druhý stĺp) — appka dopočíta vzdialenosť medzi nimi.
 * Medzitým (kým čakáme na druhý klik) sa zobrazuje živá náhľadová čiara sledujúca kurzor.
 *
 * Ak ťah (stlač-ťahaj-pusť) začne NA existujúcej prekážke, namiesto kreslenia novej sa táto
 * prekážka presunie (dopasovanie na mieste, bez ručného prepisovania čísel) — táto funkcia
 * zostáva na drag geste, keďže ide o odlišnú akciu než kreslenie novej čiary.
 */
function useKreslenieProekazky(
  svgRef: React.RefObject<SVGSVGElement | null>,
  aktivne: boolean,
  marginL: number,
  marginT: number,
  vyskaKridla: number,
  prekazky: Prekazka[],
  onPridaj?: (p: Prekazka, screenPos: { x: number; y: number }) => void,
  onPresun?: (id: string, patch: Partial<Prekazka>) => void,
) {
  const [presuvam, setPresuvam] = useState<{ id: string; startX: number; startY: number; orig: Prekazka } | null>(null)
  const [bod1, setBod1] = useState<{ x: number; y: number } | null>(null)
  const [zivyBod2, setZivyBod2] = useState<{ x: number; y: number } | null>(null)
  const potlacKlikRef = useRef(false)

  function najdiPodBodom(xMm: number, yMm: number) {
    // yMm je v súradniciach "zhora" (SVG), prekážka má vyskaOd/vyskaDo od zeme — treba prepočítať.
    return prekazky.find((p) => {
      const yTop = vyskaKridla - p.vyskaDo
      const yBottom = vyskaKridla - p.vyskaOd
      return xMm >= p.poziciaOdKraja && xMm <= p.poziciaOdKraja + p.sirka && yMm >= yTop && yMm <= yBottom
    })
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!aktivne || !svgRef.current) return
    const { x, y } = bodDoMm(svgRef.current, e.clientX, e.clientY, marginL, marginT)
    const zasiahnuta = onPresun ? najdiPodBodom(x, y) : undefined
    if (zasiahnuta) {
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      setPresuvam({ id: zasiahnuta.id, startX: x, startY: y, orig: zasiahnuta })
      potlacKlikRef.current = true
    }
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!aktivne || !svgRef.current) return
    const { x, y } = bodDoMm(svgRef.current, e.clientX, e.clientY, marginL, marginT)
    if (presuvam && onPresun) {
      const dx = Math.round(x - presuvam.startX)
      const dy = Math.round(y - presuvam.startY) // kladné dy = smerom dole na obrazovke = nižšie od zeme
      onPresun(presuvam.id, {
        poziciaOdKraja: Math.max(0, presuvam.orig.poziciaOdKraja + dx),
        vyskaOd: Math.max(0, presuvam.orig.vyskaOd - dy),
        vyskaDo: Math.max(0, presuvam.orig.vyskaDo - dy),
      })
      return
    }
    if (bod1) setZivyBod2({ x, y })
  }

  function onPointerUp() {
    if (presuvam) setPresuvam(null)
  }

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!aktivne || !svgRef.current) return
    if (potlacKlikRef.current) {
      potlacKlikRef.current = false
      return
    }
    const { x, y } = bodDoMm(svgRef.current, e.clientX, e.clientY, marginL, marginT)
    if (!bod1) {
      setBod1({ x, y })
      setZivyBod2({ x, y })
      return
    }
    // Podľa toho, ktorým smerom sa viac ťahalo, vznikne buď vodorovná čiara (šírka/stena pozdĺž frontu)
    // alebo zvislá čiara (stĺp, hrúbka HRUBKA_CIARY_MM) — nie obdĺžnik kombinujúci oba rozmery naraz.
    const dx = x - bod1.x
    const dy = y - bod1.y
    const jeVodorovna = Math.abs(dx) >= Math.abs(dy)
    let poziciaOdKraja: number, sirka: number, vyskaOd: number, vyskaDo: number, nazov: string
    if (jeVodorovna) {
      poziciaOdKraja = Math.round(Math.min(bod1.x, x))
      sirka = Math.round(Math.max(30, Math.abs(dx)))
      const yStred = Math.max(0, vyskaKridla - bod1.y)
      vyskaOd = Math.round(Math.max(0, yStred - HRUBKA_CIARY_MM / 2))
      vyskaDo = Math.round(vyskaOd + HRUBKA_CIARY_MM)
      nazov = "Stena"
    } else {
      poziciaOdKraja = Math.round(bod1.x - HRUBKA_CIARY_MM / 2)
      sirka = HRUBKA_CIARY_MM
      const yTop = Math.min(bod1.y, y)
      const yBottom = Math.max(bod1.y, y)
      vyskaOd = Math.round(Math.max(0, vyskaKridla - yBottom))
      vyskaDo = Math.round(Math.max(vyskaOd + 30, vyskaKridla - yTop))
      nazov = "Stĺp"
    }
    if ((Math.abs(dx) > 10 || Math.abs(dy) > 10) && onPridaj) {
      onPridaj(
        { id: `p${Date.now()}${Math.round(Math.random() * 1000)}`, nazov, typ: "obdlznik" as const, poziciaOdKraja, sirka, vyskaOd, vyskaDo },
        { x: e.clientX, y: e.clientY },
      )
    }
    setBod1(null)
    setZivyBod2(null)
  }

  return { bod1, zivyBod2, onPointerDown, onPointerMove, onPointerUp, onClick }
}

/** Živý náhľad medzi prvým klikom a aktuálnou pozíciou kurzora — čistá čiara (vodorovná alebo zvislá,
 *  podľa toho, ktorým smerom sa práve ťahá viac), ukazuje sa kým sa čaká na druhý klik. */
export function ZivaCiaraNahlad({ bod1, bod2, fontSize, stroke }: { bod1: { x: number; y: number }; bod2: { x: number; y: number }; fontSize: number; stroke: number }) {
  const dx = bod2.x - bod1.x
  const dy = bod2.y - bod1.y
  const jeVodorovna = Math.abs(dx) >= Math.abs(dy)
  const koniecX = jeVodorovna ? bod2.x : bod1.x
  const koniecY = jeVodorovna ? bod1.y : bod2.y
  const dlzka = Math.round(jeVodorovna ? Math.abs(dx) : Math.abs(dy))
  const midX = (bod1.x + koniecX) / 2
  const midY = (bod1.y + koniecY) / 2
  return (
    <g>
      <line x1={bod1.x} y1={bod1.y} x2={koniecX} y2={koniecY} stroke="#E63946" strokeWidth={stroke * 1.6} strokeDasharray={`${fontSize * 0.35} ${fontSize * 0.3}`} />
      <circle cx={bod1.x} cy={bod1.y} r={fontSize * 0.28} fill="#E63946" />
      <circle cx={koniecX} cy={koniecY} r={fontSize * 0.2} fill="#E63946" />
      <text
        x={midX}
        y={jeVodorovna ? midY - fontSize * 0.5 : midY}
        fontSize={fontSize}
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight={700}
        fill="#E63946"
        stroke="white"
        strokeWidth={fontSize * 0.22}
        paintOrder="stroke"
        transform={jeVodorovna ? undefined : `rotate(-90 ${midX} ${midY})`}
      >
        {dlzka} mm
      </text>
    </g>
  )
}


export function GatePreview({ vstup, vysledok, kreslenie, onPridajPrekazku, onPresunPrekazku }: Props) {
  if (vstup.typProduktu === "dvojkridlovaBrana") return <DvojkridlovaPreview vstup={vstup} vysledok={vysledok} kreslenie={kreslenie} onPridajPrekazku={onPridajPrekazku} onPresunPrekazku={onPresunPrekazku} />
  if (vstup.typProduktu === "posuvnaBrana") return <PosuvnaPreview vstup={vstup} vysledok={vysledok} kreslenie={kreslenie} onPridajPrekazku={onPridajPrekazku} onPresunPrekazku={onPresunPrekazku} />
  return <BrankaPreview vstup={vstup} vysledok={vysledok} kreslenie={kreslenie} onPridajPrekazku={onPridajPrekazku} onPresunPrekazku={onPresunPrekazku} />
}

function BrankaPreview({ vstup, vysledok, kreslenie, onPridajPrekazku, onPresunPrekazku }: Props) {
  const sirkaKridla = vysledok.sirkaKridla, vyskaKridla = vysledok.vyskaKridla
  const { sirkaLamely } = vstup
  const povrch = najdiPovrch(vstup.povrch)
  const ram = RAM_PROFIL_HRUBKA_MM
  const innerX = ram, innerY = ram, innerW = Math.max(0, sirkaKridla - 2 * ram), innerH = Math.max(0, vyskaKridla - 2 * ram)
  const vert = vstup.orientacia === "vertikalne"
  // Panty a kľučka sa umiestňujú podľa smeru otvárania (bez SVG mirror transformu, kvôli čitateľnosti textov).
  const pantyVlavo = vstup.smerOtvarania !== "vpravo"
  // Oblúk otvorenia zasahuje pod bránku (nie do strany), takže margin je len mierne asymetrický kvôli kovaniu.
  const marginL = 300, marginT = 260, marginR = 300, marginB = 320
  const vbW = sirkaKridla + marginL + marginR, vbH = vyskaKridla + marginT + marginB
  // Rozmerovo nezávislé veľkosti (v jednotkách viewBoxu, ktorý sleduje mm) — s dolnými/hornými limitmi,
  // aby popisky a značky ostali čitateľné pri malých aj veľkých bránach.
  const scale = Math.max(sirkaKridla, vyskaKridla)
  const fontSize = clamp(scale / 26, 32, 58)
  const cutFont = fontSize * 0.62
  const stroke = clamp(scale / 340, 2.2, 5)
  const tick = fontSize * 0.9
  const lamely: number[] = []
  const start = vert ? innerX : innerY
  for (let i = 0; i < vysledok.pocetLamiel; i++) lamely.push(start + vysledok.skutocnaMedzera * (i + 1) + sirkaLamely * i)
  const fill = povrch.drevo ? "url(#drevo)" : povrch.farba
  // Kovanie: pevná minimálna veľkosť v mm-jednotkách viewboxu, aby bolo vidno aj pri veľkých bránach.
  const hwSize = clamp(scale * 0.045, 40, 70)
  const svgRef = useRef<SVGSVGElement>(null)
  const { bod1, zivyBod2, onPointerDown, onPointerMove, onPointerUp, onClick } = useKreslenieProekazky(svgRef, !!kreslenie, marginL, marginT, vyskaKridla, vstup.prekazky, onPridajPrekazku, onPresunPrekazku)
  return <svg ref={svgRef} viewBox={`0 0 ${vbW} ${vbH}`} className={"h-auto w-full" + (kreslenie ? " cursor-crosshair touch-none" : "")} role="img" aria-label={`Náhľad bránky ${sirkaKridla} × ${vyskaKridla} mm`}
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={onClick}>
    <defs><DimArrowDefs /><linearGradient id="drevo" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={povrch.farba}/><stop offset="45%" stopColor="rgba(255,255,255,0.18)"/><stop offset="55%" stopColor={povrch.farba}/><stop offset="100%" stopColor="rgba(0,0,0,0.22)"/></linearGradient></defs>
    <g transform={`translate(${marginL} ${marginT})`}>
      <PrekazkyLayer prekazky={vstup.prekazky} vyskaKridla={vyskaKridla} />
      {bod1 && zivyBod2 && <ZivaCiaraNahlad bod1={bod1} bod2={zivyBod2} fontSize={cutFont} stroke={stroke} />}
      <rect width={sirkaKridla} height={vyskaKridla} fill="white" />
      {lamely.map((pos, i) => <rect key={i} x={vert ? pos : innerX} y={vert ? innerY : pos} width={vert ? sirkaLamely : innerW} height={vert ? innerH : sirkaLamely} fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth={stroke*.5}/>) }
      <g fill={FARBA_RAM}><rect width={ram} height={vyskaKridla}/><rect x={sirkaKridla-ram} width={ram} height={vyskaKridla}/><rect x={ram} width={sirkaKridla-2*ram} height={ram}/><rect x={ram} y={vyskaKridla-ram} width={sirkaKridla-2*ram} height={ram}/></g>
      {/* Rezné značky: zvislé bočnice idú v plnej dĺžke (celé rohy), vodorovné kusy sú vsadené MEDZI ne. */}
      <g stroke={CUT_COLOR} strokeWidth={stroke*1.3} strokeDasharray={`${fontSize*.35} ${fontSize*.35}`}>
        <line x1={0} y1={ram} x2={sirkaKridla} y2={ram} />
        <line x1={0} y1={vyskaKridla-ram} x2={sirkaKridla} y2={vyskaKridla-ram} />
        <line x1={ram} y1={0} x2={ram} y2={vyskaKridla} />
        <line x1={sirkaKridla-ram} y1={0} x2={sirkaKridla-ram} y2={vyskaKridla} />
      </g>

      {/* Panty — na strane podľa smeru otvárania, výrazné, s pevnou minimálnou veľkosťou. */}
      {[
        { y: vyskaKridla - PANT_OD_KRAJA_MM, label: `pánt ${PANT_OD_KRAJA_MM} mm od spodku` },
        { y: PANT_OD_KRAJA_MM, label: `pánt ${PANT_OD_KRAJA_MM} mm od vrchu` },
      ].map((p) => (
        <g key={p.label}>
          <rect x={pantyVlavo ? -hwSize*0.15 : sirkaKridla - hwSize*0.75} y={p.y-hwSize*0.55} width={hwSize*0.9} height={hwSize*1.1} rx={hwSize*0.12} fill="#8B8F93" stroke="#2A2A2A" strokeWidth={stroke*0.6} />
          <circle cx={pantyVlavo ? hwSize*0.3 : sirkaKridla - hwSize*0.3} cy={p.y} r={hwSize*0.13} fill="#2A2A2A" />
        </g>
      ))}

      {/* Kľučka — na opačnej bočnici ako panty, výška 1050 mm od spodku. */}
      {(() => {
        const y = vyskaKridla - KLUCKA_VYSKA_MM
        const plateW = hwSize*0.75, plateH = hwSize*1.9, handleLen = hwSize*1.3
        const plateX = pantyVlavo ? sirkaKridla-ram-plateW*0.4 : ram-plateW*0.6
        const handleX = pantyVlavo ? plateX - handleLen : plateX + plateW
        const knobX = pantyVlavo ? sirkaKridla-ram : ram
        return <g>
          <rect x={plateX} y={y-plateH/2} width={plateW} height={plateH} rx={hwSize*0.1} fill="#C9CCCE" stroke="#2A2A2A" strokeWidth={stroke*0.6} />
          <rect x={handleX} y={y-hwSize*0.13} width={handleLen} height={hwSize*0.26} rx={hwSize*0.08} fill="#8B8F93" stroke="#2A2A2A" strokeWidth={stroke*0.5} />
          <circle cx={knobX} cy={y} r={hwSize*0.11} fill="#2A2A2A" />
        </g>
      })()}

      {/* Technické kótovanie — celková šírka a výška (mimo obrysu bránky). */}
      <DimLineH y={-tick*2.6} x1={0} x2={sirkaKridla} label={`${sirkaKridla} mm`} fontSize={fontSize} tick={tick} stroke={stroke} />
      <DimLineV x={-tick*2.6} y1={0} y2={vyskaKridla} label={`${vyskaKridla} mm`} fontSize={fontSize} tick={tick} stroke={stroke} />
      {/* Kóta reznej dĺžky vodorovného profilu (vnútri, pod horným rámom). */}
      <DimLineH y={ram+tick*1.8} x1={ram} x2={sirkaKridla-ram} label={`rez ${sirkaKridla-2*ram} mm`} fontSize={cutFont} tick={tick*0.6} stroke={stroke*0.8} color="#2A2A2A" />
      {/* Kóta reznej dĺžky zvislej bočnice. */}
      <DimLineV x={ram+tick*1.8} y1={0} y2={vyskaKridla} label={`rez ${vyskaKridla} mm`} fontSize={cutFont} tick={tick*0.6} stroke={stroke*0.8} color="#2A2A2A" />

      {/* Oblúk otvorenia na 90° — os pántov podľa smeru otvárania, krídlo sa otvára smerom von od nej. */}
      <g>
        <path d={pantyVlavo
          ? `M ${0} ${vyskaKridla + tick*1.2} A ${sirkaKridla} ${sirkaKridla} 0 0 0 ${sirkaKridla} ${vyskaKridla + tick*1.2 - sirkaKridla}`
          : `M ${sirkaKridla} ${vyskaKridla + tick*1.2} A ${sirkaKridla} ${sirkaKridla} 0 0 1 ${0} ${vyskaKridla + tick*1.2 - sirkaKridla}`}
          fill="none" stroke="#9AA0A6" strokeWidth={stroke} strokeDasharray={`${fontSize*.4} ${fontSize*.35}`} />
        <line x1={0} y1={vyskaKridla+tick*1.2} x2={sirkaKridla} y2={vyskaKridla+tick*1.2} stroke="#9AA0A6" strokeWidth={stroke*0.7} strokeDasharray={`${fontSize*.4} ${fontSize*.35}`} />
        <text x={pantyVlavo ? sirkaKridla*0.62 : sirkaKridla*0.38} y={vyskaKridla+tick*1.2-sirkaKridla*0.32} fontSize={cutFont} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5B6166">otvorenie 90°</text>
        <DimLineH y={vyskaKridla+tick*3.4} x1={0} x2={sirkaKridla} label={`priestor ~${sirkaKridla} mm`} fontSize={cutFont} tick={tick*0.6} stroke={stroke*0.8} color="#5B6166" />
      </g>
    </g>
  </svg>
}

function DvojkridlovaPreview({ vstup, vysledok, kreslenie, onPridajPrekazku, onPresunPrekazku }: Props) {
  const wingW = vysledok.sirkaKridla, h = vysledok.vyskaKridla, ram = RAM_PROFIL_HRUBKA_MM
  const totalW = wingW * 2 + vstup.medzeraStred
  const povrch = najdiPovrch(vstup.povrch), fill = povrch.drevo ? "url(#drevoBig)" : povrch.farba
  const marginL = 300, marginT = 260, marginR = 300, marginB = clamp(totalW * 0.4, 380, 640)
  const vbW = totalW + marginL + marginR, vbH = h + marginT + marginB
  const scale = Math.max(totalW, h)
  const stroke = clamp(scale / 340, 2.2, 5), fontSize = clamp(scale / 26, 32, 58), cutFont = fontSize * 0.6
  const tick = fontSize * 0.9
  const innerW = Math.max(0, wingW - 2 * ram)
  const svgRef = useRef<SVGSVGElement>(null)
  const { bod1, zivyBod2, onPointerDown, onPointerMove, onPointerUp, onClick } = useKreslenieProekazky(svgRef, !!kreslenie, marginL, marginT, h, vstup.prekazky, onPridajPrekazku, onPresunPrekazku)
  // PRIECKA_VYSKA_OD_ZEME_MM je vzdialenosť OD ZEME po SPODNÚ hranu priečky.
  // V SVG rastie Y nadol (Y=0 je vrch, Y=h je zem) — treba prepočítať na súradnice zhora.
  const priackaSpodnaHranaY = h - PRIECKA_VYSKA_OD_ZEME_MM
  const priackaHornaHranaY = priackaSpodnaHranaY - ram
  const bottomCount = vysledok.lamelySpodnaCast?.pocet ?? 0, upperCount = vysledok.lamelyHornaCast?.pocet ?? 0
  const bottomGap = vysledok.lamelySpodnaCast?.skutocnaMedzera ?? 0, upperGap = vysledok.lamelyHornaCast?.skutocnaMedzera ?? 0
  const drawLamellas = (x: number, startY: number, count: number, gap: number, keyPrefix: string) =>
    Array.from({ length: count }, (_, i) => <rect key={`${keyPrefix}-${i}`} x={x + ram} y={startY + gap * (i + 1) + vstup.sirkaLamely * i} width={innerW} height={vstup.sirkaLamely} fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth={stroke * .5} />)

  const wing = (x: number, idx: number) => <g key={idx}>
    <rect x={x} y={0} width={wingW} height={h} fill="white" />
    {drawLamellas(x, priackaSpodnaHranaY, bottomCount, bottomGap, `b${idx}`)}
    {drawLamellas(x, ram, upperCount, upperGap, `u${idx}`)}
    <g fill={FARBA_RAM}>
      <rect x={x} width={ram} height={h} />
      <rect x={x + wingW - ram} width={ram} height={h} />
      <rect x={x + ram} width={innerW} height={ram} />
      <rect x={x + ram} y={h - ram} width={innerW} height={ram} />
      <rect x={x + ram} y={priackaHornaHranaY} width={innerW} height={ram} />
    </g>
    {/* Rezné značky — zvislé bočnice v plnej výške, vodorovné (horný rám, dolný rám, priečka) vsadené medzi ne. */}
    <g stroke={CUT_COLOR} strokeWidth={stroke * 1.2} strokeDasharray={`${fontSize * .32} ${fontSize * .32}`}>
      <line x1={x} y1={ram} x2={x + wingW} y2={ram} />
      <line x1={x} y1={h - ram} x2={x + wingW} y2={h - ram} />
      <line x1={x} y1={priackaHornaHranaY} x2={x + wingW} y2={priackaHornaHranaY} />
      <line x1={x} y1={priackaSpodnaHranaY} x2={x + wingW} y2={priackaSpodnaHranaY} />
      <line x1={x + ram} y1={0} x2={x + ram} y2={h} />
      <line x1={x + wingW - ram} y1={0} x2={x + wingW - ram} y2={h} />
    </g>
  </g>

  return <svg viewBox={`0 0 ${vbW} ${vbH}`} className={"h-auto w-full" + (kreslenie ? " cursor-crosshair touch-none" : "")} role="img" aria-label={`Náhľad dvojkrídlovej brány ${totalW} × ${h} mm`}
    ref={svgRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={onClick}>
    <defs><DimArrowDefs /><linearGradient id="drevoBig" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={povrch.farba} /><stop offset="45%" stopColor="rgba(255,255,255,0.18)" /><stop offset="55%" stopColor={povrch.farba} /><stop offset="100%" stopColor="rgba(0,0,0,0.22)" /></linearGradient></defs>
    <g transform={`translate(${marginL} ${marginT})`}>
      <PrekazkyLayer prekazky={vstup.prekazky} vyskaKridla={h} />
      {bod1 && zivyBod2 && <ZivaCiaraNahlad bod1={bod1} bod2={zivyBod2} fontSize={cutFont} stroke={stroke} />}
      {wing(0, 0)}{wing(wingW + vstup.medzeraStred, 1)}
      {/* Medzera v strede (styk dvoch krídel v strede brány) — dve čiary s medzerou namiesto jednej. */}
      <line x1={wingW} y1={0} x2={wingW} y2={h} stroke="rgba(0,0,0,.35)" strokeWidth={stroke} />
      <line x1={wingW + vstup.medzeraStred} y1={0} x2={wingW + vstup.medzeraStred} y2={h} stroke="rgba(0,0,0,.35)" strokeWidth={stroke} />

      {/* Technické kótovanie — celkový rozmer a rozmer jedného krídla. */}
      <DimLineH y={-tick * 2.6} x1={0} x2={totalW} label={`${Math.round(totalW)} mm celkom — 2 × ${Math.round(wingW)} mm`} fontSize={fontSize} tick={tick} stroke={stroke} />
      <DimLineV x={-tick * 2.6} y1={0} y2={h} label={`${h} mm`} fontSize={fontSize} tick={tick} stroke={stroke} />

      {/* Rezné kóty — bočnica (zvislý profil) a horný/dolný rám + priečka (vodorovný rez), na ľavom krídle. */}
      <DimLineV x={ram + tick * 1.6} y1={0} y2={h} label={`rez bočnica ${h} mm`} fontSize={cutFont} tick={tick * 0.55} stroke={stroke * 0.75} color="#2A2A2A" />
      <DimLineH y={ram + tick * 1.6} x1={ram} x2={wingW - ram} label={`rez rám/priečka ${innerW} mm`} fontSize={cutFont} tick={tick * 0.55} stroke={stroke * 0.75} color="#2A2A2A" />
      <DimLineH y={priackaSpodnaHranaY + tick * 1.6} x1={ram} x2={wingW - ram} label={`priečka ${PRIECKA_VYSKA_OD_ZEME_MM} mm od zeme`} fontSize={cutFont * 0.85} tick={tick * 0.5} stroke={stroke * 0.7} color="#2A2A2A" />

      <text x={totalW / 2} y={h + fontSize * 1.4} fontSize={fontSize * .6} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#2A2A2A">2 samostatné krídla • horizontálne lamely • medzera v strede {vstup.medzeraStred} mm • otvára sa {vstup.smerVykyvu === "dnu" ? "DNU (na pozemok)" : "VON (na ulicu/vjazd)"}</text>

      {/* Oblúky otvorenia na 90° pre obe krídla — ľavé krídlo panty vľavo (otvára sa dovnútra doľava),
          pravé krídlo panty vpravo (otvára sa dovnútra doprava) — kĺb pravého krídla je pri jeho vnútornom okraji.
          Pohľad spredu neukáže skutočnú hĺbku (dnu/von) — smer je preto vypísaný textom pri oblúku. */}
      <g>
        <path d={`M 0 ${h + tick * 1.1} A ${wingW} ${wingW} 0 0 0 ${wingW} ${h + tick * 1.1 - wingW}`}
          fill="none" stroke="#9AA0A6" strokeWidth={stroke} strokeDasharray={`${fontSize * .35} ${fontSize * .3}`} />
        <path d={`M ${totalW} ${h + tick * 1.1} A ${wingW} ${wingW} 0 0 1 ${wingW + vstup.medzeraStred} ${h + tick * 1.1 - wingW}`}
          fill="none" stroke="#9AA0A6" strokeWidth={stroke} strokeDasharray={`${fontSize * .35} ${fontSize * .3}`} />
        <line x1={0} y1={h + tick * 1.1} x2={totalW} y2={h + tick * 1.1} stroke="#9AA0A6" strokeWidth={stroke * 0.7} strokeDasharray={`${fontSize * .35} ${fontSize * .3}`} />
        <text x={wingW * 0.55} y={h + tick * 1.1 - wingW * 0.28} fontSize={cutFont} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5B6166">90° {vstup.smerVykyvu === "dnu" ? "dnu" : "von"}</text>
        <text x={totalW - wingW * 0.55} y={h + tick * 1.1 - wingW * 0.28} fontSize={cutFont} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5B6166">90° {vstup.smerVykyvu === "dnu" ? "dnu" : "von"}</text>
        <DimLineH y={h + wingW + tick * 1.9} x1={0} x2={wingW} label={`priestor ~${Math.round(wingW)} mm`} fontSize={cutFont} tick={tick * 0.6} stroke={stroke * 0.8} color="#5B6166" />
        <DimLineH y={h + wingW + tick * 1.9} x1={wingW + vstup.medzeraStred} x2={totalW} label={`priestor ~${Math.round(wingW)} mm`} fontSize={cutFont} tick={tick * 0.6} stroke={stroke * 0.8} color="#5B6166" />
      </g>
    </g>
  </svg>
}

function PosuvnaPreview({ vstup, vysledok, kreslenie, onPridajPrekazku, onPresunPrekazku }: Props) {
  const sirkaKridla = vysledok.sirkaKridla, vyskaKridla = vysledok.vyskaKridla
  const { sirkaLamely } = vstup
  const povrch = najdiPovrch(vstup.povrch)
  const fill = povrch.drevo ? "url(#drevoPosuv)" : povrch.farba
  const ram = RAM_PROFIL_HRUBKA_MM
  const innerX = ram, innerY = ram, innerW = Math.max(0, sirkaKridla - 2 * ram)
  // Krídlo sa posúva na stranu podľa vstup.stranaPosunu — šípka smeruje tým smerom.
  const doprava = vstup.stranaPosunu !== "vlavo"
  const scale = Math.max(sirkaKridla, vyskaKridla)
  const fontSize = clamp(scale / 26, 32, 58)
  const cutFont = fontSize * 0.62
  const stroke = clamp(scale / 340, 2.2, 5)
  const tick = fontSize * 0.9
  // Priestor na zasunutie sa kreslí na strane posunu, mimo obrysu krídla — margin je preto väčší na tej strane.
  const marginSide = Math.max(340, sirkaKridla * 0.55)
  const marginL = doprava ? 300 : marginSide, marginR = doprava ? marginSide : 300
  const marginT = 260, marginB = 320
  const vbW = sirkaKridla + marginL + marginR, vbH = vyskaKridla + marginT + marginB
  const lamely: number[] = []
  for (let i = 0; i < vysledok.pocetLamiel; i++) lamely.push(innerY + vysledok.skutocnaMedzera * (i + 1) + sirkaLamely * i)
  const svgRef = useRef<SVGSVGElement>(null)
  const { bod1, zivyBod2, onPointerDown, onPointerMove, onPointerUp, onClick } = useKreslenieProekazky(svgRef, !!kreslenie, marginL, marginT, vyskaKridla, vstup.prekazky, onPridajPrekazku, onPresunPrekazku)

  // Priestor na zasunutie — na strane posunu, od okraja krídla.
  const zasunX1 = doprava ? sirkaKridla : -sirkaKridla
  const zasunX2 = doprava ? sirkaKridla * 2 : 0
  const arrowX1 = doprava ? sirkaKridla + tick : -tick
  const arrowX2 = doprava ? sirkaKridla * 1.6 : -sirkaKridla * 0.6

  return <svg viewBox={`0 0 ${vbW} ${vbH}`} className={"h-auto w-full" + (kreslenie ? " cursor-crosshair touch-none" : "")} role="img" aria-label={`Náhľad posúvnej brány ${sirkaKridla} × ${vyskaKridla} mm`}
    ref={svgRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={onClick}>
    <defs><DimArrowDefs /><linearGradient id="drevoPosuv" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={povrch.farba}/><stop offset="45%" stopColor="rgba(255,255,255,0.18)"/><stop offset="55%" stopColor={povrch.farba}/><stop offset="100%" stopColor="rgba(0,0,0,0.22)"/></linearGradient></defs>
    <g transform={`translate(${marginL} ${marginT})`}>
      <PrekazkyLayer prekazky={vstup.prekazky} vyskaKridla={vyskaKridla} />
      {bod1 && zivyBod2 && <ZivaCiaraNahlad bod1={bod1} bod2={zivyBod2} fontSize={cutFont} stroke={stroke} />}
      <rect width={sirkaKridla} height={vyskaKridla} fill="white" />
      {lamely.map((pos, i) => <rect key={i} x={innerX} y={pos} width={innerW} height={sirkaLamely} fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth={stroke*.5}/>)}
      <g fill={FARBA_RAM}><rect width={ram} height={vyskaKridla}/><rect x={sirkaKridla-ram} width={ram} height={vyskaKridla}/><rect x={ram} width={sirkaKridla-2*ram} height={ram}/><rect x={ram} y={vyskaKridla-ram} width={sirkaKridla-2*ram} height={ram}/></g>
      {/* Rezné značky. */}
      <g stroke={CUT_COLOR} strokeWidth={stroke*1.3} strokeDasharray={`${fontSize*.35} ${fontSize*.35}`}>
        <line x1={0} y1={ram} x2={sirkaKridla} y2={ram} />
        <line x1={0} y1={vyskaKridla-ram} x2={sirkaKridla} y2={vyskaKridla-ram} />
        <line x1={ram} y1={0} x2={ram} y2={vyskaKridla} />
        <line x1={sirkaKridla-ram} y1={0} x2={sirkaKridla-ram} y2={vyskaKridla} />
      </g>

      {/* Technické kótovanie — celková šírka a výška krídla. */}
      <DimLineH y={-tick*2.6} x1={0} x2={sirkaKridla} label={`${sirkaKridla} mm (vrátane presahu)`} fontSize={fontSize} tick={tick} stroke={stroke} />
      <DimLineV x={-tick*2.6} y1={0} y2={vyskaKridla} label={`${vyskaKridla} mm`} fontSize={fontSize} tick={tick} stroke={stroke} />
      <DimLineH y={ram+tick*1.8} x1={ram} x2={sirkaKridla-ram} label={`rez ${sirkaKridla-2*ram} mm`} fontSize={cutFont} tick={tick*0.6} stroke={stroke*0.8} color="#2A2A2A" />
      <DimLineV x={ram+tick*1.8} y1={0} y2={vyskaKridla} label={`rez ${vyskaKridla} mm`} fontSize={cutFont} tick={tick*0.6} stroke={stroke*0.8} color="#2A2A2A" />

      {/* Priestor na zasunutie — obdĺžnik + šípka smerom na stranu posunu, namiesto oblúka otvorenia. */}
      <g>
        <rect x={zasunX1} y={0} width={sirkaKridla} height={vyskaKridla} fill="none" stroke="#9AA0A6" strokeWidth={stroke} strokeDasharray={`${fontSize*.4} ${fontSize*.35}`} />
        <line x1={arrowX1} y1={vyskaKridla/2} x2={arrowX2} y2={vyskaKridla/2} stroke="#5B6166" strokeWidth={stroke*1.4} markerEnd="url(#arrowEndGray)" />
        <text x={(zasunX1+zasunX2)/2} y={vyskaKridla/2 - tick*0.8} fontSize={cutFont} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5B6166">priestor na zasunutie</text>
        <DimLineH y={vyskaKridla+tick*1.6} x1={zasunX1} x2={zasunX2} label={`~${sirkaKridla} mm voľno na ${doprava ? "pravej" : "ľavej"} strane`} fontSize={cutFont} tick={tick*0.6} stroke={stroke*0.8} color="#5B6166" />
      </g>
    </g>
  </svg>
}
