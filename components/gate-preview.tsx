"use client"

import { RAM_PROFIL_HRUBKA_MM, FARBA_RAM, najdiPovrch, KLUCKA_VYSKA_MM, PANT_OD_KRAJA_MM } from "@/lib/gate-config"
import type { GateInput, GateResult } from "@/lib/gate-calc"

/** Výrazná kontrastná farba pre orezové značky. */
const CUT_COLOR = "#E63946"

interface Props {
  vstup: GateInput
  vysledok: GateResult
}

export function GatePreview({ vstup, vysledok }: Props) {
  const { sirkaKridla, vyskaKridla, sirkaLamely } = vstup
  const { pocetLamiel, skutocnaMedzera } = vysledok

  // Vzhľad lamely (farba, prípadne drevodekor).
  const povrch = najdiPovrch(vstup.povrch)
  const lamelaFill = povrch.drevo ? "url(#drevo)" : povrch.farba
  // Svetlé povrchy potrebujú jemný obrys, aby boli viditeľné na bielom pozadí.
  const lamelaStroke = "rgba(0,0,0,0.18)"

  // Rozmery kreslenia (SVG jednotky = mm reálnej bránky).
  // Okolo bránky necháme priestor na kótovacie čiary.
  const margin = 380
  const vbW = sirkaKridla + margin * 2
  const vbH = vyskaKridla + margin * 2

  const x0 = margin
  const y0 = margin
  const ram = RAM_PROFIL_HRUBKA_MM

  // Vnútorný priestor
  const innerX = x0 + ram
  const innerY = y0 + ram
  const innerW = sirkaKridla - 2 * ram
  const innerH = vyskaKridla - 2 * ram

  const vertikalne = vstup.orientacia === "vertikalne"

  // Pozície lamiel (rovnomerne, s medzerou aj na krajoch).
  // Vertikálne: posun po osi X. Horizontálne: posun po osi Y.
  const lamely: number[] = []
  const start = vertikalne ? innerX : innerY
  for (let i = 0; i < pocetLamiel; i++) {
    lamely.push(start + skutocnaMedzera * (i + 1) + sirkaLamely * i)
  }

  // Hrúbka kótovacích čiar a textu prispôsobená mierke.
  const stroke = Math.max(vbW, vbH) / 320
  const fontSize = Math.max(vbW, vbH) / 26
  const tick = fontSize * 0.9
  // Menší font pre popisky rezných dĺžok (výrobný podklad).
  const cutFont = fontSize * 0.62

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Náhľad bránky ${sirkaKridla} × ${vyskaKridla} mm s ${pocetLamiel} lamelami`}
    >
      {/* Drevodekor – jemná zvislá textúra pre drevené povrchy */}
      <defs>
        <linearGradient id="drevo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={povrch.farba} />
          <stop offset="45%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="55%" stopColor={povrch.farba} />
          <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
        </linearGradient>
      </defs>

      {/* Vnútorná plocha (pozadie za lamelami) */}
      <rect x={innerX} y={innerY} width={innerW} height={innerH} fill="#ffffff" />

      {/* Lamely – vertikálne (posun po X) alebo horizontálne (posun po Y) */}
      {lamely.map((pos, i) => (
        <rect
          key={i}
          x={vertikalne ? pos : innerX}
          y={vertikalne ? innerY : pos}
          width={vertikalne ? sirkaLamely : innerW}
          height={vertikalne ? innerH : sirkaLamely}
          fill={lamelaFill}
          stroke={lamelaStroke}
          strokeWidth={stroke * 0.5}
        />
      ))}

      {/* Rám 50×60 mm.
          Zvislé kusy (bočnice) idú v PLNEJ výške na vonkajších rohoch.
          Vodorovné kusy (priečky) sú KRATŠIE, vsadené MEDZI zvislé. */}
      <g fill={FARBA_RAM}>
        {/* Zvislé – plná výška */}
        <rect x={x0} y={y0} width={ram} height={vyskaKridla} />
        <rect x={x0 + sirkaKridla - ram} y={y0} width={ram} height={vyskaKridla} />
        {/* Vodorovné – vsadené medzi zvislé (kratšie o 2× hrúbku) */}
        <rect x={x0 + ram} y={y0} width={sirkaKridla - 2 * ram} height={ram} />
        <rect x={x0 + ram} y={y0 + vyskaKridla - ram} width={sirkaKridla - 2 * ram} height={ram} />
      </g>

      {/* Orezové značky – rez v mieste styku zvislého a vodorovného kusu.
          Prerušovaná čiara naprieč profilom na 4 rohových spojoch. */}
      <g
        stroke={CUT_COLOR}
        strokeWidth={stroke * 1.4}
        strokeDasharray={`${tick * 0.5} ${tick * 0.5}`}
      >
        {[x0 + ram, x0 + sirkaKridla - ram].map((cx) => (
          <g key={cx}>
            {/* horná priečka */}
            <line x1={cx} y1={y0 - stroke} x2={cx} y2={y0 + ram + stroke} />
            {/* dolná priečka */}
            <line
              x1={cx}
              y1={y0 + vyskaKridla - ram - stroke}
              x2={cx}
              y2={y0 + vyskaKridla + stroke}
            />
          </g>
        ))}
      </g>

      {/* Popisky rezných dĺžok jednotlivých kusov.
          Biely obrys (paint-order) kvôli čitateľnosti nad tmavými lamelami. */}
      <g
        fill="#2A2A2A"
        stroke="#ffffff"
        strokeWidth={cutFont * 0.28}
        style={{ paintOrder: "stroke" }}
        strokeLinejoin="round"
        fontFamily="var(--font-mono), monospace"
        fontWeight={700}
      >
        {/* Vodorovný kus – rezná dĺžka (medzi zvislými) */}
        <text
          x={x0 + sirkaKridla / 2}
          y={y0 + ram + cutFont * 1.7}
          fontSize={cutFont}
          textAnchor="middle"
        >
          {`rez ${sirkaKridla - 2 * ram} mm`}
        </text>
        {/* Zvislý kus – rezná dĺžka (plná výška) */}
        <text
          x={x0 + ram + cutFont * 1.1}
          y={y0 + vyskaKridla / 2}
          fontSize={cutFont}
          textAnchor="middle"
          transform={`rotate(-90 ${x0 + ram + cutFont * 1.1} ${y0 + vyskaKridla / 2})`}
        >
          {`rez ${vyskaKridla} mm`}
        </text>
      </g>

      {/* Kótovacia čiara – ŠÍRKA (nad bránkou) */}
      <g stroke={FARBA_RAM} strokeWidth={stroke} fill={FARBA_RAM}>
        <line x1={x0} y1={y0 - tick * 4} x2={x0} y2={y0 - tick} />
        <line
          x1={x0 + sirkaKridla}
          y1={y0 - tick * 4}
          x2={x0 + sirkaKridla}
          y2={y0 - tick}
        />
        <line
          x1={x0}
          y1={y0 - tick * 2.5}
          x2={x0 + sirkaKridla}
          y2={y0 - tick * 2.5}
        />
        <text
          x={x0 + sirkaKridla / 2}
          y={y0 - tick * 3.4}
          fontSize={fontSize}
          textAnchor="middle"
          fontWeight={700}
          fontFamily="var(--font-mono), monospace"
          stroke="none"
        >
          {sirkaKridla} mm
        </text>
      </g>

      {/* Kótovacia čiara – VÝŠKA (vľavo od bránky) */}
      <g stroke={FARBA_RAM} strokeWidth={stroke} fill={FARBA_RAM}>
        <line x1={x0 - tick * 4} y1={y0} x2={x0 - tick} y2={y0} />
        <line
          x1={x0 - tick * 4}
          y1={y0 + vyskaKridla}
          x2={x0 - tick}
          y2={y0 + vyskaKridla}
        />
        <line
          x1={x0 - tick * 2.5}
          y1={y0}
          x2={x0 - tick * 2.5}
          y2={y0 + vyskaKridla}
        />
        <text
          x={x0 - tick * 3.4}
          y={y0 + vyskaKridla / 2}
          fontSize={fontSize}
          textAnchor="middle"
          fontWeight={700}
          fontFamily="var(--font-mono), monospace"
          stroke="none"
          transform={`rotate(-90 ${x0 - tick * 3.4} ${y0 + vyskaKridla / 2})`}
        >
          {vyskaKridla} mm
        </text>
      </g>

      {/* Panty – na ľavej bočnici (strana pántov / závesu krídla).
          Spodný pánt 100mm od spodku, horný pánt 100mm od vrchu. */}
      <g>
        {[
          { y: y0 + vyskaKridla - PANT_OD_KRAJA_MM, label: "spodný pánt" },
          { y: y0 + PANT_OD_KRAJA_MM, label: "horný pánt" },
        ].map((p) => (
          <g key={p.label}>
            <rect
              x={x0 - ram * 0.32}
              y={p.y - ram * 0.62}
              width={ram * 0.64}
              height={ram * 1.24}
              rx={ram * 0.12}
              fill="#8B8F93"
              stroke="#2A2A2A"
              strokeWidth={stroke * 0.5}
            />
            <circle cx={x0} cy={p.y} r={ram * 0.14} fill="#2A2A2A" />
            <text
              x={x0 - ram * 0.5}
              y={p.y + cutFont * 0.32}
              fontSize={cutFont}
              textAnchor="end"
              fill="#2A2A2A"
              stroke="#ffffff"
              strokeWidth={cutFont * 0.28}
              style={{ paintOrder: "stroke" }}
              fontFamily="var(--font-mono), monospace"
              fontWeight={700}
            >
              {`${p.label} ${PANT_OD_KRAJA_MM}mm`}
            </text>
          </g>
        ))}
      </g>

      {/* Kľučka – na pravej bočnici (protiľahlá od pántov), os vo výške 1050mm od spodku. */}
      <g>
        {(() => {
          const kluckaY = y0 + vyskaKridla - KLUCKA_VYSKA_MM
          const kluckaX = x0 + sirkaKridla
          const plateW = ram * 0.9
          const plateH = ram * 2.1
          const handleLen = ram * 1.4
          return (
            <>
              {/* montážna doštička zámku/kľučky */}
              <rect
                x={kluckaX - ram - plateW * 0.5}
                y={kluckaY - plateH / 2}
                width={plateW}
                height={plateH}
                rx={ram * 0.1}
                fill="#C9CCCE"
                stroke="#2A2A2A"
                strokeWidth={stroke * 0.5}
              />
              {/* rukoväť kľučky smerujúca do krídla */}
              <rect
                x={kluckaX - ram - plateW * 0.5 - handleLen}
                y={kluckaY - ram * 0.16}
                width={handleLen}
                height={ram * 0.32}
                rx={ram * 0.1}
                fill="#8B8F93"
                stroke="#2A2A2A"
                strokeWidth={stroke * 0.4}
              />
              <circle cx={kluckaX - ram} cy={kluckaY} r={ram * 0.13} fill="#2A2A2A" />
              <text
                x={kluckaX + ram * 0.7}
                y={kluckaY + cutFont * 0.32}
                fontSize={cutFont}
                textAnchor="start"
                fill="#2A2A2A"
                stroke="#ffffff"
                strokeWidth={cutFont * 0.28}
                style={{ paintOrder: "stroke" }}
                fontFamily="var(--font-mono), monospace"
                fontWeight={700}
              >
                {`kľučka ${KLUCKA_VYSKA_MM}mm`}
              </text>
            </>
          )
        })()}
      </g>
    </svg>
  )
}
