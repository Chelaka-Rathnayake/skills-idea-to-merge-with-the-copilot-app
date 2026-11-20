import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatBookmark,
  generateSlug,
  loadBookmarks,
  normalizeUrl,
  STORAGE_KEY,
} from '../src/lib/bookmarks.js';

test('URLs with and without https normalize to the same saved value', () => {
  assert.equal(normalizeUrl('https://www.example.com'), normalizeUrl('www.example.com'));
  assert.equal(normalizeUrl(' www.example.com '), 'https://www.example.com/');
});

test('loading empty, corrupted, legacy, or non-array values recovers without throwing', () => {
  const invalidValues = [
    null,
    '',
    '{corrupted',
    JSON.stringify({ url: 'https://example.com', slug: 'mona-7fk2' }),
    JSON.stringify(['https://example.com']),
    JSON.stringify([{ originalUrl: 'https://example.com', shortUrl: 'mona-7fk2' }]),
  ];

  for (const value of invalidValues) {
    const storage = { getItem: (key) => (key === STORAGE_KEY ? value : null) };
    assert.doesNotThrow(() => loadBookmarks(storage));
    assert.deepEqual(loadBookmarks(storage), []);
  }
});

test('loading a bookmark array drops malformed records', () => {
  const storage = {
    getItem: () =>
      JSON.stringify([
        { url: 'www.example.com', slug: 'mona-7fk2' },
        { url: 'javascript:alert(1)', slug: 'mona-bad1' },
        { url: 'https://example.com', slug: 'invalid' },
      ]),
  };

  assert.deepEqual(loadBookmarks(storage), [
    { url: 'https://www.example.com/', slug: 'mona-7fk2' },
  ]);
});

test('bookmark formatting uses the exact visible separator', () => {
  assert.equal(
    formatBookmark({ url: 'https://www.example.com/', slug: 'mona-7fk2' }),
    'https://www.example.com/ :: mona-7fk2',
  );
});

test('generated slugs use the mona prefix and four base62 characters', () => {
  assert.match(generateSlug(), /^mona-[0-9A-Za-z]{4}$/);
});
