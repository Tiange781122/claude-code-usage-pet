export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

// Per window: where this session last saw it, and how much of it this session used.
export type WindowShare = {
  resetsAt?: string
  lastPercent: number
  mine: number
  myUsd: number
  // Other sessions' spend at our last reading, by session id.
  othersUsd: Record<string, number>
}

export type Shares = Record<string, WindowShare>

declare module 'claude-code' {
  interface PluginState {
    'usage-pet': { limits: Limit[]; shares: Shares }
  }
}
