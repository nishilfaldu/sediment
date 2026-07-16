import { asciiBytes } from "@native-sdk/core";
import {
  EMPTY,
  bytesEqualIgnoreCase,
  indexOfBytesIgnoreCase,
  type Bytes,
} from "./bytes.ts";

export interface OgMeta {
  readonly title: Bytes;
  readonly description: Bytes;
  readonly thumbnail: Bytes;
}

const EMPTY_META: OgMeta = {
  title: EMPTY,
  description: EMPTY,
  thumbnail: EMPTY,
};

function isWs(c: number): boolean {
  return c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d;
}

function skipWs(bytes: Bytes, i: number): number {
  let j = i;
  while (j < bytes.length && isWs(bytes[j]!)) {
    j = j + 1;
  }
  return j;
}

/** Decode a few HTML entities common in OG content attributes. */
function decodeBasicEntities(raw: Bytes): Bytes {
  if (raw.length === 0) return EMPTY;
  if (indexOfBytesIgnoreCase(raw, asciiBytes("&"), 0) < 0) return raw;

  // Worst case: output is same length as input (entities only shrink).
  const bytes = new Uint8Array(raw.length);
  let o = 0;
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === 0x26) {
      if (matchAt(raw, i, asciiBytes("&amp;"))) {
        bytes.set(asciiBytes("&"), o);
        o = o + 1;
        i = i + 5;
        continue;
      }
      if (matchAt(raw, i, asciiBytes("&quot;"))) {
        bytes.set(asciiBytes("\""), o);
        o = o + 1;
        i = i + 6;
        continue;
      }
      if (matchAt(raw, i, asciiBytes("&apos;"))) {
        bytes.set(asciiBytes("'"), o);
        o = o + 1;
        i = i + 6;
        continue;
      }
      if (matchAt(raw, i, asciiBytes("&lt;"))) {
        bytes.set(asciiBytes("<"), o);
        o = o + 1;
        i = i + 4;
        continue;
      }
      if (matchAt(raw, i, asciiBytes("&gt;"))) {
        bytes.set(asciiBytes(">"), o);
        o = o + 1;
        i = i + 4;
        continue;
      }
      if (matchAt(raw, i, asciiBytes("&#39;"))) {
        bytes.set(asciiBytes("'"), o);
        o = o + 1;
        i = i + 5;
        continue;
      }
      if (matchAt(raw, i, asciiBytes("&#x27;"))) {
        bytes.set(asciiBytes("'"), o);
        o = o + 1;
        i = i + 6;
        continue;
      }
    }
    bytes.set(raw.subarray(i, i + 1), o);
    o = o + 1;
    i = i + 1;
  }
  return trimBytes(bytes.subarray(0, o));
}

function matchAt(hay: Bytes, at: number, needle: Bytes): boolean {
  if (at + needle.length > hay.length) return false;
  for (let j = 0; j < needle.length; j++) {
    if (hay[at + j] !== needle[j]) return false;
  }
  return true;
}

function trimBytes(raw: Bytes): Bytes {
  let start = 0;
  let end = raw.length;
  while (start < end && isWs(raw[start]!)) start = start + 1;
  while (end > start && isWs(raw[end - 1]!)) end = end - 1;
  if (start === 0 && end === raw.length) return raw;
  if (end <= start) return EMPTY;
  return raw.subarray(start, end);
}

/** Read `attr="..."` or `attr='...'` with optional whitespace around `=`. */
function attrValue(tag: Bytes, attrName: Bytes): Bytes {
  let from = 0;
  while (from < tag.length) {
    const at = indexOfBytesIgnoreCase(tag, attrName, from);
    if (at < 0) return EMPTY;
    if (at > 0) {
      const prev = tag[at - 1]!;
      // Require a boundary so `twitter:image` does not match inside `twitter:image:src`.
      if (
        prev !== 0x20 &&
        prev !== 0x09 &&
        prev !== 0x0a &&
        prev !== 0x0d &&
        prev !== 0x3c
      ) {
        from = at + 1;
        continue;
      }
    }
    let i = skipWs(tag, at + attrName.length);
    if (i >= tag.length || tag[i] !== 0x3d) {
      from = at + 1;
      continue;
    }
    i = skipWs(tag, i + 1);
    if (i >= tag.length) return EMPTY;
    const q = tag[i]!;
    if (q !== 0x22 && q !== 0x27) {
      from = at + 1;
      continue;
    }
    const start = i + 1;
    let end = start;
    while (end < tag.length && tag[end] !== q) {
      end = end + 1;
    }
    if (end >= tag.length) return EMPTY;
    return decodeBasicEntities(tag.subarray(start, end));
  }
  return EMPTY;
}

function findMetaContent(html: Bytes, property: Bytes): Bytes {
  let i = 0;
  while (i < html.length) {
    const tagStart = indexOfBytesIgnoreCase(html, asciiBytes("<meta"), i);
    if (tagStart < 0) break;
    const tagEnd = indexOfBytesIgnoreCase(html, asciiBytes(">"), tagStart);
    if (tagEnd < 0) break;
    const tag = html.subarray(tagStart, tagEnd + 1);

    const prop = attrValue(tag, asciiBytes("property"));
    const name = attrValue(tag, asciiBytes("name"));
    const content = attrValue(tag, asciiBytes("content"));
    if (content.length > 0) {
      if (bytesEqualIgnoreCase(prop, property) || bytesEqualIgnoreCase(name, property)) {
        return content;
      }
    }
    i = tagEnd + 1;
  }
  return EMPTY;
}

function titleTag(html: Bytes): Bytes {
  const open = indexOfBytesIgnoreCase(html, asciiBytes("<title"), 0);
  if (open < 0) return EMPTY;
  const gt = indexOfBytesIgnoreCase(html, asciiBytes(">"), open);
  if (gt < 0) return EMPTY;
  const close = indexOfBytesIgnoreCase(html, asciiBytes("</title>"), gt);
  if (close < 0) return EMPTY;
  return decodeBasicEntities(html.subarray(gt + 1, close));
}

function startsWithAscii(bytes: Bytes, prefix: Bytes): boolean {
  if (bytes.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[i] !== prefix[i]) return false;
  }
  return true;
}

/**
 * Resolve protocol-relative, root-relative, and path-relative URLs against the page URL.
 * Absolute http(s) URLs pass through unchanged.
 */
export function resolveAbsoluteUrl(pageUrl: Bytes, ref: Bytes): Bytes {
  const trimmed = trimBytes(ref);
  if (trimmed.length === 0) return EMPTY;

  if (
    startsWithAscii(trimmed, asciiBytes("https://")) ||
    startsWithAscii(trimmed, asciiBytes("http://"))
  ) {
    return trimmed;
  }

  if (startsWithAscii(trimmed, asciiBytes("//"))) {
    if (startsWithAscii(pageUrl, asciiBytes("http://"))) {
      return concatPrefix(asciiBytes("http:"), trimmed);
    }
    return concatPrefix(asciiBytes("https:"), trimmed);
  }

  const schemeSep = indexOfBytesIgnoreCase(pageUrl, asciiBytes("://"), 0);
  if (schemeSep < 0) return EMPTY;
  let pathStart = schemeSep + 3;
  while (pathStart < pageUrl.length) {
    const c = pageUrl[pathStart]!;
    if (c === 0x2f || c === 0x3f || c === 0x23) break;
    pathStart = pathStart + 1;
  }
  const origin = pageUrl.subarray(0, pathStart);

  if (startsWithAscii(trimmed, asciiBytes("/"))) {
    return concatPrefix(origin, trimmed);
  }

  let basePath: Bytes;
  if (pathStart < pageUrl.length && pageUrl[pathStart] === 0x2f) {
    let end = pageUrl.length;
    const q = indexOfBytesIgnoreCase(pageUrl, asciiBytes("?"), pathStart);
    const h = indexOfBytesIgnoreCase(pageUrl, asciiBytes("#"), pathStart);
    if (q >= 0 && q < end) end = q;
    if (h >= 0 && h < end) end = h;
    basePath = pageUrl.subarray(pathStart, end);
  } else {
    basePath = asciiBytes("/");
  }

  let dirEnd = basePath.length;
  while (dirEnd > 0 && basePath[dirEnd - 1] !== 0x2f) {
    dirEnd = dirEnd - 1;
  }
  const dir = basePath.subarray(0, dirEnd);
  return concat3(origin, dir, trimmed);
}

function concatPrefix(a: Bytes, b: Bytes): Bytes {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function concat3(a: Bytes, b: Bytes, c: Bytes): Bytes {
  const out = new Uint8Array(a.length + b.length + c.length);
  out.set(a, 0);
  out.set(b, a.length);
  out.set(c, a.length + b.length);
  return out;
}

/** Best-effort Open Graph / Twitter / title extraction from an HTML body. */
export function parseOg(html: Bytes): OgMeta {
  // Lightweight JSON bodies (GitHub Accept: json, YouTube oEmbed) — under the
  // 256 KiB Cmd.fetch cap when full HTML is not.
  const jsonTitle = jsonStringField(html, asciiBytes("title"));
  const jsonDesc = jsonStringField(html, asciiBytes("description"));
  if (jsonTitle.length > 0 && indexOfBytesIgnoreCase(html, asciiBytes("<meta"), 0) < 0) {
    return {
      title: jsonTitle,
      description: jsonDesc,
      thumbnail: EMPTY,
    };
  }

  let title = findMetaContent(html, asciiBytes("og:title"));
  if (title.length === 0) title = findMetaContent(html, asciiBytes("twitter:title"));
  if (title.length === 0) title = titleTag(html);
  if (title.length === 0) title = jsonTitle;

  let description = findMetaContent(html, asciiBytes("og:description"));
  if (description.length === 0) description = findMetaContent(html, asciiBytes("twitter:description"));
  if (description.length === 0) description = findMetaContent(html, asciiBytes("description"));
  if (description.length === 0) description = jsonDesc;

  let thumbnail = findMetaContent(html, asciiBytes("og:image"));
  if (thumbnail.length === 0) thumbnail = findMetaContent(html, asciiBytes("og:image:secure_url"));
  if (thumbnail.length === 0) thumbnail = findMetaContent(html, asciiBytes("twitter:image"));
  if (thumbnail.length === 0) thumbnail = findMetaContent(html, asciiBytes("twitter:image:src"));
  if (thumbnail.length === 0) thumbnail = jsonStringField(html, asciiBytes("thumbnail_url"));

  if (title.length === 0 && description.length === 0 && thumbnail.length === 0) {
    return EMPTY_META;
  }
  return { title: title, description: description, thumbnail: thumbnail };
}

/** Pull `"key":"..."` from a JSON object body (oEmbed / GitHub meta). */
function jsonStringField(body: Bytes, key: Bytes): Bytes {
  const needle = new Uint8Array(1 + key.length + 2);
  needle[0] = 0x22; // "
  needle.set(key, 1);
  needle[1 + key.length] = 0x22; // "
  needle[2 + key.length] = 0x3a; // :
  const at = indexOfBytesIgnoreCase(body, needle, 0);
  if (at < 0) return EMPTY;
  let i = skipWs(body, at + needle.length);
  if (i >= body.length || body[i] !== 0x22) return EMPTY;
  i = i + 1;
  const start = i;
  while (i < body.length) {
    const c = body[i]!;
    if (c === 0x22) {
      return decodeBasicEntities(body.subarray(start, i));
    }
    if (c === 0x5c && i + 1 < body.length) {
      i = i + 2;
      continue;
    }
    i = i + 1;
  }
  return EMPTY;
}
