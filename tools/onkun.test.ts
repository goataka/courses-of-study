import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { KanjiTable } from './kanji.ts';
import { checkOnkun, parseOnkunPage } from './onkun.ts';

const TABLE: KanjiTable = {
  total: 2,
  grades: [{ grade: 1, count: 2, cumulative: 2, characters: ['一', '右'] }],
};

const PAGE = {
  path: 'table-1.md',
  content: [
    '- **字数**：3字',
    '',
    '- **亜**：ア 中',
    '- **一** 第1学年：イチ 小、イツ 小、ひと 小 特',
    '- **右** 第1学年 改：ウ 小、ユウ 小 改、みぎ 小',
  ].join('\n'),
};

const README = {
  path: 'README.md',
  content: '- **漢字**：3字\n- **音訓**：7\n',
};

test('parseOnkunPage：漢字、学年、音訓を読み取る', () => {
  const { kanji, problems } = parseOnkunPage(PAGE);
  assert.deepEqual(problems, []);
  assert.deepEqual(
    kanji.map((item) => [item.kanji, item.grade, item.readings.length]),
    [
      ['亜', undefined, 1],
      ['一', 1, 3],
      ['右', 1, 3],
    ],
  );
});

test('parseOnkunPage：段階のない音訓と、字数のずれを報告する', () => {
  const page = { path: 'a.md', content: '- **字数**：2字\n- **亜**：ア\n' };
  assert.deepEqual(parseOnkunPage(page).problems, [
    'a.md: 音訓の形が正しくない：ア',
    'a.md: 字数が2字で、漢字の行の1字と一致しない',
  ]);
});

test('checkOnkun：合計と配当学年がそろっていれば問題を返さない', () => {
  assert.deepEqual(checkOnkun(README, parseOnkunPage(PAGE).kanji, TABLE), []);
});

test('checkOnkun：学年のずれと、表にない配当漢字を報告する', () => {
  const kanji = [{ kanji: '一', grade: 2, readings: ['イチ 小'] }];
  const readme = {
    path: 'README.md',
    content: '- **漢字**：1字\n- **音訓**：1\n',
  };
  assert.deepEqual(checkOnkun(readme, kanji, TABLE), [
    '一の学年が2で、配当表の1と一致しない',
    '配当表の漢字が表にない：右',
  ]);
});
