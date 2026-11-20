export const STORAGE_KEY = 'mona-bookmarks';

const SLUG_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SLUG_LENGTH = 4;
const SLUG_PATTERN = /^mona-[0-9A-Za-z]{4}$/;

export function normalizeUrl(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    throw new TypeError('Enter a URL to bookmark.');
  }

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  const looksLikeHostAndPort = /^[^/?#]+:\d+(?:[/?#]|$)/.test(trimmed);
  const candidate = trimmed.startsWith('//')
    ? `https:${trimmed}`
    : hasScheme && !looksLikeHostAndPort
      ? trimmed
      : `https://${trimmed}`;

  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new TypeError('Enter a valid URL.');
  }

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new TypeError('Use a valid HTTP or HTTPS URL.');
  }

  return url.href;
}

export function generateSlug(existingSlugs = []) {
  const existing = new Set(existingSlugs);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(SLUG_LENGTH));
    const suffix = Array.from(bytes, (byte) => SLUG_ALPHABET[byte % SLUG_ALPHABET.length]).join('');
    const slug = `mona-${suffix}`;
    if (!existing.has(slug)) {
      return slug;
    }
  }

  throw new Error('Could not generate a unique bookmark slug.');
}

export function formatBookmark({ url, slug }) {
  return `${url} :: ${slug}`;
}

export function loadBookmarks(storage) {
  const stored = storage.getItem(STORAGE_KEY);
  if (typeof stored !== 'string' || stored.trim() === '') {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((bookmark) => {
    if (
      bookmark === null ||
      typeof bookmark !== 'object' ||
      Array.isArray(bookmark) ||
      typeof bookmark.url !== 'string' ||
      typeof bookmark.slug !== 'string' ||
      !SLUG_PATTERN.test(bookmark.slug)
    ) {
      return [];
    }

    try {
      return [{ url: normalizeUrl(bookmark.url), slug: bookmark.slug }];
    } catch {
      return [];
    }
  });
}

export function saveBookmarks(storage, bookmarks) {
  storage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}
