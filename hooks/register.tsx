import { atom, read, update } from 'claude-code'
import type { EngineInterface, PluginOptions, Register } from 'claude-code'

import type { Limit, Shares } from '../types'
import { DEFAULT_LANGUAGE, LOCALES, matchLanguage } from './locales'
import type { Locale } from './locales'
import { FACES, LEVEL_COLORS, barParts, levelOf, resetMark, resetText, timeZoneOf } from './pet'
import type { PetStyle, Thresholds } from './pet'
import { PEER_FUTURE_MS, PEER_PREFIX, PEER_TTL_MS, mineText, nextShares } from './share'
import type { Peer } from './share'

const limits = atom({ plugin: 'usage-pet', key: 'limits' } as const, [] as Limit[])
const shares = atom({ plugin: 'usage-pet', key: 'shares' } as const, {} as Shares)

type Settings = { locale: Locale; style: PetStyle; timeZone: string | undefined; thresholds: Thresholds }

const str = (v: PluginOptions[string] | undefined, fallback: string) => (typeof v === 'string' ? v : fallback)
const num = (v: PluginOptions[string] | undefined, fallback: number) => (typeof v === 'number' ? v : fallback)

// language: the picked one, else the system locale, else English.
const resolveLanguage = async ($: EngineInterface, picked: string) => {
  if (picked !== 'auto' && LOCALES[picked]) return picked
  return matchLanguage(await $.env.get('LC_ALL'))
    ?? matchLanguage(await $.env.get('LC_MESSAGES'))
    ?? matchLanguage(await $.env.get('LANG'))
    ?? matchLanguage(new Intl.DateTimeFormat().resolvedOptions().locale)
    ?? DEFAULT_LANGUAGE
}

const resolveSettings = async ($: EngineInterface, options: PluginOptions): Promise<Settings> => {
  const language = await resolveLanguage($, str(options.language, 'auto'))
  const pickedStyle = str(options.petStyle, 'auto')
  // auto: kaomoji where a CJK font is all but certain, ascii elsewhere.
  const style: PetStyle = pickedStyle === 'kaomoji' || pickedStyle === 'ascii'
    ? pickedStyle
    : language === 'en' ? 'ascii' : 'kaomoji'
  const half = num(options.halfAt, 50)
  const warn = Math.max(half, num(options.warnAt, 80))
  const out = Math.max(warn, num(options.outAt, 95))
  return {
    locale: LOCALES[language] ?? LOCALES[DEFAULT_LANGUAGE]!,
    style,
    timeZone: timeZoneOf(str(options.timeZone, 'auto')),
    thresholds: { half, warn, out },
  }
}

const toLimits = (raw: readonly Limit[]): Limit[] =>
  raw.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt }))

const isPeer = (v: unknown): v is Peer =>
  typeof v === 'object' && v !== null && Number.isFinite((v as Peer).usd) && Number.isFinite((v as Peer).at)

// Publishes this session's spend, reads the other sessions', and updates this session's shares.
const account = async ($: EngineInterface, current: Limit[], myUsd: number) => {
  const id = await $.session.id()
  const now = await $.clock.now()
  await $.store.set(`${PEER_PREFIX}${id}`, { usd: myUsd, at: now })
  const othersUsd: Record<string, number> = {}
  for (const key of await $.store.keys()) {
    if (!key.startsWith(PEER_PREFIX) || key === `${PEER_PREFIX}${id}`) continue
    const peer = await $.store.get(key)
    // Malformed, expired, or stamped in the future: drop it.
    if (!isPeer(peer) || now - peer.at > PEER_TTL_MS || peer.at > now + PEER_FUTURE_MS) {
      await $.store.delete(key)
      continue
    }
    othersUsd[key.slice(PEER_PREFIX.length)] = peer.usd
  }
  await update($, shares, prev => nextShares(prev, current, myUsd, othersUsd))
}

// Opt-in export for other local tools (a dashboard, a status bar): when ~/.cache/usage-pet/
// exists, the latest limits are written to <that dir>/<config dir name>.json, e.g.
// .claude-work.json. Without the directory nothing is written. Failures never reach the band.
const exportLimits = async ($: EngineInterface, current: Limit[]) => {
  try {
    const home = await $.env.get('HOME')
    if (!home || current.length === 0) return
    const dir = `${home}/.cache/usage-pet`
    if (!(await $.fs.exists(dir))) return
    const configDir = (await $.env.get('CLAUDE_CONFIG_DIR')) || `${home}/.claude`
    const name = configDir.replace(/\/+$/, '').split('/').pop() || 'default'
    const at = await $.clock.now()
    await $.fs.write(`${dir}/${name}.json`, JSON.stringify({ configDir, at, limits: current }))
  } catch {
    // best effort
  }
}

export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const usage = await $.session.usage()
    const current = toLimits(usage.rateLimits)
    await update($, limits, () => current)
    await account($, current, usage.cost?.usd ?? 0)
    await exportLimits($, current)
    return result
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits') || e.changed.includes('cost')) {
      const current = toLimits(e.rateLimits)
      await update($, limits, () => current)
      await account($, current, e.cost?.usd ?? 0)
      await exportLimits($, current)
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const list = await read($, limits)
    const mine = await read($, shares)
    const nowMs = await $.clock.now()
    const { locale, style, timeZone, thresholds } = await resolveSettings($, options)
    const [open, close] = locale.quote
    const faces = FACES[style]

    const { Box, Text } = $.ui.resolve(e)

    if (!list.length) {
      return (
        <Text>
          <Text color="gray" bold>{faces.sleeping}</Text>
          <Text dimColor>{`${open}${locale.sleeping}${close}`}</Text>
        </Text>
      )
    }

    return (
      <Box flexDirection="column">
        {list.map(l => {
          const level = levelOf(l.percentUsed, thresholds)
          const lines = locale.lines[l.kind] ?? locale.lines.five_hour!
          const reset = resetText(l.resetsAt, nowMs, timeZone, locale.dateLocale)
          const myPart = mine[l.kind]?.mine ?? 0
          const bar = barParts(l.percentUsed, myPart, style)
          return (
            <Box flexDirection="row">
              <Box width={4}><Text>{locale.labels[l.kind] ?? l.kind}</Text></Box>
              <Box width={BAR_COLUMNS}>
                <Text>
                  <Text>{bar.open}</Text>
                  <Text color={LEVEL_COLORS[level]}>{bar.used}</Text>
                  <Text color={MINE_COLOR}>{bar.mine}</Text>
                  <Text dimColor>{bar.empty}</Text>
                  <Text>{bar.close}</Text>
                </Text>
              </Box>
              <Box width={PERCENT_COLUMNS}>
                <Text>
                  <Text bold>{`${Math.round(l.percentUsed)}%`.padStart(5)}</Text>
                  <Text color={MINE_COLOR}>{myPart > 0 ? ` (${mineText(myPart)})` : ''}</Text>
                </Text>
              </Box>
              <Box width={RESET_COLUMNS}>
                <Text dimColor>{reset ? `  ${resetMark(style)}${reset}` : ''}</Text>
              </Box>
              <Text>
                <Text color={LEVEL_COLORS[level]} bold>{faces.levels[level]}</Text>
                <Text dimColor>{`${open}${lines[level]}${close}`}</Text>
              </Text>
            </Box>
          )
        })}
      </Box>
    )
  })
}

const MINE_COLOR = 'blue' // this session's part of the bar and its "+N%"
const BAR_COLUMNS = 15 // the ascii bar's 14 cells plus a space
const PERCENT_COLUMNS = 13 // " 100% (+<1%)" plus a space
const RESET_COLUMNS = 20 // "  reset 12/31 18:00" plus a space
