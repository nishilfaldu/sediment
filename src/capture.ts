import { EMPTY, bytesEqual, decimalBytes, type Bytes } from "./bytes.ts";
import { parseOg, resolveAbsoluteUrl } from "./og.ts";
import { type Item } from "./store.ts";

export interface OgJob {
  readonly id: Bytes;
  readonly url: Bytes;
}

export interface Toast {
  readonly itemId: Bytes;
  readonly sourceUrl: Bytes;
  readonly message: Bytes;
  readonly expiresAt: number;
}

export interface Suppress {
  readonly url: Bytes;
  readonly until: number;
}

export interface IdPair {
  readonly id: Bytes;
  readonly nextId: number;
}

export function nextIdPair(nextId: number): IdPair {
  return { id: decimalBytes(nextId), nextId: nextId + 1 };
}

export function hasUrlOnDay(items: readonly Item[], dayId: Bytes, url: Bytes): boolean {
  for (const it of items) {
    if (it.type === "link" && bytesEqual(it.dayId, dayId) && bytesEqual(it.sourceUrl, url)) {
      return true;
    }
  }
  return false;
}

export function itemsForDay(items: readonly Item[], dayId: Bytes): readonly Item[] {
  return items.filter((it) => bytesEqual(it.dayId, dayId));
}

export function makeLinkItem(id: Bytes, dayId: Bytes, url: Bytes, at: number): Item {
  return {
    id: id,
    dayId: dayId,
    type: "link",
    content: EMPTY,
    sourceUrl: url,
    title: EMPTY,
    description: EMPTY,
    thumbnail: EMPTY,
    createdAt: at,
    updatedAt: at,
  };
}

export function makeNoteItem(id: Bytes, dayId: Bytes, text: Bytes, at: number): Item {
  return {
    id: id,
    dayId: dayId,
    type: "text",
    content: text,
    sourceUrl: EMPTY,
    title: EMPTY,
    description: EMPTY,
    thumbnail: EMPTY,
    createdAt: at,
    updatedAt: at,
  };
}

/** Apply OG meta to the item with `targetId`. Returns null when nothing changed. */
export function itemsWithOg(items: readonly Item[], targetId: Bytes, body: Bytes): readonly Item[] | null {
  if (targetId.length === 0) return null;
  const meta = parseOg(body);
  if (meta.title.length === 0 && meta.description.length === 0 && meta.thumbnail.length === 0) {
    return null;
  }
  let changed = false;
  const next = items.map((it) => {
    if (!bytesEqual(it.id, targetId)) return it;
    changed = true;
    const title = meta.title.length > 0 ? meta.title : it.title;
    const description = meta.description.length > 0 ? meta.description : it.description;
    let thumbnail = it.thumbnail;
    if (meta.thumbnail.length > 0) {
      const absolute = resolveAbsoluteUrl(it.sourceUrl, meta.thumbnail);
      thumbnail = absolute.length > 0 ? absolute : meta.thumbnail;
    }
    return {
      ...it,
      title: title,
      description: description,
      thumbnail: thumbnail,
    };
  });
  return changed ? next : null;
}

export function isSuppressed(suppress: Suppress | null, url: Bytes, at: number): boolean {
  if (suppress === null) return false;
  return bytesEqual(url, suppress.url) && at < suppress.until;
}
