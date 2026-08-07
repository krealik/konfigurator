"use client"

import { useRef, useState } from "react"
import { RAM_PROFIL_HRUBKA_MM, PRIECKA_VYSKA_OD_ZEME_MM, FARBA_RAM, najdiPovrch, KLUCKA_VYSKA_MM, PANT_OD_KRAJA_MM, type Prekazka } from "@/lib/gate-config"
import type { GateInput, GateResult } from "@/lib/gate-calc"

interface PolozkaVypocitana {
  id: string
  vstup: GateInput
  vysledok: GateResult
}

interface Props {
  polozky: PolozkaVypocitana[]
  prekazky: Prekazka[]
  kreslenie: boolean
  onPridajPrekazku?: (p: Prekazka, screenPos: { x: number; y: number }) => void
  aktivnaId: string
  onKlikPolozku?: (id: string) => void
}

const CUT_COLOR = "#E63946"
const MEDZERA_MEDZI_PRODUKTMI = 400 // mm medzera medzi produktmi v scéne

function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)) }

function DimLineH({ y, x1, x2, label, fontSize, tick, stroke, color = "#383E42" }:
  { y: number; x1: number; x2: number; label: string; fontSize: number; tick: number; stroke: number; color?: string }) {
  return <g stroke={color} strokeWidth={stroke} fill={color}>
    <line x1={x1} y1={y - tick * 0.5} x2={x1} y2={y + tick * 0.5} />
    <line x1={x2} y1={y - tick * 0.5} x2={x2} y2={y + tick * 0.5} />
    <line x1={x1} y1={y} x2={x2} y2={y} markerEnd="url(#scArrowEnd)" markerStart="url(#scArrowStart)" />
    <text x={(x1 + x2) / 2} y={y - tick * 0.6} fontSize={fontSize} textAnchor="middle" fontWeight={700} stroke="none" fontFamily="monospace">{label}</text>
  </g>
}

function DimLineV({ x, y1, y2, label, fontSize, tick, stroke, color = "#383E42" }:
  { x: number; y1: number; y2: number; label: string; fontSize: number; tick: number; stroke: number; color?: string }) {
  return <g stroke={color} strokeWidth={stroke} fill={color}>
    <line x1={x - tick * 0.5} y1={y1} x2={x + tick * 0.5} y2={y1} />
    <line x1={x - tick * 0.5} y1={y2} x2={x + tick * 0.5} y2={y2} />
    <line x1={x} y1={y1} x2={x} y2={y2} markerEnd="url(#scArrowEnd)" markerStart="url(#scArrowStart)" />
    <text x={x - tick * 0.6} y={(y1 + y2) / 2} fontSize={fontSize} textAnchor="middle" fontWeight={700} stroke="none" fontFamily="monospace" transform={`rotate(-90 ${x - tick * 0.6} ${(y1 + y2) / 2})`}>{label}</text>
  </g>
}

/** Vykreslí jednu bránku (jednokrídlovú) v kontexte scény na pozícii offsetX */
function BrankaVScene({ vstup, vysledok, offsetX, maxH, stroke, fontSize, aktivna }: {
  vstup: GateInput; vysledok: GateResult; offsetX: number; maxH: number; stroke: number; fontSize: number; aktivna: boolean
}) {
  const sirkaKridla = vysledok.sirkaKridla, vyskaKridla = vysledok.vyskaKridla
  const { sirkaLamely } = vstup
  const povrch = najdiPovrch(vstup.povrch)
  const ram = RAM_PROFIL_HRUBKA_MM
  const innerX = ram, innerY = ram, innerW = Math.max(0, sirkaKridla - 2 * ram), innerH = Math.max(0, vyskaKridla - 2 * ram)
  const vert = vstup.orientacia === "vertikalne"
  const pantyVlavo = vstup.smerOtvarania !== "vpravo"
  const fill = povrch.drevo ? `url(#scDrevo${offsetX})` : povrch.farba
  const tick = fontSize * 0.9
  const cutFont = fontSize * 0.6
  // Spodný offset — produkty sú zarovnané od zdola
  const yOff = maxH - vyskaKridla

  const lamely: number[] = []
  const start = vert ? innerX : innerY
  for (let i = 0; i < vysledok.pocetLamiel; i++) lamely.push(start + vysledok.skutocnaMedzera * (i + 1) + sirkaLamely * i)

  return <g transform={`translate(${offsetX} ${yOff})`}>
    <defs>
      <linearGradient id={`scDrevo${offsetX}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={povrch.farba} />
        <stop offset="45%" stopColor="rgba(255,255,255,0.18)" />
        <stop offset="55%" stopColor={povrch.farba} />
        <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
      </linearGradient>
    </defs>
    {/* Zvýraznenie aktívnej položky */}
    {aktivna && <rect x={-8} y={-8} width={sirkaKridla + 16} height={vyskaKridla + 16} fill="none" stroke="var(--color-primary)" strokeWidth={stroke * 2} strokeDasharray={`${fontSize * 0.4} ${fontSize * 0.3}`} rx={4} />}
    <rect width={sirkaKridla} height={vyskaKridla} fill="white" />
    {lamely.map((pos, i) => <rect key={i} x={vert ? pos : innerX} y={vert ? innerY : pos} width={vert ? sirkaLamely : innerW} height={vert ? innerH : sirkaLamely} fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth={stroke * .5} />)}
    <g fill={FARBA_RAM}>
      <rect width={ram} height={vyskaKridla} />
      <rect x={sirkaKridla - ram} width={ram} height={vyskaKridla} />
      <rect x={ram} width={sirkaKridla - 2 * ram} height={ram} />
      <rect x={ram} y={vyskaKridla - ram} width={sirkaKridla - 2 * ram} height={ram} />
    </g>
    {/* Pántová strana */}
    {[vyskaKridla - PANT_OD_KRAJA_MM, PANT_OD_KRAJA_MM].map((py, i) => {
      const hwSize = clamp(Math.max(sirkaKridla, vyskaKridla) * 0.045, 40, 70)
      return <g key={i}>
        <rect x={pantyVlavo ? -hwSize * 0.15 : sirkaKridla - hwSize * 0.75} y={py - hwSize * 0.55} width={hwSize * 0.9} height={hwSize * 1.1} rx={hwSize * 0.12} fill="#8B8F93" stroke="#2A2A2A" strokeWidth={stroke * 0.6} />
      </g>
    })}
    {/* Kóta šírky */}
    <DimLineH y={-tick * 2} x1={0} x2={sirkaKridla} label={`${sirkaKridla} mm`} fontSize={fontSize * 0.75} tick={tick * 0.7} stroke={stroke} />
    {/* Kóta výšky */}
    <DimLineV x={sirkaKridla + tick * 1.8} y1={0} y2={vyskaKridla} label={`${vyskaKridla} mm`} fontSize={fontSize * 0.75} tick={tick * 0.7} stroke={stroke} />
    {/* Popis */}
    <text x={sirkaKridla / 2} y={vyskaKridla + fontSize * 1.1} fontSize={fontSize * 0.65} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#2A2A2A">Bránka</text>
  </g>
}

/** Vykreslí dvojkrídlovú bránu v scéne */
function DvojkridlovaVScene({ vstup, vysledok, offsetX, maxH, stroke, fontSize, aktivna }: {
  vstup: GateInput; vysledok: GateResult; offsetX: number; maxH: number; stroke: number; fontSize: number; aktivna: boolean
}) {
  const wingW = vysledok.sirkaKridla, h = vysledok.vyskaKridla, ram = RAM_PROFIL_HRUBKA_MM
  const totalW = wingW * 2 + vstup.medzeraStred
  const povrch = najdiPovrch(vstup.povrch), fill = povrch.drevo ? `url(#scDrevoBig${offsetX})` : povrch.farba
  const tick = fontSize * 0.9
  const innerW = Math.max(0, wingW - 2 * ram)
  const priackaSpodnaHranaY = h - PRIECKA_VYSKA_OD_ZEME_MM
  const priackaHornaHranaY = priackaSpodnaHranaY - ram
  const bottomCount = vysledok.lamelySpodnaCast?.pocet ?? 0, upperCount = vysledok.lamelyHornaCast?.pocet ?? 0
  const bottomGap = vysledok.lamelySpodnaCast?.skutocnaMedzera ?? 0, upperGap = vysledok.lamelyHornaCast?.skutocnaMedzera ?? 0
  const yOff = maxH - h

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
  </g>

  return <g transform={`translate(${offsetX} ${yOff})`}>
    <defs>
      <linearGradient id={`scDrevoBig${offsetX}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={povrch.farba} />
        <stop offset="45%" stopColor="rgba(255,255,255,0.18)" />
        <stop offset="55%" stopColor={povrch.farba} />
        <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
      </linearGradient>
    </defs>
    {aktivna && <rect x={-8} y={-8} width={totalW + 16} height={h + 16} fill="none" stroke="var(--color-primary)" strokeWidth={stroke * 2} strokeDasharray={`${fontSize * 0.4} ${fontSize * 0.3}`} rx={4} />}
    {wing(0, 0)}{wing(wingW + vstup.medzeraStred, 1)}
    <line x1={wingW} y1={0} x2={wingW} y2={h} stroke="rgba(0,0,0,.35)" strokeWidth={stroke} />
    <line x1={wingW + vstup.medzeraStred} y1={0} x2={wingW + vstup.medzeraStred} y2={h} stroke="rgba(0,0,0,.35)" strokeWidth={stroke} />
    <DimLineH y={-tick * 2} x1={0} x2={totalW} label={`${Math.round(totalW)} mm (2×${Math.round(wingW)} mm)`} fontSize={fontSize * 0.75} tick={tick * 0.7} stroke={stroke} />
    <DimLineV x={totalW + tick * 1.8} y1={0} y2={h} label={`${h} mm`} fontSize={fontSize * 0.75} tick={tick * 0.7} stroke={stroke} />
    <text x={totalW / 2} y={h + fontSize * 1.1} fontSize={fontSize * 0.65} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#2A2A2A">Dvojkrídlová brána</text>
  </g>
}

/** Vykreslí posúvnu bránu v scéne */
function PosuvnaVScene({ vstup, vysledok, offsetX, maxH, stroke, fontSize, aktivna }: {
  vstup: GateInput; vysledok: GateResult; offsetX: number; maxH: number; stroke: number; fontSize: number; aktivna: boolean
}) {
  const sirkaKridla = vysledok.sirkaKridla, vyskaKridla = vysledok.vyskaKridla
  const { sirkaLamely } = vstup
  const povrch = najdiPovrch(vstup.povrch)
  const fill = povrch.drevo ? `url(#scDrevoPos${offsetX})` : povrch.farba
  const ram = RAM_PROFIL_HRUBKA_MM
  const innerX = ram, innerY = ram, innerW = Math.max(0, sirkaKridla - 2 * ram)
  const tick = fontSize * 0.9
  const yOff = maxH - vyskaKridla
  const lamely: number[] = []
  for (let i = 0; i < vysledok.pocetLamiel; i++) lamely.push(innerY + vysledok.skutocnaMedzera * (i + 1) + sirkaLamely * i)

  return <g transform={`translate(${offsetX} ${yOff})`}>
    <defs>
      <linearGradient id={`scDrevoPos${offsetX}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={povrch.farba} />
        <stop offset="45%" stopColor="rgba(255,255,255,0.18)" />
        <stop offset="55%" stopColor={povrch.farba} />
        <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
      </linearGradient>
    </defs>
    {aktivna && <rect x={-8} y={-8} width={sirkaKridla + 16} height={vyskaKridla + 16} fill="none" stroke="var(--color-primary)" strokeWidth={stroke * 2} strokeDasharray={`${fontSize * 0.4} ${fontSize * 0.3}`} rx={4} />}
    <rect width={sirkaKridla} height={vyskaKridla} fill="white" />
    {lamely.map((pos, i) => <rect key={i} x={innerX} y={pos} width={innerW} height={sirkaLamely} fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth={stroke * .5} />)}
    <g fill={FARBA_RAM}>
      <rect width={ram} height={vyskaKridla} />
      <rect x={sirkaKridla - ram} width={ram} height={vyskaKridla} />
      <rect x={ram} width={sirkaKridla - 2 * ram} height={ram} />
      <rect x={ram} y={vyskaKridla - ram} width={sirkaKridla - 2 * ram} height={ram} />
    </g>
    <DimLineH y={-tick * 2} x1={0} x2={sirkaKridla} label={`${sirkaKridla} mm`} fontSize={fontSize * 0.75} tick={tick * 0.7} stroke={stroke} />
    <DimLineV x={sirkaKridla + tick * 1.8} y1={0} y2={vyskaKridla} label={`${vyskaKridla} mm`} fontSize={fontSize * 0.75} tick={tick * 0.7} stroke={stroke} />
    <text x={sirkaKridla / 2} y={vyskaKridla + fontSize * 1.1} fontSize={fontSize * 0.65} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#2A2A2A">Posúvna brána</text>
  </g>
}

function PrekazkyLayer({ prekazky, maxH, fontSize, stroke }: { prekazky: Prekazka[]; maxH: number; fontSize: number; stroke: number }) {
  if (!prekazky || prekazky.length === 0) return null
  return <g>
    {prekazky.map((p) => {
      if (p.typ === "ciara") {
        const x = p.poziciaOdKraja + p.sirka / 2
        const y1 = maxH - p.vyskaDo
        const y2 = maxH - p.vyskaOd
        return <g key={p.id}>
          <line x1={x} y1={y1} x2={x} y2={y2} stroke="#5B6166" strokeWidth={Math.max(p.sirka, stroke * 2)} />
          <text x={x} y={y1 - fontSize * 0.4} fontSize={fontSize * 0.8} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5B6166">{p.nazov}</text>
        </g>
      }
      const y = maxH - p.vyskaDo
      const h = Math.max(0, p.vyskaDo - p.vyskaOd)
      if (p.typ === "existujuci-stlp") {
        return <g key={p.id}>
          <rect x={p.poziciaOdKraja} y={y} width={p.sirka} height={h} fill="#8B5E34" stroke="#5C3A1E" strokeWidth={stroke} />
          <text x={p.poziciaOdKraja + p.sirka / 2} y={y - fontSize * 0.4} fontSize={fontSize * 0.8} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5C3A1E">{p.nazov}</text>
        </g>
      }
      return <g key={p.id}>
        <rect x={p.poziciaOdKraja} y={y} width={p.sirka} height={h} fill="rgba(91,97,102,0.2)" stroke="#5B6166" strokeWidth={stroke} strokeDasharray="10 7" />
        <text x={p.poziciaOdKraja + p.sirka / 2} y={y - fontSize * 0.4} fontSize={fontSize * 0.8} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#5B6166">{p.nazov}</text>
      </g>
    })}
  </g>
}

function bodDoMm(svg: SVGSVGElement, clientX: number, clientY: number, marginL: number, marginT: number) {
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const pt = svg.createSVGPoint()
  pt.x = clientX; pt.y = clientY
  const p = pt.matrixTransform(ctm.inverse())
  return { x: p.x - marginL, y: p.y - marginT }
}

export function ScenaPreview({ polozky, prekazky, kreslenie, onPridajPrekazku, aktivnaId, onKlikPolozku }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [kreslimRect, setKreslimRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [nastrojTyp] = useState<"obdlznik" | "ciara">("obdlznik")

  // Rozmiestnenie produktov vedľa seba — každý má svoju šírku a začína za predchádzajúcim
  const pozicie: { id: string; offsetX: number; sirkaObjektu: number }[] = []
  let currentX = 0
  for (const pol of polozky) {
    const jeD = pol.vstup.typProduktu === "dvojkridlovaBrana"
    const sirkaObjektu = jeD ? pol.vysledok.sirkaKridla * 2 + pol.vstup.medzeraStred : pol.vysledok.sirkaKridla
    pozicie.push({ id: pol.id, offsetX: currentX, sirkaObjektu })
    currentX += sirkaObjektu + MEDZERA_MEDZI_PRODUKTMI
  }

  const totalSceneW = currentX - (polozky.length > 0 ? MEDZERA_MEDZI_PRODUKTMI : 0)
  const maxH = Math.max(...polozky.map((p) => p.vysledok.vyskaKridla), 1000)

  const scale = Math.max(totalSceneW, maxH, 1)
  const fontSize = clamp(scale / 26, 28, 52)
  const stroke = clamp(scale / 340, 2, 5)
  const tick = fontSize * 0.9

  const marginL = 300, marginT = 240, marginR = 300, marginB = 200 + fontSize * 2
  const vbW = totalSceneW + marginL + marginR
  const vbH = maxH + marginT + marginB

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!kreslenie || !svgRef.current) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    const { x, y } = bodDoMm(svgRef.current, e.clientX, e.clientY, marginL, marginT)
    setKreslimRect({ x, y, w: 0, h: 0 })
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!kreslenie || !kreslimRect || !svgRef.current) return
    const { x, y } = bodDoMm(svgRef.current, e.clientX, e.clientY, marginL, marginT)
    setKreslimRect((k) => k ? { ...k, w: x - k.x, h: y - k.y } : k)
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (!kreslenie) return
    if (kreslimRect && onPridajPrekazku) {
      const absW = Math.abs(kreslimRect.w), absH = Math.abs(kreslimRect.h)
      // Čiara: úzky ťah (w << h) alebo kliknutie bez pohybu
      const jeUzky = absW < 40 && absH > 20
      if (absW > 5 || absH > 5) {
        const poziciaOdKraja = Math.round(Math.min(kreslimRect.x, kreslimRect.x + kreslimRect.w))
        const sirka = Math.round(jeUzky ? Math.max(absW, 20) : absW)
        const yTop = Math.min(kreslimRect.y, kreslimRect.y + kreslimRect.h)
        const yBottom = Math.max(kreslimRect.y, kreslimRect.y + kreslimRect.h)
        const vyskaOd = Math.round(Math.max(0, maxH - yBottom))
        const vyskaDo = Math.round(Math.max(0, maxH - yTop))
        const typ = jeUzky ? "ciara" as const : "obdlznik" as const
        onPridajPrekazku(
          { id: `p${Date.now()}${Math.round(Math.random() * 1000)}`, nazov: jeUzky ? "Stena" : "Prekážka", typ, poziciaOdKraja, sirka, vyskaOd, vyskaDo },
          { x: e.clientX, y: e.clientY },
        )
      }
    }
    setKreslimRect(null)
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onKlikPolozku || kreslenie) return
    // Zisti na ktorú položku sa kliklo
    const svg = svgRef.current
    if (!svg) return
    const { x, y } = bodDoMm(svg, e.clientX, e.clientY, marginL, marginT)
    for (const poz of pozicie) {
      const pol = polozky.find((p) => p.id === poz.id)
      if (!pol) continue
      const yOff = maxH - pol.vysledok.vyskaKridla
      if (x >= poz.offsetX - 20 && x <= poz.offsetX + poz.sirkaObjektu + 20 && y >= yOff - 20 && y <= maxH + 20) {
        onKlikPolozku(poz.id)
        break
      }
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${vbW} ${vbH}`}
      className={"h-auto w-full" + (kreslenie ? " cursor-crosshair touch-none" : " cursor-pointer")}
      role="img"
      aria-label="Náhľad scény s viacerými produktmi"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleClick}
    >
      <defs>
        <marker id="scArrowStart" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M6,0 L0,3 L6,6" fill="none" stroke="#383E42" strokeWidth="1.4" /></marker>
        <marker id="scArrowEnd" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto"><path d="M2,0 L8,3 L2,6" fill="none" stroke="#383E42" strokeWidth="1.4" /></marker>
      </defs>
      <g transform={`translate(${marginL} ${marginT})`}>
        {/* Zemná čiara */}
        <line x1={-marginL * 0.5} y1={maxH} x2={totalSceneW + marginR * 0.5} y2={maxH} stroke="#ccc" strokeWidth={stroke} />

        {/* Prekážky — spoločné pre celú scénu */}
        <PrekazkyLayer prekazky={prekazky} maxH={maxH} fontSize={fontSize} stroke={stroke} />

        {/* Každý produkt na svojej pozícii */}
        {polozky.map((pol, idx) => {
          const poz = pozicie[idx]
          const aktivna = pol.id === aktivnaId
          if (pol.vstup.typProduktu === "dvojkridlovaBrana") {
            return <DvojkridlovaVScene key={pol.id} vstup={pol.vstup} vysledok={pol.vysledok} offsetX={poz.offsetX} maxH={maxH} stroke={stroke} fontSize={fontSize} aktivna={aktivna} />
          }
          if (pol.vstup.typProduktu === "posuvnaBrana") {
            return <PosuvnaVScene key={pol.id} vstup={pol.vstup} vysledok={pol.vysledok} offsetX={poz.offsetX} maxH={maxH} stroke={stroke} fontSize={fontSize} aktivna={aktivna} />
          }
          return <BrankaVScene key={pol.id} vstup={pol.vstup} vysledok={pol.vysledok} offsetX={poz.offsetX} maxH={maxH} stroke={stroke} fontSize={fontSize} aktivna={aktivna} />
        })}

        {/* Kresliaci obdĺžnik */}
        {kreslimRect && (
          <rect
            x={Math.min(kreslimRect.x, kreslimRect.x + kreslimRect.w)}
            y={Math.min(kreslimRect.y, kreslimRect.y + kreslimRect.h)}
            width={Math.abs(kreslimRect.w)}
            height={Math.abs(kreslimRect.h)}
            fill="rgba(56,62,66,0.15)"
            stroke="#383E42"
            strokeWidth={4}
            strokeDasharray="14 10"
          />
        )}

        {/* Legenda "klikni na produkt" keď nie je kreslenie */}
        {!kreslenie && polozky.length > 1 && (
          <text x={totalSceneW / 2} y={maxH + fontSize * 1.8} fontSize={fontSize * 0.6} textAnchor="middle" fontFamily="monospace" fill="#9AA0A6">
            Klikni na produkt pre jeho detail
          </text>
        )}
      </g>
    </svg>
  )
}
