# データ形式

`data/` に置く JSON の形と、ID の決まりをまとめる

## 目次

- [ファイル構成](#ファイル構成)
- [学年ファイル](#学年ファイル)
- [教科ファイル](#教科ファイル)
- [項目](#項目)
- [種別と柱](#種別と柱)
- [IDの決まり](#idの決まり)
- [漢字配当表](#漢字配当表)
- [原文の確認](#原文の確認)
- [アプリからの利用](#アプリからの利用)

## ファイル構成

- **`data/catalog.json`**：データファイルの一覧と出典
- **`data/<教科ID>/subject.json`**：教科の目標、指導計画の作成と内容の取扱い
- **`data/<教科ID>/grade-<学年>.json`**：学年の目標、内容、内容の取扱い
- **`data/japanese/kanji.json`**：学年別漢字配当表
- **教科ID**：`japanese`、`social-studies`、`math`、`science`
- **型定義**：[tools/model.ts](../tools/model.ts)
- **書式**：`pnpm run build` が正規の書式に整える

## 学年ファイル

- **`id`**：ページID
  - 例：`math-g3`
- **`subject`**：教科ID
- **`grades`**：対象の学年
  - 補足：国語は2学年のまとまり
- **`name`**：学年の呼び名
- **`code`**：学習指導要領コード
- **`goalsText`**：目標の前文
  - 補足：前文がある教科だけが持つ
- **`goals`**：目標の項目
- **`contents`**：内容の項目
- **`handling`**：内容の取扱いの項目
  - 補足：内容の取扱いがある学年だけが持つ

## 教科ファイル

- **`id`**：教科ID
- **`name`**：教科名
- **`code`**：学習指導要領コード
- **`section`**：学習指導要領での章と節
- **`goalsText`**：教科の目標の前文
- **`goals`**：教科の目標の項目
- **`planning`**：指導計画の作成と内容の取扱いの項目

## 項目

- **`id`**：リポジトリ内で一意なID
- **`code`**：学習指導要領コード
- **`no`**：本文の項目番号
  - 例：`A`、`(4)`、`ア(ア)`
  - 補足：番号がない項目は空文字
- **`kind`**：種別
- **`title`**：まとまりの見出し
  - 補足：本文の語句から取る
- **`text`**：本文に沿って書き直した文
  - 補足：原文の文言ではない
- **`category`**：資質・能力の柱
- **`keywords`**：`text` に含まれる重要語
- **`refs`**：内容の取扱いが対象とする内容のID
- **`ruby`**：振り仮名付きの表記
  - 例：`聖武《しょうむ》天皇`
- **`children`**：下位の項目

## 種別と柱

- **`kind`**
  - `section`：領域や単元などのまとまり
  - `item`：身に付ける事項
  - `activity`：数学的活動や言語活動の例
  - `term`：用語、記号、人物名
  - `goal`：目標
  - `handling`：内容の取扱い
  - `planning`：指導計画の作成と内容の取扱い
- **`category`**
  - `knowledge`：知識及び技能
  - `thinking`：思考力、判断力、表現力等
  - `attitude`：学びに向かう力、人間性等

## IDの決まり

- **形**：ページID の後ろに、本文の番号を `-` でつなぐ
- **ページID**：`<教科ID>-g<学年>`
  - 例：`math-g3`、`japanese-g12`
- **番号の表し方**
  - 領域：`A` から `D` をそのまま使う
  - かっこ付きの数字：数字だけにする
  - 片仮名：ローマ字にする
  - 対応：ア `a`、イ `i`、ウ `u`、エ `e`、オ `o`、カ `ka`、キ `ki`、ク `ku`、ケ `ke`、コ `ko`、サ `sa`、シ `shi`
  - 丸数字：数字だけにする
- **例**
  - `math-g3-A-4`：算数 第3学年 A(4)
  - `math-g3-A-4-a-a`：算数 第3学年 A(4)ア(ア)
  - `science-g3-A-1-i`：理科 第3学年 A(1)イ
  - `social-studies-g6-2-a-shi`：社会 第6学年 (2)ア(シ)
- **国語**
  - `K`：〔知識及び技能〕
  - 例：`japanese-g12-K-1-e` は (1)エ、`japanese-g12-A-2-a` は A(2)ア
- **算数**
  - `activity`：数学的活動
  - `terms`：用語・記号
  - 補足：`terms` の後ろには、掲載順の連番を付ける
- **目標**：`<ページID>-goal-<番号>`
- **内容の取扱い**：`<ページID>-handling-<番号>`
- **教科の目標**：`<教科ID>-goal-<番号>`
- **指導計画**：`<教科ID>-planning-<番号>`
- **安定性**：ID は本文の番号から決まるため、`text` を直しても変わらない

## 漢字配当表

- **`total`**：総字数
- **`grades`**：学年ごとの配当
  - `grade`：学年
  - `code`：学習指導要領コード
  - `count`：字数
  - `characters`：配当漢字を別表の掲載順に並べた文字列
- **載せないもの**：読みや画数
  - 理由：学習指導要領の別表にないため
- **ある学年までの漢字**：その学年以下の `characters` をつなぐ

## 原文の確認

- **`text`**：本文に沿って書き直した文であり、原文そのものではない
- **原文**：`https://w3id.org/jp-cos/<code>` で確認できる
- **コードの出典**：[学習指導要領コード](https://www.mext.go.jp/a_menu/other/data_00002.htm)
  - 発行：文部科学省
- **コードの参照元**：[学習指導要領LOD](https://jp-cos.github.io/)
  - 利用条件：クリエイティブ・コモンズ 表示 4.0
- **本文の出典**：[小学校学習指導要領 平成29年告示](https://www.mext.go.jp/content/1413522_001.pdf)

## アプリからの利用

- **入口**：`data/catalog.json` の `subjects` から、各ファイルの `path` をたどる
- **学習事項の一覧**：`contents` をたどり、`kind` が `item` の項目を集める
- **内容の取扱い**：`handling` の `refs` で、対象の内容と結び付ける
- **型**：[tools/model.ts](../tools/model.ts) の型を利用できる

```ts
import { readFileSync } from 'node:fs';

import { flattenNodes, type GradePage } from './tools/model.ts';

const page = JSON.parse(readFileSync('data/math/grade-3.json', 'utf8')) as GradePage;
const items = flattenNodes(page.contents).filter((node) => node.kind === 'item');
```
