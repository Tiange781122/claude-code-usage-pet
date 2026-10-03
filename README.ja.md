# Claude Code Usage Pet

[English](README.md) | [繁體中文](README.zh-TW.md) | 日本語

Claude Code のプロンプトの上に住む小さな猫が、利用上限を見守ります。5 時間枠と週間枠にそれぞれ 1 匹ずつ猫がいて、使うほど表情が疲れていきます。

```
5h  █████░░░░░░░    42% (+25%)  ↻18:10            (=^･ω･^=)ﾉ 「元気いっぱいにゃ」
週  ████████████    96% (+2%)   ↻10/5 18:00       (=ｘェｘ=) 「今週はもう限界にゃ…」
```

バーの青い部分と青い `(+25%)` は、この会話が使った分です（[下記](#この会話の使用量)参照）。

日本語フォントがないターミナル向けの ASCII スタイル（猫の顔とバーが ASCII になります。セリフも四角になる場合は言語を `en` にしてください）：

```
5h  [#####-------]  42% (+25%)  reset 18:10       (=^.^=)/ 「元気いっぱいにゃ」
週  [############]  96% (+2%)   reset 10/5 18:00  (=x.x=) 「今週はもう限界にゃ…」
```

> 本プロジェクトは Anthropic の公式プロジェクトではありません。「Claude」「Claude Code」は Anthropic の商標です。

## 表示内容

| 使用量 | 猫 | 色 |
|---|---|---|
| データ待ち | `(=^-ω-^=) zZ`／`(=^-.-^=) zZ` | グレー |
| 50% 未満 | `(=^･ω･^=)ﾉ`／`(=^.^=)/` | 緑 |
| 50～79% | `(=^･ｪ･^=)`／`(=o.o=)` | 黄 |
| 80～94% | `(= ; ｪ ; =)`／`(=;.;=)` | 赤 |
| 95% 以上 | `(=ｘェｘ=)`／`(=x.x=)` | 赤 |

しきい値は変更できます。リセット時刻はお使いの PC のタイムゾーンで表示されます。

バーには、この会話が使った分を示す**青い部分**と**青い `(+N%)`** もあります（GitHub 上の例では色を表示できません）。詳しくは[この会話の使用量](#この会話の使用量)をご覧ください。

## この会話の使用量

複数の Claude Code セッションを同時に開いているとき、各セッションはアカウントの使用量のうち自分が使った分を、青い `(+N%)` とバーの青い部分で表示します。

Claude Code が提供するのはアカウント全体の割合だけなので、これは**推定値**です。各セッションが自分の利用額を記録し、アカウントの割合が増えるたびに、その間の各セッションの利用額の比率で按分します。セッション開始時とリセット時にゼロから数え直します。

推定の限界：

- Claude Code 以外での利用（claude.ai、モバイルアプリ）はどのセッションからも見えません。どのセッションも利用していない間の増加は計上しませんが、セッション自身の利用と重なった分はそのセッションに計上されるため、やや多めに出ることがあります。
- 利用額はモデルごとの価格で計算されるため、各モデルが上限に与える影響とは比率が異なる場合があります。
- ごく小さい割合は `+<1%` と表示します。

## 動作条件

- Claude Code **2.1.288 以降**（ターミナル、デスクトップアプリ、VS Code）。
- **Claude のサブスクリプション**（Pro、Max。Team でも動作を確認済み）。使用量の数値は Claude Code が提供するもので、サブスクリプションのアカウントでのみ取得できます。
- **対象外**：API キー、Amazon Bedrock、Google Vertex AI のアカウント。使用量の枠がないため、猫は眠ったままになります。

本プラグインは Claude Code の function hooks API を使っています。この API はまだ**アーリーアクセス**で、リリースごとに変わる可能性があります。更新後に猫が消えた場合は[トラブルシューティング](#トラブルシューティング)をご覧ください。

## インストール

Claude Code 内で：

```
/plugin marketplace add Tiange781122/claude-code-usage-pet
/plugin install usage-pet@usage-pet
```

またはシェルから：

```
claude plugin marketplace add Tiange781122/claude-code-usage-pet
claude plugin install usage-pet@usage-pet
```

Claude Code を再起動（または `/reload-plugins`）すると、プロンプトの上に猫が現れます。最初の応答が届くまでは眠っています。

更新：`claude plugin update usage-pet@usage-pet`｜無効化：`claude plugin disable usage-pet@usage-pet`｜削除：`claude plugin uninstall usage-pet@usage-pet`

## 設定

| オプション | 値 | 既定 | 内容 |
|---|---|---|---|
| `language` | `auto`、`en`、`zh-TW`、`ja` | `auto` | 猫のセリフの言語。`auto` はシステムのロケール（`LC_ALL`、`LC_MESSAGES`、`LANG`）に従い、判定できなければ英語。中国語のロケールは現在すべて繁体字になります。 |
| `petStyle` | `auto`、`kaomoji`、`ascii` | `auto` | `kaomoji` は日本語を含むフォントが必要です。`auto` は中国語・日本語なら `kaomoji`、それ以外は `ascii`。 |
| `timeZone` | `auto` または `Asia/Tokyo` などの IANA 名 | `auto` | リセット時刻のタイムゾーン。`auto` はこの PC の設定。 |
| `halfAt` | 1～100 | `50` | 猫が黄色になる使用率。 |
| `warnAt` | 1～100 | `80` | 猫が赤くなり心配し始める使用率。 |
| `outAt` | 1～100 | `95` | 猫が力尽きる使用率。 |

### 設定の変え方

いずれか 1 つ：

1. **Claude Code 内**：`/plugin` → **Installed** タブ → **usage-pet** を選んで Enter → **Configure options**。
2. **Claude Code 内**：`/config` を開き、usage-pet の行を探す。
3. **シェルから**：
   ```
   echo '{"petStyle":"ascii","language":"ja"}' | claude plugin configure usage-pet@usage-pet --values-stdin
   ```

変更後、Claude Code を再起動すると反映されます。

## トラブルシューティング

**四角（□）や「?」が出る、猫の顔がずれる**：ターミナルのフォントに顔文字の文字がありません。`petStyle` を `ascii` にしてください（方法は上記）。バーの `█░` と `↻` も ASCII に置き換わります。セリフも四角になる場合は `language` を `en` にしてください。古い Windows コンソールで起きやすく、Windows Terminal や macOS のターミナルでは通常問題ありません。

**猫がずっと眠っている**：セッションで最初の応答が届くと目を覚まします。それでも眠ったままなら、使用量の枠がないアカウント（API キー、Bedrock、Vertex）の可能性があり、本プラグインは使えません。

**Claude Code の更新後に猫が消えた**：function hooks API はアーリーアクセスのため、変更された可能性があります。まずプラグインを更新し（`claude plugin update usage-pet@usage-pet`）、それでも直らなければ `claude --debug` で起動して `usage-pet` で始まる行を確認し、`claude --version` を添えて issue を立ててください。

## プライバシーとコスト

- **トークンを追加で消費しません**：モデルを呼び出さず、プロンプトにも何も追加しません。`claude plugin details usage-pet@usage-pet` の常時コストは約 0 tok です。
- **ネットワーク通信なし**：Claude Code がプラグインに渡す使用量の数値と、ロケール変数 `LC_ALL`、`LC_MESSAGES`、`LANG` だけを読みます。
- **小さなローカルファイルを 1 つだけ書きます**：会話ごとの割合を推定するため、各セッションはセッション ID、利用額（米ドル）、時刻をプラグイン専用の保存ファイル（`<設定フォルダ>/plugins/store/usage-pet_*.json`）に書き込みます。それ以外は保存せず、8 日より古い記録は次回の利用時に削除され、ファイルが PC の外に出ることはありません。

## コントリビュート

言語の追加：`hooks/locales.ts` に 1 件追加し、その言語コードを `.claude-plugin/plugin.json` の `language` の選択肢に加え、テストを追加してください。

変更の確認：

```
claude plugin validate .
claude plugin test .
```

## クレジット

顔文字は [not-ai.tools](https://not-ai.tools/kaomoji/cat/) と [asciiart.eu](https://www.asciiart.eu/animals/cats) を参考にしています。

## ライセンス

[MIT](LICENSE)
