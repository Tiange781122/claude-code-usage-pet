// Pure display logic: no engine calls, so tests can exercise it directly.

export type PetStyle = 'kaomoji' | 'ascii'

export type Thresholds = { half: number; warn: number; out: number }

export type Level = 0 | 1 | 2 | 3 // fine, half, warn, out

// Kaomoji from not-ai.tools/kaomoji/cat; ASCII set (after asciiart.eu) for terminals without CJK fonts.
export const FACES: Record<PetStyle, { sleeping: string; levels: [string, string, string, string] }> = {
  kaomoji: {
    sleeping: '(=^-ω-^=) zZ',
    levels: ['(=^･ω･^=)ﾉ', '(=^･ｪ･^=)', '(= ; ｪ ; =)', '(=ｘェｘ=)'],
  },
  ascii: {
    sleeping: '(=^-.-^=) zZ',
    levels: ['(=^.^=)/', '(=o.o=)', '(=;.;=)', '(=x.x=)'],
  },
}

export const LEVEL_COLORS = ['green', 'yellow', 'red', 'red'] as const

export const levelOf = (pct: number, t: Thresholds): Level =>
  pct >= t.out ? 3 : pct >= t.warn ? 2 : pct >= t.half ? 1 : 0

export const BAR_CELLS = 12

const cellsOf = (pct: number) => Math.max(0, Math.min(BAR_CELLS, Math.round((pct / 100) * BAR_CELLS)))

export type BarParts = { open: string; used: string; mine: string; empty: string; close: string }

// Bar for one window, split so this session's part can be colored on its own;
// past 100% (an exceeded spend limit) it stays full.
export const barParts = (pct: number, mine: number, style: PetStyle): BarParts => {
  const filled = cellsOf(pct)
  const mineCells = Math.min(filled, cellsOf(mine))
  const [full, blank] = style === 'ascii' ? ['#', '-'] : ['█', '░']
  return {
    open: style === 'ascii' ? '[' : '',
    used: full.repeat(filled - mineCells),
    mine: full.repeat(mineCells),
    empty: blank.repeat(BAR_CELLS - filled),
    close: style === 'ascii' ? ']' : '',
  }
}

export const resetMark = (style: PetStyle) => (style === 'ascii' ? 'reset ' : '↻')

const dayKey = (ms: number, timeZone: string | undefined) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms)

// "18:10" when the reset is today in `timeZone`, otherwise "10/5 18:00" (order per dateLocale).
export const resetText = (iso: string | undefined, nowMs: number, timeZone: string | undefined, dateLocale: string) => {
  if (!iso) return ''
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return ''
  const time = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at)
  if (dayKey(at, timeZone) === dayKey(nowMs, timeZone)) return time
  const date = new Intl.DateTimeFormat(dateLocale, { timeZone, month: 'numeric', day: 'numeric' }).format(at)
  return `${date} ${time}`
}

// Validates a time-zone name; undefined means the machine's own zone.
export const timeZoneOf = (name: string | undefined): string | undefined => {
  if (!name || name === 'auto') return undefined
  try {
    new Intl.DateTimeFormat('en', { timeZone: name })
    return name
  } catch {
    return undefined
  }
}
