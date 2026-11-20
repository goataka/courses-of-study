# エージェント指示

作業を始める前に、[agent-rules](https://github.com/goataka/agent-rules) の [Agent.md](https://github.com/goataka/agent-rules/blob/main/Agent.md) を読み、その手順に従う。

## 目次

- [共通ルール](#共通ルール)
- [リポジトリの目的](#リポジトリの目的)
- [記載の原則](#記載の原則)
- [データとツール](#データとツール)
- [ファイルの大きさ](#ファイルの大きさ)

## 共通ルール

- **参照先**：[agent-rules](https://github.com/goataka/agent-rules)
- **手順**：[ルール一覧](https://github.com/goataka/agent-rules/blob/main/README.md)から、作業内容に該当するルールを**必ず参照**し、従う
- **常に適用**：[ドキュメントルール](https://github.com/goataka/agent-rules/blob/main/rules/documentation.md)と[応答ルール](https://github.com/goataka/agent-rules/blob/main/rules/response.md)
- **優先**：このファイルの内容が共通ルールと異なる場合は、このファイルを優先する

## リポジトリの目的

- **目的**：小学校の学習指導要領の内容を、学習コンテンツやアプリの基礎データとして整理する
- **対象**：国語、社会、算数、理科
- **基準**：小学校学習指導要領 平成29年告示
- **概要**：[README](README.md)

## 記載の原則

- **書く範囲**：学習指導要領に書かれている内容だけを書く
- **書かないもの**：解説、教科書、独自の解釈や補足
- **書き方**：本文の内容を足さず省かずに書き直す
  - 整える点：文末は常体、読点は「、」、全角のかっこは使わない
- **保つもの**：本文の用語、列挙、数値は省かない
- **照合**：書き直した文は原文と照らして確かめる
  - 方法：[原文の確認](docs/data-format.md#原文の確認)
- **不明な点**：確かめられない内容は書かず、未確認として報告する

## データとツール

- **正本**：`data/` の JSON
- **生成物**：`docs/` の教科ごとのページ
  - 注意：生成物は直接編集しない
- **形式**：[データ形式](docs/data-format.md)に従う
- **ID**：本文の番号から決め、付け直さない
- **手順**
  - 準備：`pnpm install`
  - 編集：`data/` の JSON を直す
  - 生成：`pnpm run build`
  - 検査：`pnpm run check`
- **コミット**：データと生成物を同じコミットに含める

## ファイルの大きさ

- **上限**：データと Markdown は、1ファイル300行以内とする
- **検査**：上限は `pnpm run check` が確かめる
- **分割**：上限を超える場合は、教科、学年、領域の順に分ける
- **目次**：Markdown には目次を付ける
