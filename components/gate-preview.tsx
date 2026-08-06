"use client"

import { RAM_PROFIL_HRUBKA_MM, PRIECKA_VYSKA_OD_ZEME_MM, FARBA_RAM, najdiPovrch, KLUCKA_VYSKA_MM, PANT_OD_KRAJA_MM } from "@/lib/gate-config"
import type { GateInput, GateResult } from "@/lib/gate-calc"

const CUT_COLOR = "#E63946"
interface Props { vstup: GateInput; vysledok: GateResult }

export function GatePreview({ vstup, vysledok }: Props) {
  return vstup.typProduktu === "dvojkridlovaBrana"
    ? <DvojkridlovaPreview vstup={vstup} vysledok={vysledok} />
    : <BrankaPreview vstup={vstup} vysledok={vysledok} />
}

function BrankaPreview({ vstup, vysledok }: Props) {
  const { sirkaKridla, vyskaKridla, sirkaLamely } = vstup
  const povrch = najdiPovrch(vstup.povrch)
  const ram = RAM_PROFIL_HRUBKA_MM
  const innerX = ram, innerY = ram, innerW = Math.max(0, sirkaKridla - 2 * ram), innerH = Math.max(0, vyskaKridla - 2 * ram)
  const vert = vstup.orientacia === "vertikalne"
  const margin = 380, vbW = sirkaKridla + margin * 2, vbH = vyskaKridla + margin * 2
  const stroke = Math.max(vbW, vbH) / 320, fontSize = Math.max(vbW, vbH) / 26, tick = fontSize * .9, cutFont = fontSize * .62
  const lamely: number[] = []
  const start = vert ? innerX : innerY
  for (let i = 0; i < vysledok.pocetLamiel; i++) lamely.push(start + vysledok.skutocnaMedzera * (i + 1) + sirkaLamely * i)
  const fill = povrch.drevo ? "url(#drevo)" : povrch.farba
  return <svg viewBox={`0 0 ${vbW} ${vbH}`} className="h-auto w-full" role="img" aria-label={`Náhľad bránky ${sirkaKridla} × ${vyskaKridla} mm`}>
    <defs><linearGradient id="drevo" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={povrch.farba}/><stop offset="45%" stopColor="rgba(255,255,255,0.18)"/><stop offset="55%" stopColor={povrch.farba}/><stop offset="100%" stopColor="rgba(0,0,0,0.22)"/></linearGradient></defs>
    <g transform={`translate(${margin} ${margin})`}>
      <rect width={sirkaKridla} height={vyskaKridla} fill="white" />
      {lamely.map((pos, i) => <rect key={i} x={vert ? pos : innerX} y={vert ? innerY : pos} width={vert ? sirkaLamely : innerW} height={vert ? innerH : sirkaLamely} fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth={stroke*.5}/>) }
      <g fill={FARBA_RAM}><rect width={ram} height={vyskaKridla}/><rect x={sirkaKridla-ram} width={ram} height={vyskaKridla}/><rect x={ram} width={sirkaKridla-2*ram} height={ram}/><rect x={ram} y={vyskaKridla-ram} width={sirkaKridla-2*ram} height={ram}/></g>
      <g fill="#2A2A2A" stroke="white" strokeWidth={cutFont*.28} style={{paintOrder:"stroke"}} fontFamily="monospace" fontWeight={700}><text x={sirkaKridla/2} y={ram+cutFont*1.7} fontSize={cutFont} textAnchor="middle">rez {sirkaKridla-2*ram} mm</text><text x={ram+cutFont*1.1} y={vyskaKridla/2} fontSize={cutFont} textAnchor="middle" transform={`rotate(-90 ${ram+cutFont*1.1} ${vyskaKridla/2})`}>rez {vyskaKridla} mm</text></g>
      <g stroke={FARBA_RAM} strokeWidth={stroke} fill={FARBA_RAM}><line x1={0} y1={-tick*2.5} x2={sirkaKridla} y2={-tick*2.5}/><text x={sirkaKridla/2} y={-tick*3.4} fontSize={fontSize} textAnchor="middle" fontWeight={700} stroke="none">{sirkaKridla} mm</text><line x1={-tick*2.5} y1={0} x2={-tick*2.5} y2={vyskaKridla}/><text x={-tick*3.4} y={vyskaKridla/2} fontSize={fontSize} textAnchor="middle" fontWeight={700} stroke="none" transform={`rotate(-90 ${-tick*3.4} ${vyskaKridla/2})`}>{vyskaKridla} mm</text></g>
      <g><circle cx={0} cy={vyskaKridla-PANT_OD_KRAJA_MM} r={ram*.14} fill="#2A2A2A"/><circle cx={0} cy={PANT_OD_KRAJA_MM} r={ram*.14} fill="#2A2A2A"/><rect x={sirkaKridla-ram*1.5} y={vyskaKridla-KLUCKA_VYSKA_MM-ram*.2} width={ram*.9} height={ram*.4} fill="#8B8F93"/></g>
    </g>
  </svg>
}

function DvojkridlovaPreview({ vstup, vysledok }: Props) {
  const totalW = vstup.sirkaKridla, h = vstup.vyskaKridla, wingW = vysledok.sirkaKridla, ram = RAM_PROFIL_HRUBKA_MM
  const povrch = najdiPovrch(vstup.povrch), fill = povrch.drevo ? "url(#drevoBig)" : povrch.farba
  const margin = 430, vbW = totalW + margin*2, vbH = h + margin*2
  const stroke = Math.max(vbW,vbH)/320, fontSize=Math.max(vbW,vbH)/26, cutFont=fontSize*.58
  const innerW=Math.max(0,wingW-2*ram), bottomLamellaH=Math.max(0,PRIECKA_VYSKA_OD_ZEME_MM-ram)
  const upperLamellaH=Math.max(0,h-2*ram-bottomLamellaH-ram)
  const bottomCount=vysledok.lamelySpodnaCast?.pocet ?? 0, upperCount=vysledok.lamelyHornaCast?.pocet ?? 0
  const bottomGap=vysledok.lamelySpodnaCast?.skutocnaMedzera ?? 0, upperGap=vysledok.lamelyHornaCast?.skutocnaMedzera ?? 0
  const lamelaLen=innerW
  const drawLamellas=(x:number, startY:number, height:number, count:number, gap:number, keyPrefix:string) => Array.from({length:count},(_,i)=><rect key={`${keyPrefix}-${i}`} x={x+ram} y={startY+gap*(i+1)+vstup.sirkaLamely*i} width={innerW} height={vstup.sirkaLamely} fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth={stroke*.5}/>)
  const wing=(x:number, idx:number)=><g key={idx}>
    <rect x={x} y={0} width={wingW} height={h} fill="white"/>
    {drawLamellas(x, ram, bottomLamellaH, bottomCount, bottomGap, `b${idx}`)}
    {drawLamellas(x, PRIECKA_VYSKA_OD_ZEME_MM+ram, upperLamellaH, upperCount, upperGap, `u${idx}`)}
    <g fill={FARBA_RAM}><rect x={x} width={ram} height={h}/><rect x={x+wingW-ram} width={ram} height={h}/><rect x={x+ram} width={innerW} height={ram}/><rect x={x+ram} y={h-ram} width={innerW} height={ram}/><rect x={x+ram} y={PRIECKA_VYSKA_OD_ZEME_MM} width={innerW} height={ram}/></g>
    <g fill="#2A2A2A" stroke="white" strokeWidth={cutFont*.3} style={{paintOrder:"stroke"}} fontFamily="monospace" fontWeight={700}><text x={x+wingW/2} y={PRIECKA_VYSKA_OD_ZEME_MM+ram*1.7} fontSize={cutFont} textAnchor="middle">priečka 50×60 — 250 mm od zeme</text><text x={x+wingW/2} y={h+fontSize*1.7} fontSize={cutFont} textAnchor="middle">rez priečok {innerW} mm</text></g>
  </g>
  return <svg viewBox={`0 0 ${vbW} ${vbH}`} className="h-auto w-full" role="img" aria-label={`Náhľad dvojkrídlovej brány ${totalW} × ${h} mm`}>
    <defs><linearGradient id="drevoBig" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={povrch.farba}/><stop offset="45%" stopColor="rgba(255,255,255,0.18)"/><stop offset="55%" stopColor={povrch.farba}/><stop offset="100%" stopColor="rgba(0,0,0,0.22)"/></linearGradient></defs>
    <g transform={`translate(${margin} ${margin})`}>
      {wing(0,0)}{wing(wingW,1)}
      <g stroke={FARBA_RAM} strokeWidth={stroke} fill={FARBA_RAM}><line x1={0} y1={-fontSize*2.5} x2={totalW} y2={-fontSize*2.5}/><text x={totalW/2} y={-fontSize*3.3} fontSize={fontSize} textAnchor="middle" fontWeight={700} stroke="none">{totalW} mm — 2 × {Math.round(wingW)} mm</text><line x1={-fontSize*2.5} y1={0} x2={-fontSize*2.5} y2={h}/><text x={-fontSize*3.3} y={h/2} fontSize={fontSize} textAnchor="middle" fontWeight={700} stroke="none" transform={`rotate(-90 ${-fontSize*3.3} ${h/2})`}>{h} mm</text></g>
      <g stroke={CUT_COLOR} strokeWidth={stroke*1.3} strokeDasharray={`${fontSize*.35} ${fontSize*.35}`}><line x1={wingW} y1={0} x2={wingW} y2={h}/></g>
      <text x={totalW/2} y={h+fontSize*4} fontSize={fontSize*.65} textAnchor="middle" fontFamily="monospace" fontWeight={700} fill="#2A2A2A">2 samostatné krídla • horizontálne lamely • priečka 250 mm od zeme</text>
    </g>
  </svg>
}
