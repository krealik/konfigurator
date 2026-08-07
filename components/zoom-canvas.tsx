"use client"

import { useState, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

const KROKY_ZOOM = [1, 1.4, 1.8, 2.4]

/**
 * Obal okolo SVG náhľadu, ktorý pridáva tlačidlá na priblíženie/oddialenie.
 * Priblížením sa vnútorný obsah zväčší nad 100% šírky kontajnera — kontajner má
 * overflow: auto, takže používateľ vie priblížený obsah posúvať prstom (natívny scroll),
 * bez potreby zložitých pinch-zoom gest.
 */
export function ZoomCanvas({ children }: Props) {
  const [krok, setKrok] = useState(0)
  const zoom = KROKY_ZOOM[krok]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setKrok((k) => Math.max(0, k - 1))}
          disabled={krok === 0}
          aria-label="Oddialiť"
          className="rounded-md border-2 border-input bg-background px-4 py-2 text-lg font-bold text-foreground disabled:opacity-30"
        >
          −
        </button>
        <span className="min-w-14 text-center font-mono text-sm font-bold text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => setKrok((k) => Math.min(KROKY_ZOOM.length - 1, k + 1))}
          disabled={krok === KROKY_ZOOM.length - 1}
          aria-label="Priblížiť"
          className="rounded-md border-2 border-input bg-background px-4 py-2 text-lg font-bold text-foreground disabled:opacity-30"
        >
          +
        </button>
        {krok > 0 && (
          <button type="button" onClick={() => setKrok(0)} className="rounded-md border-2 border-input bg-background px-3 py-2 text-xs font-bold text-muted-foreground">
            Reset
          </button>
        )}
      </div>
      <div className="max-h-[70svh] w-full overflow-auto rounded-md">
        <div style={{ width: `${zoom * 100}%`, minWidth: "100%" }}>{children}</div>
      </div>
    </div>
  )
}
