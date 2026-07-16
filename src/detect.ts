import { asciiBytes } from "@native-sdk/core";
import { EMPTY, bytesEqual, trimAscii, type Bytes } from "./bytes.ts";

export function detectUrl(raw: Bytes): Bytes | null {
  const text = trimAscii(raw);
  if (text.length < 8) return null;
  if (!(text.startsWith(asciiBytes("http://")) || text.startsWith(asciiBytes("https://")))) return null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) return null;
  }
  return text;
}

export function hostnameOf(url: Bytes): Bytes {
  const trimmed = trimAscii(url);
  let start = 0;
  if (trimmed.startsWith(asciiBytes("https://"))) start = 8;
  else if (trimmed.startsWith(asciiBytes("http://"))) start = 7;
  else return EMPTY;

  let end = start;
  while (end < trimmed.length) {
    const c = trimmed[end];
    if (c === 0x2f || c === 0x3f || c === 0x23 || c === 0x3a) break;
    end += 1;
  }
  let host: Bytes = trimmed.subarray(start, end);
  host = stripPrefix(host, asciiBytes("www."));
  host = stripPrefix(host, asciiBytes("m."));
  host = stripPrefix(host, asciiBytes("mobile."));
  return host;
}

function stripPrefix(host: Bytes, prefix: Bytes): Bytes {
  if (host.length <= prefix.length) return host;
  for (let i = 0; i < prefix.length; i++) {
    if (host[i] !== prefix[i]) return host;
  }
  return host.subarray(prefix.length);
}

export function hostEquals(host: Bytes, name: Bytes): boolean {
  return bytesEqual(host, name);
}

export function hostEndsWith(host: Bytes, suffix: Bytes): boolean {
  return host.endsWith(suffix);
}

/** First path segment after the host (`/owner/...` → `owner`). */
export function pathFirstSegment(url: Bytes): Bytes | null {
  let start = 0;
  if (url.startsWith(asciiBytes("https://"))) start = 8;
  else if (url.startsWith(asciiBytes("http://"))) start = 7;
  else return null;
  while (start < url.length && url[start] !== 0x2f) start += 1;
  if (start >= url.length) return null;
  start += 1;
  let end = start;
  while (end < url.length) {
    const c = url[end];
    if (c === 0x2f || c === 0x3f || c === 0x23) break;
    end += 1;
  }
  if (end <= start) return null;
  return url.subarray(start, end);
}

/** Second path segment (`/owner/repo` → `repo`). */
export function pathSecondSegment(url: Bytes): Bytes | null {
  let start = 0;
  if (url.startsWith(asciiBytes("https://"))) start = 8;
  else if (url.startsWith(asciiBytes("http://"))) start = 7;
  else return null;
  while (start < url.length && url[start] !== 0x2f) start += 1;
  if (start >= url.length) return null;
  start += 1; // past host /
  while (start < url.length && url[start] !== 0x2f && url[start] !== 0x3f && url[start] !== 0x23) {
    start += 1;
  }
  if (start >= url.length || url[start] !== 0x2f) return null;
  start += 1;
  let end = start;
  while (end < url.length) {
    const c = url[end];
    if (c === 0x2f || c === 0x3f || c === 0x23) break;
    end += 1;
  }
  if (end <= start) return null;
  return url.subarray(start, end);
}

/** Path segment immediately after `marker` (e.g. `/shorts/`). */
export function pathAfter(url: Bytes, marker: Bytes): Bytes | null {
  for (let i = 0; i + marker.length <= url.length; i++) {
    let match = true;
    for (let j = 0; j < marker.length; j++) {
      if (url[i + j] !== marker[j]) {
        match = false;
        break;
      }
    }
    if (!match) continue;
    const start = i + marker.length;
    let end = start;
    while (end < url.length) {
      const c = url[end];
      if (c === 0x2f || c === 0x3f || c === 0x23) break;
      end += 1;
    }
    if (end > start) return url.subarray(start, end);
    return null;
  }
  return null;
}

/** Query string value for `key`, or null. */
export function queryParam(url: Bytes, key: Bytes): Bytes | null {
  let q = -1;
  for (let i = 0; i < url.length; i++) {
    if (url[i] === 0x3f) {
      q = i + 1;
      break;
    }
  }
  if (q < 0) return null;
  let i = q;
  while (i < url.length) {
    if (url[i] === 0x23) break;
    let eq = i;
    while (eq < url.length && url[eq] !== 0x3d && url[eq] !== 0x26 && url[eq] !== 0x23) eq += 1;
    const name = url.subarray(i, eq);
    if (eq >= url.length || url[eq] !== 0x3d) break;
    let end = eq + 1;
    while (end < url.length && url[end] !== 0x26 && url[end] !== 0x23) end += 1;
    if (bytesEqual(name, key)) return url.subarray(eq + 1, end);
    if (end < url.length && url[end] === 0x26) {
      i = end + 1;
    } else {
      break;
    }
  }
  return null;
}
