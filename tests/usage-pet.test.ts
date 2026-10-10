import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const NOW = Date.parse('2026-10-03T07:00:00Z')

const BAND = {
  component: 'AbovePrompt' as const,
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
}

const measureOf = (rateLimits: { kind: string; percentUsed: number; resetsAt?: string }[], usd = 0) => ({
  context: { window: 200000 },
  rateLimits,
  cost: { usd },
  changed: ['rateLimits' as const, 'cost' as const],
})

const USAGE = [
  { kind: 'five_hour', percentUsed: 19, resetsAt: '2026-10-03T10:10:00Z' },
  { kind: 'seven_day', percentUsed: 96, resetsAt: '2026-10-05T10:00:00Z' },
]

// The world beneath the plugin: a fixed clock, a locale, this session's id,
// a shared store the test can reach into, and an engine that echoes measures.
const world = (on: On, env: Record<string, string> = { LANG: 'en_US.UTF-8' }) => {
  mock.clock(on, { now: NOW })
  mock.env(on, env)
  const store = new Map<string, unknown>()
  on('store.get', ($, e) => ({ value: store.get(e.key) }))
  on('store.set', ($, e) => (store.set(e.key, e.value), { value: undefined }))
  on('store.delete', ($, e) => (store.delete(e.key), { value: undefined }))
  on('store.keys', () => ({ value: [...store.keys()] }))
  on('session.id', () => ({ value: 'me' }))
  on('session.measure', ($, e) => ({ changed: e.changed }))
  return store
}

type Ui = { findAll: (q: { type: string }) => Promise<{ text: string }[]> }
const texts = async (ui: Ui) => (await ui.findAll({ type: 'Text' })).map(t => t.text)

test('before any reading, an English ascii cat sleeps', async ($, on) => {
  world(on)
  const ui = await $.ui.mount({ plugin: 'usage-pet', surface: 'terminal', ...BAND })
  const all = await texts(ui)
  expect(all).toContain('(=^-.-^=) zZ')
  expect(all).toContain(' "Waiting for the first reply..."')
  await ui.unmount()
})

test('zh-TW: one cat per window, each with its own face and line', { options: { language: 'zh-TW', timeZone: 'Asia/Taipei' } }, async ($, on) => {
  world(on)
  await $.session.measure(measureOf(USAGE))
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'usage-pet', surface, ...BAND })
    const all = await texts(ui)
    for (const t of ['5h', '██', '░░░░░░░░░░', '  19%', '  ↻18:10', '(=^･ω･^=)ﾉ', ' 「精神很好喵」']) expect(all).toContain(t)
    for (const t of ['週', '████████████', '  96%', '  ↻10/5 18:00', '(=ｘェｘ=)', ' 「這週快沒了喵…」']) expect(all).toContain(t)
    await ui.unmount()
  }
})

test('auto language follows LANG, and Japanese gets kaomoji', { options: { timeZone: 'Asia/Tokyo' } }, async ($, on) => {
  world(on, { LANG: 'ja_JP.UTF-8' })
  await $.session.measure(measureOf(USAGE))
  const ui = await $.ui.mount({ plugin: 'usage-pet', surface: 'terminal', ...BAND })
  const all = await texts(ui)
  expect(all).toContain(' 「元気いっぱいにゃ」')
  expect(all).toContain(' 「今週はもう限界にゃ…」')
  expect(all).toContain('  ↻19:10')
  expect(all).toContain('(=ｘェｘ=)')
  await ui.unmount()
})

test('ascii style swaps the bar and the reset mark too', { options: { language: 'zh-TW', petStyle: 'ascii', timeZone: 'Asia/Taipei' } }, async ($, on) => {
  world(on)
  await $.session.measure(measureOf(USAGE))
  const ui = await $.ui.mount({ plugin: 'usage-pet', surface: 'terminal', ...BAND })
  const all = await texts(ui)
  expect(all).toContain('[')
  expect(all).toContain('##')
  expect(all).toContain('----------')
  expect(all).toContain('  reset 18:10')
  expect(all).toContain('(=^.^=)/')
  expect(all).toContain('(=x.x=)')
  expect(all.some(t => /[█░↻ｪェω]/.test(t))).toBe(false)
  await ui.unmount()
})

test('each level has its own face and line, at custom thresholds', { options: { language: 'en', halfAt: 10, warnAt: 20, outAt: 30 } }, async ($, on) => {
  world(on)
  const cases: [number, string, string][] = [
    [5, '(=^.^=)/', ' "Feeling great!"'],
    [15, '(=o.o=)', ' "Halfway there"'],
    [25, '(=;.;=)', ' "Slow down a bit"'],
    [35, '(=x.x=)', ' "Need a nap..."'],
  ]
  for (const [pct, face, line] of cases) {
    await $.session.measure(measureOf([{ kind: 'five_hour', percentUsed: pct }]))
    const ui = await $.ui.mount({ plugin: 'usage-pet', surface: 'terminal', ...BAND })
    const all = await texts(ui)
    expect(all).toContain(face)
    expect(all).toContain(line)
    await ui.unmount()
  }
})

test('a spend limit past 100% shows a full bar and an unknown window its kind', { options: { language: 'en' } }, async ($, on) => {
  world(on)
  await $.session.measure(measureOf([
    { kind: 'spend_limit', percentUsed: 120 },
    { kind: 'seven_day_future', percentUsed: 10 },
  ]))
  const ui = await $.ui.mount({ plugin: 'usage-pet', surface: 'terminal', ...BAND })
  const all = await texts(ui)
  expect(all).toContain('$')
  expect(all).toContain('############')
  expect(all).toContain(' 120%')
  expect(all).toContain('seven_day_future')
  await ui.unmount()
})

const W = (percentUsed: number, resetsAt = '2026-10-03T10:10:00Z') => [{ kind: 'five_hour', percentUsed, resetsAt }]

type Found = { text: string; props: Record<string, unknown> }
const blue = async (ui: { findAll: (q: { type: string }) => Promise<Found[]> }) =>
  (await ui.findAll({ type: 'Text' })).filter(t => t.props.color === 'blue' && t.text).map(t => t.text)

test("one session: the account's growth is all this session's, shown in blue", { options: { language: 'en' } }, async ($, on) => {
  world(on)
  await $.session.measure(measureOf(W(50), 0))
  await $.session.measure(measureOf(W(58), 1))
  const ui = await $.ui.mount({ plugin: 'usage-pet', surface: 'terminal', ...BAND })
  expect(await blue(ui)).toEqual(['#', ' (+8%)'])
  expect(await texts(ui)).toContain('######')
  await ui.unmount()
})

test('two sessions: growth is split by what each spent', { options: { language: 'en' } }, async ($, on) => {
  const store = world(on)
  store.set('session:other', { usd: 0, at: NOW })
  await $.session.measure(measureOf(W(50), 0))
  store.set('session:other', { usd: 3, at: NOW })
  await $.session.measure(measureOf(W(58), 1))
  const ui = await $.ui.mount({ plugin: 'usage-pet', surface: 'terminal', ...BAND })
  expect(await blue(ui)).toEqual([' (+2%)'])
  await ui.unmount()
})

test("growth with no spend anywhere here (claude.ai, phone) is not this session's", { options: { language: 'en' } }, async ($, on) => {
  world(on)
  await $.session.measure(measureOf(W(50), 1))
  await $.session.measure(measureOf(W(70), 1))
  const ui = await $.ui.mount({ plugin: 'usage-pet', surface: 'terminal', ...BAND })
  expect(await blue(ui)).toEqual([])
  await ui.unmount()
})

test("a window reset starts this session's share over", { options: { language: 'en' } }, async ($, on) => {
  world(on)
  await $.session.measure(measureOf(W(50), 0))
  await $.session.measure(measureOf(W(58), 1))
  await $.session.measure(measureOf(W(3, '2026-10-03T15:10:00Z'), 2))
  const ui = await $.ui.mount({ plugin: 'usage-pet', surface: 'terminal', ...BAND })
  expect(await blue(ui)).toEqual([' (+3%)'])
  await ui.unmount()
})

test('stale sessions are dropped from the shared store', { options: { language: 'en' } }, async ($, on) => {
  const store = world(on)
  store.set('session:gone', { usd: 9, at: NOW - 9 * 24 * 60 * 60 * 1000 })
  await $.session.measure(measureOf(W(50), 0))
  expect(store.has('session:gone')).toBe(false)
  expect([...store.keys()]).toEqual(['session:me'])
})

test('export: writes the limits to ~/.cache/usage-pet/<config dir>.json only when that folder exists', async ($, on) => {
  world(on, { LANG: 'en_US.UTF-8', HOME: '/home/u', CLAUDE_CONFIG_DIR: '/home/u/.claude-work' })
  const writes: { path: string; text: string }[] = []
  let exists = false
  on('fs.exists', () => ({ value: exists }))
  on('fs.write', ($, e) => (writes.push({ path: e.path, text: e.text }), { value: undefined }))
  await $.session.measure(measureOf(USAGE))
  expect(writes.length).toBe(0)
  exists = true
  await $.session.measure(measureOf(USAGE))
  expect(writes.length).toBe(1)
  expect(writes[0]!.path).toBe('/home/u/.cache/usage-pet/.claude-work.json')
  const body = JSON.parse(writes[0]!.text)
  expect(body.limits).toEqual(USAGE)
  expect(body.at).toBe(NOW)
})

test('export: writes the session context fill to sessions/<id>.json when the folder exists', async ($, on) => {
  world(on, { LANG: 'en_US.UTF-8', HOME: '/home/u' })
  const writes: { path: string; text: string }[] = []
  on('fs.exists', () => ({ value: true }))
  on('fs.write', ($, e) => (writes.push({ path: e.path, text: e.text }), { value: undefined }))
  await $.session.measure({ context: { window: 200000, tokens: 50000, percent: 25 }, rateLimits: [], changed: ['context' as const] })
  const ctx = writes.find(w => w.path === '/home/u/.cache/usage-pet/sessions/me.json')
  expect(ctx).toBeDefined()
  expect(JSON.parse(ctx!.text)).toEqual({ sessionId: 'me', at: NOW, tokens: 50000, window: 200000, percent: 25 })
})
