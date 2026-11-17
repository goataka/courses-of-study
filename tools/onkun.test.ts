import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { KanjiTable } from './kanji.ts';
import { checkOnkun, parseOnkunPage } from './onkun.ts';

const TABLE: KanjiTable = {
  total: 2,
  grades: [{ grade: 1, count: 2, cumulative: 2, characters: ['一', '右'] }],
};

const HEADER = [
  '| 漢字 | 学年 | 小学校 | 中学校 | 高等学校 |',
  '| --- | --- | --- | --- | --- |',
];
const ONE = '| 一 | 1 | イチ、イツ、ひと(特) | | |';
const RIGHT = '| 右 | 1(改) | ウ、みぎ | ユウ(改) | |';

const PAGE = {
  path: 'table-1.md',
  content: [
    '- **字数**：3字',
    '',
    ...HEADER,
    '| 亜 | | | ア | |',
    ONE,
    RIGHT,
    '',
  ].join('\n'),
};

const GRADE_1 = {
  path: 'grade-1.md',
  content: ['- **字数**：2字', '', ...HEADER, ONE, RIGHT, ''].join('\n'),
};

const README = {
  path: 'README.md',
  content: '- **漢字**：3字\n- **音訓**：7\n',
};

test('parseOnkunPage：漢字、学年、段階ごとの音訓を読み取る', () => {
  const { kanji, problems } = parseOnkunPage(PAGE);
  assert.deepEqual(problems, []);
  assert.deepEqual(
    kanji.map((item) => [
      item.kanji,
      item.grade,
      item.readings.map(({ stage, reading }) => `${stage}:${reading}`),
    ]),
    [
      ['亜', undefined, ['中学校:ア']],
      ['一', 1, ['小学校:イチ', '小学校:イツ', '小学校:ひと(特)']],
      ['右', 1, ['小学校:ウ', '小学校:みぎ', '中学校:ユウ(改)']],
    ],
  );
});

test('parseOnkunPage：音訓の形のずれと、字数のずれを報告する', () => {
  const page = {
    path: 'a.md',
    content: ['- **字数**：2字', ...HEADER, '| 亜 | | | ア* | |'].join('\n'),
  };
  assert.deepEqual(parseOnkunPage(page).problems, [
    'a.md: 音訓の形が正しくない：ア*',
    'a.md: 字数が2字で、表の1字と一致しない',
  ]);
});

test('checkOnkun：合計、配当学年、学年別ページがそろっていれば問題を返さない', () => {
  const grades = new Map([[1, parseOnkunPage(GRADE_1).kanji]]);
  assert.deepEqual(
    checkOnkun(README, parseOnkunPage(PAGE).kanji, grades, TABLE),
    [],
  );
});

test('checkOnkun：学年のずれ、表にない配当漢字、学年別ページのずれを報告する', () => {
  const page = parseOnkunPage({
    path: 'b.md',
    content: [...HEADER, '| 一 | 2 | イチ | | |'].join('\n'),
  }).kanji;
  const readme = {
    path: 'README.md',
    content: '- **漢字**：1字\n- **音訓**：1\n',
  };
  const grades = new Map([[1, parseOnkunPage(GRADE_1).kanji]]);
  assert.deepEqual(checkOnkun(readme, page, grades, TABLE), [
    '一の学年が2で、配当表の1と一致しない',
    '配当表の漢字が表にない：右',
    '第1学年のページの一が、表のページと一致しない',
    '第1学年のページの右が、表のページと一致しない',
  ]);
});
