// User-visible strings. To add a language: add one entry here and its code to
// the `language` options in .claude-plugin/plugin.json.

export type Lines = [fine: string, half: string, warn: string, out: string]

export type Locale = {
  // Short label per rate-limit window; unknown windows fall back to their kind.
  labels: Record<string, string>
  // What the pet says per window, by usage level.
  lines: Record<string, Lines>
  sleeping: string
  quote: [open: string, close: string]
  // Locale used for the reset date (month/day order).
  dateLocale: string
}

export const LOCALES: Record<string, Locale> = {
  en: {
    labels: { five_hour: '5h', seven_day: 'wk', spend_limit: '$' },
    lines: {
      five_hour: ['Feeling great!', 'Halfway there', 'Slow down a bit', 'Need a nap...'],
      seven_day: ['Plenty left this week', 'Past halfway this week', 'Save some for later', 'Almost out this week...'],
      spend_limit: ['Plenty of budget', 'Half the budget used', 'Budget running low', 'Over budget...'],
    },
    sleeping: 'Waiting for the first reply...',
    quote: [' "', '"'],
    dateLocale: 'en-US',
  },
  'zh-TW': {
    labels: { five_hour: '5h', seven_day: '週', spend_limit: '$' },
    lines: {
      five_hour: ['精神很好喵', '用了一半囉', '慢一點喵', '先休息一下喵…'],
      seven_day: ['這週很充裕', '這週過半囉', '這週要省著用', '這週快沒了喵…'],
      spend_limit: ['預算很充裕', '預算用一半囉', '預算快見底了', '預算爆了喵…'],
    },
    sleeping: '等第一次回應…',
    quote: [' 「', '」'],
    dateLocale: 'zh-TW',
  },
  ja: {
    labels: { five_hour: '5h', seven_day: '週', spend_limit: '$' },
    lines: {
      five_hour: ['元気いっぱいにゃ', '半分使ったにゃ', 'ちょっとペースダウン', 'ひと休みするにゃ…'],
      seven_day: ['今週はまだ余裕', '今週も折り返し', '今週は節約モード', '今週はもう限界にゃ…'],
      spend_limit: ['予算はたっぷり', '予算は半分', '予算が残りわずか', '予算オーバーにゃ…'],
    },
    sleeping: '最初の応答を待ってるにゃ…',
    quote: [' 「', '」'],
    dateLocale: 'ja-JP',
  },
}

export const DEFAULT_LANGUAGE = 'en'

// Picks a supported language from a locale tag like "ja-JP", "zh-Hant-TW" or "zh_TW.UTF-8".
export const matchLanguage = (tag: string | undefined): string | undefined => {
  const t = (tag ?? '').toLowerCase().replace('_', '-')
  if (t.startsWith('zh')) return 'zh-TW'
  if (t.startsWith('ja')) return 'ja'
  if (t.startsWith('en')) return 'en'
  return undefined
}
