import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  emphasize,
  joinBlocks,
  labelledText,
  slug,
  splitSentences,
  tableOfContents,
} from './markdown.ts';

const SLUG_CASES: readonly (readonly [string, string])[] = [
  ['目標', '目標'],
  ['A 数と計算', 'a-数と計算'],
  ['A(4) 除法', 'a4-除法'],
  ['用語・記号', '用語記号'],
  ['(2) 金属、水、空気と温度', '2-金属水空気と温度'],
  ['B 生命・地球', 'b-生命地球'],
];

for (const [title, expected] of SLUG_CASES) {
  test(`slug：「${title}」は「${expected}」になる`, () => {
    assert.equal(slug(title), expected);
  });
}

test('splitSentences：句点で区切り、空の文を除く', () => {
  assert.deepEqual(splitSentences('意味を理解する。余りを知る'), [
    '意味を理解する',
    '余りを知る',
  ]);
});

const EMPHASIZE_CASES: readonly (readonly [
  string,
  readonly string[],
  string,
])[] = [
  ['除法の意味を知る', ['除法'], '**除法**の意味を知る'],
  ['除法と除法の式', ['除法'], '**除法**と除法の式'],
  ['正方形と長方形', ['長方形', '正方形'], '**正方形**と**長方形**'],
  ['円の面積', ['円', '円の面積'], '**円**の面積'],
  ['余りを知る', [], '余りを知る'],
];

for (const [text, keywords, expected] of EMPHASIZE_CASES) {
  test(`emphasize：「${text}」の重要語を太字にする`, () => {
    assert.equal(emphasize(text, keywords), expected);
  });
}

test('labelledText：1文はラベルと同じ行に置く', () => {
  assert.deepEqual(labelledText(1, 'ア(ア)', '除法を知る', ['除法']), [
    '  - **ア(ア)**：**除法**を知る',
  ]);
});

test('labelledText：複数の文はラベルの下に1文ずつ並べる', () => {
  const lines = labelledText(0, 'ア(ア)', '意味を理解する。余りを知る');
  assert.deepEqual(lines, [
    '- **ア(ア)**',
    '  - 意味を理解する',
    '  - 余りを知る',
  ]);
});

test('tableOfContents：最も浅い見出しを基準に字下げする', () => {
  const lines = tableOfContents([
    { level: 2, title: '内容' },
    { level: 3, title: 'A 数と計算' },
  ]);
  assert.deepEqual(lines, ['- [内容](#内容)', '  - [A 数と計算](#a-数と計算)']);
});

test('joinBlocks：空のブロックを除き、空行で区切る', () => {
  assert.equal(
    joinBlocks([['# 題名'], [], ['- 項目', '- 項目']]),
    '# 題名\n\n- 項目\n- 項目\n',
  );
});
