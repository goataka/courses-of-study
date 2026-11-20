import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findBrokenLinks, headingAnchors, type MarkdownFile } from './links.ts';

const INDEX: MarkdownFile = {
  path: 'docs/math/README.md',
  content:
    '# 算数\n\n## 目次\n\n- [第1学年](grade-1.md)\n- [目標](grade-1.md#目標)\n- [トップ](../../README.md)\n',
};
const PAGE: MarkdownFile = {
  path: 'docs/math/grade-1.md',
  content: '# 第1学年\n\n## 目標\n\n## 内容\n',
};
const EXISTING = new Set(['README.md', INDEX.path, PAGE.path]);

test('headingAnchors：同じ見出しには連番を付ける', () => {
  const anchors = headingAnchors(
    '## 内容\n\n### (1) 指導事項\n\n### (1) 指導事項\n',
  );
  assert.deepEqual([...anchors], ['内容', '1-指導事項', '1-指導事項-1']);
});

test('findBrokenLinks：リンク先がそろっていれば問題を返さない', () => {
  assert.deepEqual(findBrokenLinks([INDEX, PAGE], EXISTING), []);
});

interface BrokenCase {
  readonly name: string;
  readonly link: string;
  readonly expected: RegExp;
}

const BROKEN_CASES: readonly BrokenCase[] = [
  {
    name: 'ファイルがない',
    link: '[第2学年](grade-2.md)',
    expected: /リンク先のファイルがない：grade-2\.md/,
  },
  {
    name: '見出しがない',
    link: '[取扱い](grade-1.md#内容の取扱い)',
    expected: /リンク先の見出しがない/,
  },
  {
    name: 'ページ内の見出しがない',
    link: '[用語](#用語)',
    expected: /リンク先の見出しがない：#用語/,
  },
];

for (const brokenCase of BROKEN_CASES) {
  test(`findBrokenLinks：${brokenCase.name}リンクを報告する`, () => {
    const file: MarkdownFile = {
      path: INDEX.path,
      content: `${INDEX.content}- ${brokenCase.link}\n`,
    };
    const problems = findBrokenLinks([file, PAGE], EXISTING);
    assert.equal(problems.length, 1);
    assert.match(problems[0] ?? '', brokenCase.expected);
  });
}

test('findBrokenLinks：外部へのリンクは検査しない', () => {
  const file: MarkdownFile = {
    path: 'README.md',
    content: '- [出典](https://example.com/missing.pdf)\n',
  };
  assert.deepEqual(findBrokenLinks([file], new Set(['README.md'])), []);
});

test('findBrokenLinks：インラインコードの中のリンクは検査しない', () => {
  const file: MarkdownFile = {
    path: 'README.md',
    content: '- **形**：`[番号](コードのURL)`\n',
  };
  assert.deepEqual(findBrokenLinks([file], new Set(['README.md'])), []);
});
