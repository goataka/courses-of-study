import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SAMPLE_KANJI,
  sampleCode,
  sampleDataset,
  type SampleOverrides,
} from './fixtures.ts';
import { checkKanji, validateDataset } from './validate.ts';

test('validateDataset：妥当なデータには問題を返さない', () => {
  assert.deepEqual(validateDataset(sampleDataset({ kanji: SAMPLE_KANJI })), []);
});

interface InvalidCase {
  readonly name: string;
  readonly overrides: SampleOverrides;
  readonly expected: RegExp;
}

const INVALID_CASES: readonly InvalidCase[] = [
  {
    name: 'ID が親の ID で始まらない',
    overrides: { item: { id: 'math-g1-B-1-a-a' } },
    expected: /ID が「math-g1-A-1-」で始まらない/,
  },
  {
    name: 'コードが16桁でない',
    overrides: { item: { code: '123' } },
    expected: /コードの形式が不正/,
  },
  {
    name: 'section に title がない',
    overrides: { unit: { title: '' } },
    expected: /section に title がない/,
  },
  {
    name: 'text も children もない',
    overrides: { item: { text: '' } },
    expected: /text も children もない/,
  },
  {
    name: '末尾に句点がある',
    overrides: { item: { text: '個数を比べる。' } },
    expected: /末尾に「。」がある/,
  },
  {
    name: '全角の括弧を含む',
    overrides: { item: { text: '個数（かず）を比べる' } },
    expected: /全角の開き括弧を含む/,
  },
  {
    name: '重要語が本文にない',
    overrides: { item: { keywords: ['順序'] } },
    expected: /重要語が本文にない：順序/,
  },
  {
    name: '重要語が記号で始まる',
    overrides: { item: { text: '□を使う', keywords: ['□'] } },
    expected: /重要語が文字や数字で始まらない/,
  },
  {
    name: '未知の kind',
    overrides: { item: { kind: 'unknown' as never } },
    expected: /未知の kind：unknown/,
  },
  {
    name: '参照先がない',
    overrides: { handling: { refs: ['math-g1-A-9'] } },
    expected: /参照先が同じページの内容にない：math-g1-A-9/,
  },
  {
    name: 'コードが重複している',
    overrides: { handling: { code: sampleCode(1) } },
    expected: /コードが重複している/,
  },
  {
    name: 'ID が重複している',
    overrides: { handling: { id: 'math-g1-goal-1' } },
    expected: /ID が重複している/,
  },
];

for (const invalidCase of INVALID_CASES) {
  test(`validateDataset：${invalidCase.name}`, () => {
    const problems = validateDataset(sampleDataset(invalidCase.overrides));
    assert.ok(
      problems.some((message) => invalidCase.expected.test(message)),
      problems.join('\n'),
    );
  });
}

test('checkKanji：字数、合計、重複の不一致を報告する', () => {
  const broken = {
    ...SAMPLE_KANJI,
    total: 9,
    grades: [
      { grade: 1, code: SAMPLE_KANJI.code, count: 2, characters: '一右雨' },
      { grade: 2, code: SAMPLE_KANJI.code, count: 2, characters: '一羽' },
    ],
  };
  const problems = checkKanji(broken).join('\n');
  assert.match(problems, /第1学年の字数が count と一致しない/);
  assert.match(problems, /total が字数の合計と一致しない：4/);
  assert.match(problems, /漢字が重複している：一/);
});
