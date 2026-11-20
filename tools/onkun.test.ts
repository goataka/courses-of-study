import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { KanjiTable } from './kanji.ts';
import { checkOnkun, parseOnkunPage } from './onkun.ts';
import type { OnkunSet } from './onkun.ts';

const TABLE: KanjiTable = {
  total: 2,
  grades: [{ grade: 1, count: 2, cumulative: 2, characters: ['一', '右'] }],
};

const GRADE_1 = {
  path: 'grade-1.md',
  content: [
    '- **字数**：2字',
    '',
    '| 漢字 | 音訓 |',
    '| --- | --- |',
    '| 一 | イチ、イツ、ひと(特) |',
    '| 右 | ウ、みぎ |',
    '',
  ].join('\n'),
};

const LOWER = {
  path: 'lower-secondary-1.md',
  content: [
    '- **字数**：2字',
    '',
    '| 漢字 | 配当学年 | 音訓 |',
    '| --- | --- | --- |',
    '| 亜 | | ア |',
    '| 右 | 1(改) | ユウ(改) |',
    '',
  ].join('\n'),
};

const README = {
  path: 'README.md',
  content: [
    '- **漢字**：3字',
    '- **音訓**：7',
    '  - 小学校：5',
    '  - 中学校：2',
    '  - 高等学校：0',
  ].join('\n'),
};

function setOf(readme = README, lower = LOWER): OnkunSet {
  return {
    readme,
    grades: new Map([[1, parseOnkunPage(GRADE_1).rows]]),
    stages: new Map([
      ['中学校', parseOnkunPage(lower).rows],
      ['高等学校', []],
    ]),
  };
}

test('parseOnkunPage：学年別ページと段階のページを読み取る', () => {
  const grade = parseOnkunPage(GRADE_1);
  const lower = parseOnkunPage(LOWER);
  assert.deepEqual([grade.kind, grade.problems], ['grade', []]);
  assert.deepEqual([lower.kind, lower.problems], ['stage', []]);
  assert.deepEqual(
    lower.rows.map((row) => [row.kanji, row.grade, row.readings]),
    [
      ['亜', undefined, ['ア']],
      ['右', 1, ['ユウ(改)']],
    ],
  );
});

test('parseOnkunPage：音訓の形のずれと、字数のずれを報告する', () => {
  const page = {
    path: 'a.md',
    content: [
      '- **字数**：2字',
      '| 漢字 | 配当学年 | 音訓 |',
      '| --- | --- | --- |',
      '| 亜 | | ア* |',
    ].join('\n'),
  };
  assert.deepEqual(parseOnkunPage(page).problems, [
    'a.md: 音訓の形が正しくない：ア*',
    'a.md: 字数が2字で、表の1字と一致しない',
  ]);
});

test('checkOnkun：件数、並び、配当学年がそろっていれば問題を返さない', () => {
  assert.deepEqual(checkOnkun(setOf(), TABLE), []);
});

test('checkOnkun：件数のずれと、配当学年のずれを報告する', () => {
  const lower = {
    path: 'lower-secondary-1.md',
    content: LOWER.content.replace('| 右 | 1(改) |', '| 右 | 2 |'),
  };
  const readme = {
    path: 'README.md',
    content: README.content.replace('中学校：2', '中学校：3'),
  };
  assert.deepEqual(checkOnkun(setOf(readme, lower), TABLE), [
    '中学校の音訓が3で、表の2と一致しない',
    '中学校のページの右の配当学年が2で、配当表の1と一致しない',
  ]);
});
