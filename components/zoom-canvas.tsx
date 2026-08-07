"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

const KROKY_ZOOM = [1, 1.4, 1.8, 2.4]

/**
 * Obal okolo SVG náhľadu s dvoma nezávislými nástrojmi:
 * - "Celá obrazovka" (skutočný Fullscreen API) — rieši potrebu VIAC PRIESTORU na tablete,
 *   využije celý displej namiesto malého rámčeka v strede stránky.
 * - Tlačidlá +/− — jemné priblíženie na detail v rámci aktuálneho priestoru (kontajner má
 *   overflow: auto, takže priblížený obsah sa dá posúvať prstom).
 */
export function ZoomCanvas({ children }: Props) {
  const [krok, setKrok] = useState(0)
  const [celaObrazovka, setCelaObrazovka] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const zoom = KROKY_ZOOM[krok]

  useEffect(() => {
    function onChange() {
      setCelaObrazovka(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  async function prepniCeluObrazovku() {
    if (!wrapRef.current) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await wrapRef.current.requestFullscreen().catch(() => {
        // Fullscreen API nemusí byť podporené (napr. v niektorých in-app prehliadačoch) — potichu ignorujeme.
      })
    }
  }

  return (
    <div ref={wrapRef} className={celaObrazovka ? "flex h-svh flex-col gap-2 bg-background p-3" : "flex flex-col gap-2"}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prepniCeluObrazovku}
          className="rounded-md border-2 border-primary bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          {celaObrazovka ? "✕ Zavrieť celú obrazovku" : "⛶ Celá obrazovka — viac priestoru"}
        </button>
        <div className="flex items-center gap-2">
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
      </div>
      <div className={(celaObrazovka ? "flex-1 " : "max-h-[70svh] ") + "w-full overflow-auto rounded-md"}>
        <div style={{ width: `${zoom * 100}%`, minWidth: "100%" }}>{children}</div>
      </div>
    </div>
  )
}
