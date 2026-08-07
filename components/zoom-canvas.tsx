"use client"

import { useState, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

// Kroky pod 100% = viac scény naraz na obrazovke (viac priestoru na kreslenie).
// Kroky nad 100% = priblíženie na detail.
const KROKY_ZOOM = [0.5, 0.65, 0.8, 1, 1.4, 1.8]
const DEFAULT_KROK = 3 // index hodnoty 1 (100%)

/**
 * Obal okolo SVG náhľadu s tlačidlami +/− na oddialenie (viac priestoru) aj priblíženie (detail).
 * Kontajner má overflow: auto, takže pri priblížení sa dá obsah posúvať prstom/scrollom.
 * Poznámka: natívny Fullscreen API sa tu zámerne nepoužíva — popover na potvrdenie prekážky
 * je mimo fullscreen elementu, takže by v ňom nebol vidieť.
 */
export function ZoomCanvas({ children }: Props) {
  const [krok, setKrok] = useState(DEFAULT_KROK)
  const zoom = KROKY_ZOOM[krok]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setKrok((k) => Math.max(0, k - 1))}
          disabled={krok === 0}
          aria-label="Oddialiť — viac priestoru"
          className="rounded-md border-2 border-input bg-background px-4 py-2 text-lg font-bold text-foreground disabled:opacity-30"
        >
          −
        </button>
        <span className="min-w-14 text-center font-mono text-sm font-bold text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => setKrok((k) => Math.min(KROKY_ZOOM.length - 1, k + 1))}
          disabled={krok === KROKY_ZOOM.length - 1}
          aria-label="Priblížiť na detail"
          className="rounded-md border-2 border-input bg-background px-4 py-2 text-lg font-bold text-foreground disabled:opacity-30"
        >
          +
        </button>
        {krok !== DEFAULT_KROK && (
          <button type="button" onClick={() => setKrok(DEFAULT_KROK)} className="rounded-md border-2 border-input bg-background px-3 py-2 text-xs font-bold text-muted-foreground">
            Reset
          </button>
        )}
      </div>
      <div className="max-h-[75svh] w-full overflow-auto rounded-md">
        <div style={{ width: `${zoom * 100}%` }}>{children}</div>
      </div>
    </div>
  )
}
