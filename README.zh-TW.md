# Claude Code Usage Pet

[English](README.md) | 繁體中文 | [日本語](README.ja.md)

一隻住在 Claude Code 提示框上方的小貓，幫你盯著用量上限。5 小時和每週兩個窗口各有一隻貓，用得越多，表情越累。

```
5h  ██░░░░░░░░░░    19% (+8%)   ↻18:10            (=^･ω･^=)ﾉ 「精神很好喵」
週  ████████████    96% (+15%)  ↻10/5 18:00       (=ｘェｘ=) 「這週快沒了喵…」
```

用量條的藍色段和藍色的 `(+8%)`，是這個對話占用的部分（說明見[下方](#這個對話的用量)）。

沒有中日文字型的終端機可改用 ASCII 風格（貓臉與用量條改為 ASCII；台詞若也變方塊，請把語言設成 `en`）：

```
5h  [##----------]  19% (+8%)   reset 18:10       (=^.^=)/ 「精神很好喵」
週  [############]  96% (+15%)  reset 10/5 18:00  (=x.x=) 「這週快沒了喵…」
```

> 本專案不是 Anthropic 官方專案。「Claude」與「Claude Code」是 Anthropic 的商標。

## 顯示內容

| 用量 | 小貓 | 顏色 |
|---|---|---|
| 還沒有資料 | `(=^-ω-^=) zZ`／`(=^-.-^=) zZ` | 灰 |
| 低於 50% | `(=^･ω･^=)ﾉ`／`(=^.^=)/` | 綠 |
| 50～79% | `(=^･ｪ･^=)`／`(=o.o=)` | 黃 |
| 80～94% | `(= ; ｪ ; =)`／`(=;.;=)` | 紅 |
| 95% 以上 | `(=ｘェｘ=)`／`(=x.x=)` | 紅 |

門檻可以自訂，重置時間以你電腦的時區顯示。

用量條還有一段**藍色**和**藍色的 `(+N%)`**，代表這個對話用掉的部分（GitHub 的範例無法顯示顏色）。說明見[這個對話的用量](#這個對話的用量)。

## 這個對話的用量

同時開多個 Claude Code 對話時，每個對話會用藍色的 `(+N%)` 和用量條的藍色段，顯示帳號用量中有多少是它造成的。

Claude Code 只提供整個帳號的百分比，所以這是**估算值**：每個對話記錄自己花了多少，帳號百分比每上升一次，就依這段期間各對話的花費比例分攤。對話開始時、窗口重置時都從零算起。

估算的限制：

- Claude Code 以外的用量（claude.ai 網頁、手機 App）任何對話都看不到。期間沒有任何對話花費的上升不會算進來；和對話自身花費重疊的部分會算給該對話，所以數字可能略為偏高。
- 花費是依各模型的價格計算，和各模型實際消耗額度的比例不一定相同。
- 占比很小時顯示 `+<1%`。

## 使用條件

- Claude Code **2.1.288 以上**（終端機、桌面 App、VS Code 都可以）。
- **Claude 訂閱帳號**（Pro、Max；Team 實測也可以）。用量數字由 Claude Code 提供，只有訂閱帳號才有。
- **不適用**：API 金鑰、Amazon Bedrock、Google Vertex AI 帳號。這類帳號沒有用量窗口，小貓只會一直睡覺。

本外掛使用 Claude Code 的函式掛鉤（function hooks）API，目前仍是**搶先體驗**，改版時可能變動。更新後小貓不見了，請看[疑難排解](#疑難排解)。

## 安裝

在 Claude Code 裡輸入：

```
/plugin marketplace add Tiange781122/claude-code-usage-pet
/plugin install usage-pet@usage-pet
```

或在終端機（shell）執行：

```
claude plugin marketplace add Tiange781122/claude-code-usage-pet
claude plugin install usage-pet@usage-pet
```

重開 Claude Code（或執行 `/reload-plugins`），小貓就會出現在提示框上方，收到第一則回應前會先睡覺。

更新：`claude plugin update usage-pet@usage-pet`｜停用：`claude plugin disable usage-pet@usage-pet`｜移除：`claude plugin uninstall usage-pet@usage-pet`

## 設定

| 選項 | 可選值 | 預設 | 用途 |
|---|---|---|---|
| `language` | `auto`、`en`、`zh-TW`、`ja` | `auto` | 小貓台詞的語言。`auto` 依系統語系（`LC_ALL`、`LC_MESSAGES`、`LANG`）判斷，判斷不出來用英文。簡體中文環境目前也顯示繁體。 |
| `petStyle` | `auto`、`kaomoji`、`ascii` | `auto` | `kaomoji` 需要有日文字的字型。`auto` 在中文、日文時用 `kaomoji`，其他用 `ascii`。 |
| `timeZone` | `auto` 或 IANA 時區名稱，例如 `Asia/Taipei` | `auto` | 重置時間的時區。`auto` 用這台電腦的時區。 |
| `halfAt` | 1～100 | `50` | 小貓變黃色的用量百分比。 |
| `warnAt` | 1～100 | `80` | 小貓變紅色、開始擔心的百分比。 |
| `outAt` | 1～100 | `95` | 小貓累倒的百分比。 |

### 怎麼切換設定

三種方式擇一：

1. **在 Claude Code 裡**：輸入 `/plugin` → 切到 **Installed** 分頁 → 選 **usage-pet** 按 Enter → 選 **Configure options**。
2. **在 Claude Code 裡**：輸入 `/config`，找 usage-pet 開頭的設定列。
3. **在終端機**：
   ```
   echo '{"petStyle":"ascii","language":"zh-TW"}' | claude plugin configure usage-pet@usage-pet --values-stdin
   ```

改完重開 Claude Code 生效。

## 疑難排解

**看到方塊（□）、問號，或貓臉歪掉**：你的終端機字型沒有顏文字用到的日文字。把 `petStyle` 改成 `ascii`（方法見上），用量條 `█░` 和 `↻` 也會一起換成 ASCII。如果台詞也變成方塊，再把 `language` 改成 `en`。Windows 舊式主控台較常發生；Windows Terminal 和 macOS 終端機通常正常。

**小貓一直在睡覺**：小貓會在這個 session 第一次收到回應時醒來。如果還是一直睡，你的帳號可能沒有用量窗口（API 金鑰、Bedrock、Vertex），本外掛無法使用。

**更新 Claude Code 後小貓不見了**：函式掛鉤 API 還在搶先體驗，可能變動了。先更新外掛（`claude plugin update usage-pet@usage-pet`）；還是不行的話，用 `claude --debug` 啟動，找開頭是 `usage-pet` 的訊息，附上 `claude --version` 開 issue 回報。

## 隱私與成本

- **不多花 token**：不呼叫模型，也不會加進你的提示內容；`claude plugin details usage-pet@usage-pet` 顯示常駐成本約 0 tok。
- **不連網路**：只讀 Claude Code 本來就推送給外掛的用量數字，以及語系環境變數 `LC_ALL`、`LC_MESSAGES`、`LANG`。
- **只寫一個小檔案**：為了估算每個對話的占比，每個對話會把自己的 session ID、花費（美元）和時間寫進外掛自己的儲存檔（`<設定資料夾>/plugins/store/usage-pet_*.json`）。不存其他資料，超過 8 天的紀錄會在下次使用時刪除，檔案不會離開你的電腦。

## 參與貢獻

新增語言：在 `hooks/locales.ts` 加一組翻譯，並把語言代碼加進 `.claude-plugin/plugin.json` 的 `language` 選項，再補一個測試。

檢查修改：

```
claude plugin validate .
claude plugin test .
```

## 致謝

顏文字靈感來自 [not-ai.tools](https://not-ai.tools/kaomoji/cat/) 與 [asciiart.eu](https://www.asciiart.eu/animals/cats)。

## 授權

[MIT](LICENSE)
