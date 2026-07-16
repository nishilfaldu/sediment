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
