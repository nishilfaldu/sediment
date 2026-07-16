import { asciiBytes } from "@native-sdk/core";
import {
  concatAll,
  decimalBytes,
  parseDecimal,
  type Bytes,
} from "./bytes.ts";

export type ItemType = "link" | "text";

export interface Item {
  readonly id: Bytes;
  readonly dayId: Bytes;
  readonly type: ItemType;
  readonly content: Bytes;
  readonly sourceUrl: Bytes;
  readonly title: Bytes;
  readonly description: Bytes;
  readonly thumbnail: Bytes;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface StoreSnapshot {
  readonly nextId: number;
  readonly items: readonly Item[];
}

const NL = asciiBytes("\n");
const SEP = asciiBytes("\t");
const MAGIC = asciiBytes("sediment-store-v1");

function jsonString(text: Bytes): Bytes {
  let len = 2;
  for (const b of text) {
    if (b === 0x22 || b === 0x5c || b === 0x0a || b === 0x0d || b === 0x09) len += 2;
    else if (b < 0x20) len += 6;
    else len += 1;
  }
  const out = new Uint8Array(len);
  out[0] = 0x22;
  let at = 1;
  for (const b of text) {
    if (b === 0x22 || b === 0x5c) {
      out[at] = 0x5c;
      out[at + 1] = b;
      at += 2;
    } else if (b === 0x0a) {
      out[at] = 0x5c;
      out[at + 1] = 0x6e;
      at += 2;
    } else if (b === 0x0d) {
      out[at] = 0x5c;
      out[at + 1] = 0x72;
      at += 2;
    } else if (b === 0x09) {
      out[at] = 0x5c;
      out[at + 1] = 0x74;
      at += 2;
    } else if (b < 0x20) {
      out[at] = 0x5c;
      out[at + 1] = 0x75;
      out[at + 2] = 0x30;
      out[at + 3] = 0x30;
      out[at + 4] = hexDigit((b >> 4) & 0xf);
      out[at + 5] = hexDigit(b & 0xf);
      at += 6;
    } else {
      out[at] = b;
      at += 1;
    }
  }
  out[at] = 0x22;
  return out;
}

function hexDigit(value: number): number {
  return value < 10 ? 0x30 + value : 0x57 + value;
}

function encodeField(text: Bytes): Bytes {
  // Tab and newline cannot appear raw in our TSV rows — escape as JSON string.
  return jsonString(text);
}

interface DecodedString {
  readonly value: Bytes;
  readonly next: number;
}

function decodeJsonString(b: Bytes, start: number): DecodedString | null {
  if (start >= b.length || b[start] !== 0x22) return null;
  // Measure first so the fill array never escapes mid-mutation.
  let len = 0;
  let i = start + 1;
  while (i < b.length) {
    const c = b[i];
    if (c === 0x22) break;
    if (c === 0x5c) {
      if (i + 1 >= b.length) return null;
      const e = b[i + 1];
      if (e === 0x22 || e === 0x5c || e === 0x2f || e === 0x6e || e === 0x72 || e === 0x74) {
        len += 1;
        i += 2;
      } else if (e === 0x75 && i + 5 < b.length) {
        len += 1;
        i += 6;
      } else {
        return null;
      }
    } else {
      len += 1;
      i += 1;
    }
  }
  if (i >= b.length || b[i] !== 0x22) return null;
  const end = i;

  const out = new Uint8Array(len);
  let at = 0;
  i = start + 1;
  while (i < end) {
    const c = b[i];
    if (c === 0x5c) {
      const e = b[i + 1];
      if (e === 0x22 || e === 0x5c || e === 0x2f) {
        out[at] = e;
        at += 1;
        i += 2;
      } else if (e === 0x6e) {
        out[at] = 0x0a;
        at += 1;
        i += 2;
      } else if (e === 0x72) {
        out[at] = 0x0d;
        at += 1;
        i += 2;
      } else if (e === 0x74) {
        out[at] = 0x09;
        at += 1;
        i += 2;
      } else {
        const h1 = fromHex(b[i + 4]);
        const h2 = fromHex(b[i + 5]);
        out[at] = (h1 << 4) | h2;
        at += 1;
        i += 6;
      }
    } else {
      out[at] = c;
      at += 1;
      i += 1;
    }
  }
  return { value: out, next: end + 1 };
}

function fromHex(c: number): number {
  if (c >= 0x30 && c <= 0x39) return c - 0x30;
  if (c >= 0x61 && c <= 0x66) return c - 0x57;
  if (c >= 0x41 && c <= 0x46) return c - 0x37;
  return -1;
}

function encodeItem(item: Item): Bytes {
  const typeTag = item.type === "link" ? asciiBytes("link") : asciiBytes("text");
  return concatAll([
    encodeField(item.id),
    SEP,
    encodeField(item.dayId),
    SEP,
    encodeField(typeTag),
    SEP,
    decimalBytes(item.createdAt),
    SEP,
    decimalBytes(item.updatedAt),
    SEP,
    encodeField(item.sourceUrl),
    SEP,
    encodeField(item.title),
    SEP,
    encodeField(item.description),
    SEP,
    encodeField(item.content),
    SEP,
    encodeField(item.thumbnail),
    NL,
  ]);
}

export function encodeStore(snapshot: StoreSnapshot): Bytes {
  const parts: Bytes[] = [
    MAGIC,
    NL,
    decimalBytes(snapshot.nextId),
    NL,
    decimalBytes(snapshot.items.length),
    NL,
  ];
  for (const item of snapshot.items) {
    parts.push(encodeItem(item));
  }
  return concatAll(parts);
}

function splitLines(b: Bytes): Bytes[] {
  const lines: Bytes[] = [];
  let start = 0;
  for (let i = 0; i < b.length; i++) {
    if (b[i] === 0x0a) {
      let end = i;
      if (end > start && b[end - 1] === 0x0d) end -= 1;
      lines.push(b.slice(start, end));
      start = i + 1;
    }
  }
  if (start < b.length) lines.push(b.slice(start));
  return lines;
}

function parseItemLine(line: Bytes): Item | null {
  const fields: Bytes[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === 0x22) {
      const decoded = decodeJsonString(line, i);
      if (decoded === null) return null;
      fields.push(decoded.value);
      i = decoded.next;
      if (i < line.length && line[i] === 0x09) i += 1;
      else if (i !== line.length) return null;
    } else {
      // bare decimal field
      let end = i;
      while (end < line.length && line[end] !== 0x09) end += 1;
      fields.push(line.slice(i, end));
      i = end < line.length ? end + 1 : end;
    }
  }
  if (fields.length !== 10) return null;
  const typeRaw = fields[2];
  let itemType: ItemType = "text";
  if (typeRaw.length === 4 && typeRaw[0] === 0x6c) itemType = "link";
  else if (typeRaw.length === 4 && typeRaw[0] === 0x74) itemType = "text";
  else return null;
  const createdAt = parseDecimal(fields[3], 0, fields[3].length);
  const updatedAt = parseDecimal(fields[4], 0, fields[4].length);
  if (createdAt < 0 || updatedAt < 0) return null;
  return {
    id: fields[0],
    dayId: fields[1],
    type: itemType,
    createdAt: createdAt,
    updatedAt: updatedAt,
    sourceUrl: fields[5],
    title: fields[6],
    description: fields[7],
    content: fields[8],
    thumbnail: fields[9],
  };
}

export function decodeStore(bytes: Bytes): StoreSnapshot | null {
  const lines = splitLines(bytes);
  if (lines.length < 3) return null;
  if (lines[0].length !== MAGIC.length) return null;
  for (let i = 0; i < MAGIC.length; i++) {
    if (lines[0][i] !== MAGIC[i]) return null;
  }
  const nextId = parseDecimal(lines[1], 0, lines[1].length);
  const count = parseDecimal(lines[2], 0, lines[2].length);
  if (nextId < 0 || count < 0) return null;
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    if (3 + i >= lines.length) return null;
    const line = lines[3 + i];
    const item = parseItemLine(line);
    if (item === null) return null;
    items.push(item);
  }
  return { nextId: nextId, items: items };
}
