# Claude Code Usage Pet

English | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md)

A tiny cat that sits above your Claude Code prompt and watches your usage limits. Each window (5-hour, weekly) gets its own cat, and the cat's face changes as you use the window up.

```
5h  █████░░░░░░░    42% (+25%)  ↻18:10            (=^･ω･^=)ﾉ "Feeling great!"
wk  ████████████    96% (+2%)   ↻10/5 18:00       (=ｘェｘ=) "Almost out this week..."
```

The blue part of each bar and the blue `(+25%)` are this conversation's share of the window (see [below](#this-conversations-share)).

ASCII style, for terminals without CJK fonts:

```
5h  [#####-------]  42% (+25%)  reset 18:10       (=^.^=)/ "Feeling great!"
wk  [############]  96% (+2%)   reset 10/5 18:00  (=x.x=) "Almost out this week..."
```

> Not an official Anthropic project. "Claude" and "Claude Code" are trademarks of Anthropic.

## What it shows

| Usage | Cat | Color |
|---|---|---|
| no reading yet | `(=^-ω-^=) zZ` / `(=^-.-^=) zZ` | gray |
| below 50% | `(=^･ω･^=)ﾉ` / `(=^.^=)/` | green |
| 50 – 79% | `(=^･ｪ･^=)` / `(=o.o=)` | yellow |
| 80 – 94% | `(= ; ｪ ; =)` / `(=;.;=)` | red |
| 95% and up | `(=ｘェｘ=)` / `(=x.x=)` | red |

The thresholds are configurable. Reset times are shown in your local time zone.

The bar also has a **blue segment** and a **blue `(+N%)`** for the part of the window this conversation used (GitHub can't show the color in the examples above). See [This conversation's share](#this-conversations-share).

## This conversation's share

When you run several Claude Code sessions at once, each one shows how much of the account's usage it caused, as a blue `(+N%)` and a blue segment of the bar.

Claude Code only reports account-wide percentages, so this is an **estimate**: every session records what it has spent, and each time the account's percentage grows, the growth is split between the running sessions in proportion to what each spent since the last reading. It starts at zero when the session starts and when the window resets.

Limits of the estimate:

- Usage outside Claude Code (claude.ai, the mobile app) is not seen by any session. Growth with no spend in any session is left unattributed; growth that overlaps with a session's own spend is credited to that session, so it can read a little high.
- Spend is priced per model, which may not match how each model counts against your limits.
- Tiny shares show as `+<1%`.

## Requirements

- Claude Code **2.1.288 or later** (terminal, desktop app or VS Code).
- A **Claude subscription** (Pro or Max; Team also works in practice). The usage numbers come from Claude Code itself, which only reports them for subscription accounts.
- **Not for** API-key, Amazon Bedrock or Google Vertex AI accounts: they have no usage windows, so the cat would only ever sleep.

This plugin uses Claude Code's function-hooks API, which is still **early access** and may change between releases. If the cat disappears after an update, see [Troubleshooting](#troubleshooting).

## Install

Inside Claude Code:

```
/plugin marketplace add Tiange781122/claude-code-usage-pet
/plugin install usage-pet@usage-pet
```

Or from a shell:

```
claude plugin marketplace add Tiange781122/claude-code-usage-pet
claude plugin install usage-pet@usage-pet
```

Restart Claude Code (or run `/reload-plugins`). The cat appears above the prompt, asleep until the first reply arrives.

Update: `claude plugin update usage-pet@usage-pet` · Disable: `claude plugin disable usage-pet@usage-pet` · Remove: `claude plugin uninstall usage-pet@usage-pet`

## Settings

| Option | Values | Default | What it does |
|---|---|---|---|
| `language` | `auto`, `en`, `zh-TW`, `ja` | `auto` | Language of the cat's lines. `auto` follows your system locale (`LC_ALL`, `LC_MESSAGES`, `LANG`), else English. Any Chinese locale uses Traditional Chinese for now. |
| `petStyle` | `auto`, `kaomoji`, `ascii` | `auto` | `kaomoji` needs a font with Japanese characters. `auto` picks `kaomoji` for Chinese/Japanese and `ascii` otherwise. |
| `timeZone` | `auto` or an IANA name like `Asia/Tokyo` | `auto` | Time zone for reset times. `auto` uses this machine's. |
| `halfAt` | 1 – 100 | `50` | Percent where the cat turns yellow. |
| `warnAt` | 1 – 100 | `80` | Percent where the cat turns red and worried. |
| `outAt` | 1 – 100 | `95` | Percent where the cat runs out of energy. |

### How to change a setting

Pick whichever is easiest:

1. **In Claude Code:** run `/plugin`, open the **Installed** tab, select **usage-pet**, press Enter, choose **Configure options**.
2. **In Claude Code:** run `/config` and look for the usage-pet rows.
3. **From a shell:**
   ```
   echo '{"petStyle":"ascii","language":"en"}' | claude plugin configure usage-pet@usage-pet --values-stdin
   ```

Restart Claude Code to apply the change.

## Export for other tools (opt-in)

Want the same figures in a menu bar, a tmux status line or your own dashboard? Create the folder once:

```
mkdir -p ~/.cache/usage-pet
```

From then on, every time Claude Code reports new usage, the plugin writes the latest windows to `~/.cache/usage-pet/<config dir name>.json`: `.claude.json` for the default `~/.claude`, or `.claude-work.json` when `CLAUDE_CONFIG_DIR` is `~/.claude-work`. One file per config dir, overwritten in place:

```json
{"configDir":"/Users/you/.claude","at":1791617448167,"limits":[{"kind":"five_hour","percentUsed":36,"resetsAt":"2026-10-10T10:30:00.000Z"},{"kind":"seven_day","percentUsed":82,"resetsAt":"2026-10-11T02:00:00.000Z"}]}
```

`at` is milliseconds since the epoch. Each session also writes its own context fill to `~/.cache/usage-pet/sessions/<session id>.json` (`sessionId`, `at`, `tokens`, `window`, `percent`), so a dashboard can show how full every running conversation is. Without the folder nothing is written; delete the folder to turn the export off.

## Troubleshooting

**I see boxes (□), question marks, or a misaligned cat.** Your terminal font lacks the Japanese characters the kaomoji use. Set `petStyle` to `ascii` (see above). This also replaces the `█░` bar and the `↻` mark. If the cat's lines are boxes too, set `language` to `en`. Common on the legacy Windows console; Windows Terminal and macOS terminals are usually fine.

**The cat never wakes up.** It wakes on the first reply of the session. If it still sleeps, your account probably has no usage windows (API key, Bedrock, Vertex). This plugin can't help there.

**The cat disappeared after updating Claude Code.** The function-hooks API is early access and may have changed. Update the plugin (`claude plugin update usage-pet@usage-pet`); if that doesn't help, start Claude Code with `claude --debug` and look for lines starting with `usage-pet`, then open an issue with your `claude --version`.

## Privacy and cost

- **No extra tokens.** It never calls a model or adds to your prompt; `claude plugin details usage-pet@usage-pet` reports `~0 tok` always-on.
- **No network.** It only reads the usage figures Claude Code already pushes to plugins, the locale variables `LC_ALL`, `LC_MESSAGES`, `LANG`, and (for the opt-in export) `HOME` and `CLAUDE_CONFIG_DIR`.
- **One small local file.** To estimate each conversation's share, every session writes its session id, its spend in US dollars and a timestamp to the plugin's own store (`<config dir>/plugins/store/usage-pet_*.json`). Nothing else is stored, entries older than 8 days are removed the next time the plugin runs, and the file never leaves your machine.
- **Opt-in export file.** Only if you created `~/.cache/usage-pet/`, the latest usage percentages and reset times, and each session's id and context fill, are written there (see above). Nothing else goes into it.

## Contributing

Add a language: add one entry to `hooks/locales.ts` and its code to the `language` options in `.claude-plugin/plugin.json`, then add a test.

Check your change:

```
claude plugin validate .
claude plugin test .
```

## Credits

Kaomoji inspired by [not-ai.tools](https://not-ai.tools/kaomoji/cat/) and [asciiart.eu](https://www.asciiart.eu/animals/cats).

## License

[MIT](LICENSE)
