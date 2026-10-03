// Estimates how much of each usage window this session used.
//
// Claude Code only reports account-wide percentages. Every session of this
// plugin publishes its own spend (cost.usd) to the plugin's shared store, and
// each time the account's percentage grows, the growth is split between the
// sessions in proportion to what each spent since the last reading. Usage
// from outside Claude Code (claude.ai, mobile) has no spend here, so it is
// attributed to the sessions that were running: an estimate, not an exact figure.

import type { Limit, Shares, WindowShare } from '../types'

export type Peer = { usd: number; at: number }

export const PEER_PREFIX = 'session:'
export const PEER_TTL_MS = 8 * 24 * 60 * 60 * 1000 // longer than the weekly window
export const PEER_FUTURE_MS = 60 * 60 * 1000 // clock skew we tolerate between sessions

export const nextShares = (
  shares: Shares,
  limits: readonly Limit[],
  myUsd: number,
  othersUsd: Record<string, number>,
): Shares => {
  const result: Shares = {}
  for (const l of limits) {
    const prev = shares[l.kind]
    if (!prev) {
      // First reading: a baseline, nothing attributed yet.
      result[l.kind] = { resetsAt: l.resetsAt, lastPercent: l.percentUsed, mine: 0, myUsd, othersUsd }
      continue
    }
    const isReset = prev.resetsAt !== l.resetsAt
    const base: WindowShare = isReset ? { ...prev, lastPercent: 0, mine: 0 } : prev
    const grown = Math.max(0, l.percentUsed - base.lastPercent)
    const mySpent = Math.max(0, myUsd - prev.myUsd)
    let othersSpent = 0
    for (const [id, usd] of Object.entries(othersUsd)) {
      othersSpent += Math.max(0, usd - (prev.othersUsd[id] ?? 0))
    }
    const total = mySpent + othersSpent
    const share = total > 0 ? mySpent / total : 0
    result[l.kind] = {
      resetsAt: l.resetsAt,
      lastPercent: l.percentUsed,
      mine: Math.min(l.percentUsed, base.mine + grown * share),
      myUsd,
      othersUsd,
    }
  }
  return result
}

// "+8%", "+<1%" for a sliver, nothing when this session used none.
export const mineText = (mine: number) => (mine <= 0 ? '' : mine < 1 ? '+<1%' : `+${Math.round(mine)}%`)
