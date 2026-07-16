// Sediment core — local-first daily board for links and notes.
// Entry module: Model, Msg, update, subscriptions, binding helpers.

import { Cmd, Sub, asciiBytes, type EnvMsg } from "@native-sdk/core";
import { type TextInputEvent } from "@native-sdk/core/text";
import { type ChromeButtons, type ChromeInsets, type FrameEvent } from "@native-sdk/core/events";
import {
  EMPTY,
  bytesEqual,
  concat2,
  concat3,
  containsIgnoreCaseAscii,
  decimalBytes,
  trimAscii,
  type Bytes,
} from "./bytes.ts";
import {
  hasUrlOnDay,
  isSuppressed,
  itemsForDay,
  itemsWithOg,
  makeLinkItem,
  makeNoteItem,
  nextIdPair,
  type OgJob,
  type Suppress,
  type Toast,
} from "./capture.ts";
import { detectUrl } from "./detect.ts";
import { applyField, fieldInit, type FieldDraft } from "./field.ts";
import {
  decodeStore,
  encodeStore,
  type Item,
  type StoreSnapshot,
} from "./store.ts";
import {
  domainLabel,
  formatDayHeading,
  formatDaySidebar,
  isVideoTag,
  linkDisplayTitle,
  linkTagLabel,
  metaFetchUrl,
  resolveThumbnailUrl,
} from "./tags.ts";

export type Tab = "links" | "notes";

export interface DayRow {
  readonly id: Bytes;
  readonly count: number;
  readonly label: Bytes;
  readonly selected: boolean;
}

export interface CardRow {
  readonly id: Bytes;
  readonly tag: Bytes;
  readonly title: Bytes;
  readonly subtitle: Bytes;
  readonly url: Bytes;
  readonly domain: Bytes;
  readonly imageId: number;
  readonly isLink: boolean;
  readonly hasSubtitle: boolean;
  readonly hasUrlLine: boolean;
  readonly hasImage: boolean;
  readonly hasDomain: boolean;
  readonly isVideo: boolean;
  /** Still waiting on OG (show skeleton like Electron). */
  readonly awaitingMeta: boolean;
  /** Electron footer: specimen tag when there is no thumbnail. */
  readonly showTagFooter: boolean;
  /** Electron footer: domain when thumbnail is present and not video. */
  readonly showDomainFooter: boolean;
}

export interface ThumbJob {
  readonly id: Bytes;
  readonly url: Bytes;
  readonly imageId: number;
}

export interface SearchHit {
  readonly id: Bytes;
  readonly dayId: Bytes;
  readonly label: Bytes;
  readonly detail: Bytes;
}

export interface Model {
  readonly ready: boolean;
  readonly home: Bytes;
  readonly todayId: Bytes;
  readonly currentDayId: Bytes;
  readonly tab: Tab;
  readonly nextId: number;
  readonly items: readonly Item[];
  readonly lastClipboard: Bytes;
  readonly pendingUrl: Bytes;
  readonly pendingNote: Bytes;
  readonly pendingSuppressUrl: Bytes;
  readonly suppress: Suppress | null;
  readonly toast: Toast | null;
  readonly searchOpen: boolean;
  readonly noteDraft: FieldDraft;
  readonly searchDraft: FieldDraft;
  readonly chromeLeading: number;
  readonly headerHeight: number;
  readonly boardWidth: number;
  readonly dirty: boolean;
  /** FIFO of OG fetches. Index 0 is in flight (or about to be). */
  readonly ogQueue: readonly OgJob[];
  /** FIFO of thumbnail image fetches (after OG resolves a URL). */
  readonly thumbQueue: readonly ThumbJob[];
  /** ImageId the in-flight thumb fetch will register (Zig reads this). */
  readonly pendingThumbImageId: number;
  /** Next canvas image slot to allocate (1..15). */
  readonly nextImageSlot: number;
  /** itemId → registered ImageId for visible cards. */
  readonly imageByItem: readonly ImageSlot[];
}

export interface ImageSlot {
  readonly id: Bytes;
  readonly imageId: number;
}

const MAX_DRAFT = 8000;
const MAX_SEARCH = 200;
const CLIPBOARD_MS = 500;
const TOAST_MS = 8000;
const AUTOSAVE_MS = 600;
const SUPPRESS_MS = 30000;
const HEADER_HEIGHT_MIN = 52;
const STORE_REL = asciiBytes("/Library/Application Support/Sediment/store.v1");

export type Msg =
  | { readonly kind: "home_env"; readonly value: Bytes }
  | { readonly kind: "today_ok"; readonly code: number; readonly stdout: Bytes }
  | { readonly kind: "today_err"; readonly reason: Bytes }
  | { readonly kind: "store_loaded"; readonly body: Bytes }
  | { readonly kind: "store_missing"; readonly reason: Bytes }
  | { readonly kind: "store_wrote" }
  | { readonly kind: "store_write_failed"; readonly reason: Bytes }
  | { readonly kind: "save_now"; readonly at: number }
  | { readonly kind: "clipboard_tick"; readonly at: number }
  | { readonly kind: "clipboard_text"; readonly text: Bytes }
  | { readonly kind: "clipboard_failed"; readonly reason: Bytes }
  | { readonly kind: "capture_at"; readonly at: number }
  | { readonly kind: "note_at"; readonly at: number }
  | { readonly kind: "suppress_at"; readonly at: number }
  | { readonly kind: "toast_tick"; readonly at: number }
  | { readonly kind: "set_tab_links" }
  | { readonly kind: "set_tab_notes" }
  | { readonly kind: "select_day"; readonly id: Bytes }
  | { readonly kind: "go_today" }
  | { readonly kind: "open_search" }
  | { readonly kind: "close_search" }
  | { readonly kind: "note_edit"; readonly text: TextInputEvent }
  | { readonly kind: "search_edit"; readonly text: TextInputEvent }
  | { readonly kind: "add_note" }
  | { readonly kind: "delete_item"; readonly id: Bytes }
  | { readonly kind: "undo_capture" }
  | { readonly kind: "dismiss_toast" }
  | { readonly kind: "open_item"; readonly id: Bytes }
  | { readonly kind: "open_done"; readonly code: number; readonly stdout: Bytes }
  | { readonly kind: "open_failed"; readonly reason: Bytes }
  | { readonly kind: "go_search_hit"; readonly id: Bytes }
  | {
      readonly kind: "chrome_changed";
      readonly insets: ChromeInsets;
      readonly buttons: ChromeButtons;
      readonly tabsProjected: boolean;
    }
  | { readonly kind: "og_ok"; readonly status: number; readonly body: Bytes }
  | { readonly kind: "og_err"; readonly reason: Bytes }
  | { readonly kind: "thumb_ok"; readonly status: number; readonly body: Bytes }
  | { readonly kind: "thumb_err"; readonly reason: Bytes }
  | { readonly kind: "board_resized"; readonly width: number };

export const viewUnbound = [
  "home_env",
  "today_ok",
  "today_err",
  "store_loaded",
  "store_missing",
  "store_wrote",
  "store_write_failed",
  "save_now",
  "clipboard_tick",
  "clipboard_text",
  "clipboard_failed",
  "capture_at",
  "note_at",
  "suppress_at",
  "toast_tick",
  "open_done",
  "open_failed",
  "og_ok",
  "og_err",
  "thumb_ok",
  "thumb_err",
  "board_resized",
  "chrome_changed",
  "home",
  "ready",
  "todayId",
  "currentDayId",
  "tab",
  "nextId",
  "items",
  "lastClipboard",
  "pendingUrl",
  "pendingNote",
  "pendingSuppressUrl",
  "suppress",
  "dirty",
  "ogQueue",
  "thumbQueue",
  "pendingThumbImageId",
  "nextImageSlot",
  "imageByItem",
  "noteDraft",
  "searchDraft",
  "chromeLeading",
  "headerHeight",
  "boardWidth",
] as const;

export const envMsgs = [{ env: "HOME", msg: "home_env" }] as const satisfies readonly EnvMsg<Msg>[];

export const chromeMsg = "chrome_changed";

export function frameMsg(model: Model, frame: FrameEvent): Msg | null {
  // Compare as whole points; avoid Math.floor (NS1016 float/int clash).
  const width = frame.width;
  if (width === model.boardWidth) return null;
  return { kind: "board_resized", width: width };
}

function storePath(home: Bytes): Bytes {
  return concat2(home, STORE_REL);
}

function emptyModel(): Model {
  const placeholder = asciiBytes("1970-01-01");
  return {
    ready: false,
    home: EMPTY,
    todayId: placeholder,
    currentDayId: placeholder,
    tab: "links",
    nextId: 1,
    items: [],
    lastClipboard: EMPTY,
    pendingUrl: EMPTY,
    pendingNote: EMPTY,
    pendingSuppressUrl: EMPTY,
    suppress: null,
    toast: null,
    searchOpen: false,
    noteDraft: fieldInit(),
    searchDraft: fieldInit(),
    chromeLeading: 78,
    headerHeight: HEADER_HEIGHT_MIN,
    boardWidth: 1120,
    dirty: false,
    ogQueue: [],
    thumbQueue: [],
    pendingThumbImageId: 0,
    nextImageSlot: 1,
    imageByItem: [],
  };
}

export function initialModel(): Model {
  return emptyModel();
}

function concatHay(parts: readonly Bytes[]): Bytes {
  let total = 0;
  for (const p of parts) total += p.length + 1;
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
    out[at] = 0x20;
    at += 1;
  }
  return out;
}

export function dayRows(model: Model): readonly DayRow[] {
  const mapIds: Bytes[] = [];
  const mapCounts: number[] = [];
  for (const it of model.items) {
    let idx = -1;
    for (let i = 0; i < mapIds.length; i++) {
      if (bytesEqual(mapIds[i], it.dayId)) {
        idx = i;
        break;
      }
    }
    if (idx < 0) {
      mapIds.push(it.dayId);
      mapCounts.push(1);
    } else {
      mapCounts[idx] = mapCounts[idx] + 1;
    }
  }

  let hasToday = false;
  for (const id of mapIds) {
    if (bytesEqual(id, model.todayId)) {
      hasToday = true;
      break;
    }
  }
  if (!hasToday) {
    mapIds.push(model.todayId);
    mapCounts.push(0);
  }

  const rows: DayRow[] = [];
  for (let i = 0; i < mapIds.length; i++) {
    if (!bytesEqual(mapIds[i], model.todayId)) continue;
    rows.push({
      id: mapIds[i],
      count: mapCounts[i],
      label: formatDaySidebar(mapIds[i], model.todayId),
      selected: bytesEqual(mapIds[i], model.currentDayId),
    });
  }
  for (let i = 0; i < mapIds.length; i++) {
    if (bytesEqual(mapIds[i], model.todayId)) continue;
    rows.push({
      id: mapIds[i],
      count: mapCounts[i],
      label: formatDaySidebar(mapIds[i], model.todayId),
      selected: bytesEqual(mapIds[i], model.currentDayId),
    });
  }
  return rows;
}

/** Canvas image registry has 16 slots; we use 1..15 for fetched thumbs. */
const IMAGE_SLOT_MAX = 15;

interface AllocImage {
  readonly imageId: number;
  readonly nextImageSlot: number;
  readonly imageByItem: readonly ImageSlot[];
}

/**
 * Allocate the next canvas ImageId (1..15). Reusing a slot clears any prior
 * item mapping that pointed at it — avoids colliding art when many cards share ids.
 */
function allocImageSlot(
  nextImageSlot: number,
  imageByItem: readonly ImageSlot[],
  itemId: Bytes,
): AllocImage {
  const imageId = nextImageSlot;
  let nextSlot = imageId + 1;
  if (nextSlot > IMAGE_SLOT_MAX) nextSlot = 1;

  const next: ImageSlot[] = [];
  for (const slot of imageByItem) {
    if (bytesEqual(slot.id, itemId)) continue;
    if (slot.imageId === imageId) continue;
    next.push(slot);
  }
  return {
    imageId: imageId,
    nextImageSlot: nextSlot,
    imageByItem: next,
  };
}

function lookupImageId(slots: readonly ImageSlot[], id: Bytes): number {
  for (const slot of slots) {
    if (bytesEqual(slot.id, id)) return slot.imageId;
  }
  return 0;
}

function upsertImageSlot(slots: readonly ImageSlot[], id: Bytes, imageId: number): readonly ImageSlot[] {
  const next: ImageSlot[] = [];
  let found = false;
  for (const slot of slots) {
    if (bytesEqual(slot.id, id)) {
      next.push({ id: id, imageId: imageId });
      found = true;
    } else if (slot.imageId === imageId) {
      // Slot reuse: drop the previous owner of this ImageId.
      continue;
    } else {
      next.push(slot);
    }
  }
  if (!found) next.push({ id: id, imageId: imageId });
  return next;
}

function isAwaitingOg(model: Model, itemId: Bytes): boolean {
  for (const job of model.ogQueue) {
    if (bytesEqual(job.id, itemId)) return true;
  }
  return false;
}

export function visibleCards(model: Model): readonly CardRow[] {
  const dayItems = itemsForDay(model.items, model.currentDayId);
  const filtered =
    model.tab === "links"
      ? dayItems.filter((it) => it.type === "link")
      : dayItems.filter((it) => it.type === "text");

  return filtered.map((it) => {
    if (it.type === "link") {
      const title = linkDisplayTitle(it.sourceUrl, it.title);
      const hasSubtitle = it.description.length > 0;
      const tag = linkTagLabel(it.sourceUrl);
      const imageId = lookupImageId(model.imageByItem, it.id);
      const domain = domainLabel(it.sourceUrl);
      const hasImage = imageId !== 0;
      const isVideo = isVideoTag(tag);
      const awaitingMeta = it.title.length === 0 && isAwaitingOg(model, it.id);
      return {
        id: it.id,
        tag: tag,
        title: title,
        subtitle: hasSubtitle ? it.description : EMPTY,
        url: it.sourceUrl,
        domain: domain,
        imageId: imageId,
        isLink: true,
        hasSubtitle: hasSubtitle,
        hasUrlLine: false,
        hasImage: hasImage,
        hasDomain: domain.length > 0,
        isVideo: isVideo,
        awaitingMeta: awaitingMeta,
        // Electron footer: tag if no thumb; domain if thumb and not video.
        showTagFooter: !hasImage,
        showDomainFooter: hasImage && !isVideo && domain.length > 0,
      };
    }
    return {
      id: it.id,
      tag: asciiBytes("NOTE"),
      title: it.content,
      subtitle: EMPTY,
      url: EMPTY,
      domain: EMPTY,
      imageId: 0,
      isLink: false,
      hasSubtitle: false,
      hasUrlLine: false,
      hasImage: false,
      hasDomain: false,
      isVideo: false,
      awaitingMeta: false,
      showTagFooter: false,
      showDomainFooter: false,
    };
  });
}

export function searchHits(model: Model): readonly SearchHit[] {
  const q = trimAscii(model.searchDraft.bytes);
  if (q.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const it of model.items) {
    const hay = concatHay([it.title, it.description, it.content, it.sourceUrl]);
    if (!containsIgnoreCaseAscii(hay, q)) continue;
    hits.push({
      id: it.id,
      dayId: it.dayId,
      label: it.type === "link" ? (it.title.length > 0 ? it.title : it.sourceUrl) : it.content,
      detail: it.dayId,
    });
    if (hits.length >= 40) break;
  }
  return hits;
}

export function currentDayLabel(model: Model): Bytes {
  return formatDayHeading(model.currentDayId, model.todayId);
}

export function boardColumns(model: Model): number {
  // Electron: grid-cols-[repeat(auto-fill,minmax(260px,1fr))] with history rail.
  const history = 200;
  const pad = 48;
  const gap = 16;
  const minTile = 260;
  const available = model.boardWidth - history - pad;
  if (available < minTile) return 1;
  let cols = 1;
  let used = minTile;
  while (used + gap + minTile <= available) {
    cols += 1;
    used += gap + minTile;
  }
  return cols;
}

export function linksSelected(model: Model): boolean {
  return model.tab === "links";
}

export function notesSelected(model: Model): boolean {
  return model.tab === "notes";
}

export function linksEmpty(model: Model): boolean {
  return model.tab === "links" && visibleCards(model).length === 0;
}

export function notesEmpty(model: Model): boolean {
  return model.tab === "notes" && visibleCards(model).length === 0;
}

export function toastVisible(model: Model): boolean {
  return model.toast !== null;
}

export function toastMessage(model: Model): Bytes {
  return model.toast === null ? EMPTY : model.toast.message;
}

export function toastCanUndo(model: Model): boolean {
  return model.toast !== null && model.toast.itemId.length > 0;
}

export function statusText(model: Model): Bytes {
  if (!model.ready) return asciiBytes("Loading...");
  let n = 0;
  for (const it of model.items) {
    if (bytesEqual(it.dayId, model.currentDayId)) n += 1;
  }
  // Avoid `.length` on filtered slices + keep the line 7-bit ASCII.
  if (n === 0) return concat2(asciiBytes("No items - "), currentDayLabel(model));
  if (n === 1) return concat2(asciiBytes("1 item - "), currentDayLabel(model));
  return concat3(decimalBytes(n), asciiBytes(" items - "), currentDayLabel(model));
}

export function noteText(model: Model): Bytes {
  return model.noteDraft.bytes;
}

export function searchText(model: Model): Bytes {
  return model.searchDraft.bytes;
}

export function update(model: Model, msg: Msg): Model | [Model, Cmd<Msg>] {
  switch (msg.kind) {
    case "home_env": {
      const next: Model = { ...model, home: msg.value };
      return [
        next,
        Cmd.spawn([asciiBytes("/bin/date"), asciiBytes("+%Y-%m-%d")], {
          key: "today",
          collect: true,
          exit: "today_ok",
          err: "today_err",
        }),
      ];
    }
    case "today_ok": {
      const day = trimAscii(msg.stdout);
      const next: Model = {
        ...model,
        todayId: day.length >= 10 ? day : model.todayId,
        currentDayId: day.length >= 10 ? day : model.currentDayId,
      };
      return [
        next,
        Cmd.readFile(storePath(next.home), {
          key: "boot",
          ok: "store_loaded",
          err: "store_missing",
        }),
      ];
    }
    case "today_err": {
      return [
        model,
        Cmd.readFile(storePath(model.home), {
          key: "boot",
          ok: "store_loaded",
          err: "store_missing",
        }),
      ];
    }
    case "store_loaded": {
      const parsed = decodeStore(msg.body);
      if (parsed === null) return { ...model, ready: true };
      // Warm thumbnail fetches for links that already have OG art (or YT).
      const thumbQueue: ThumbJob[] = [];
      let nextImageSlot = model.nextImageSlot;
      let imageByItem = model.imageByItem;
      for (const it of parsed.items) {
        if (it.type !== "link") continue;
        const thumbUrl = resolveThumbnailUrl(it.sourceUrl, it.thumbnail);
        if (thumbUrl.length === 0) continue;
        const alloc = allocImageSlot(nextImageSlot, imageByItem, it.id);
        nextImageSlot = alloc.nextImageSlot;
        imageByItem = alloc.imageByItem;
        thumbQueue.push({
          id: it.id,
          url: thumbUrl,
          imageId: alloc.imageId,
        });
        if (thumbQueue.length >= IMAGE_SLOT_MAX) break;
      }
      if (thumbQueue.length === 0) {
        return {
          ...model,
          ready: true,
          nextId: parsed.nextId,
          items: parsed.items,
          dirty: false,
          nextImageSlot: nextImageSlot,
          imageByItem: imageByItem,
        };
      }
      return [
        {
          ...model,
          ready: true,
          nextId: parsed.nextId,
          items: parsed.items,
          dirty: false,
          thumbQueue: thumbQueue,
          pendingThumbImageId: thumbQueue[0].imageId,
          nextImageSlot: nextImageSlot,
          imageByItem: imageByItem,
        },
        Cmd.fetch(
          {
            url: thumbQueue[0].url,
            method: "GET",
            headers: { "user-agent": "Sediment/2.0" },
            timeoutMs: 8000,
          },
          { key: "thumb", ok: "thumb_ok", err: "thumb_err" },
        ),
      ];
    }
    case "store_missing": {
      return { ...model, ready: true, dirty: false };
    }
    case "store_wrote": {
      return { ...model, dirty: false };
    }
    case "store_write_failed": {
      return model;
    }
    case "save_now": {
      if (!model.dirty) return model;
      if (model.home.length === 0) return model;
      const snap: StoreSnapshot = { nextId: model.nextId, items: model.items };
      return [
        model,
        Cmd.writeFile(storePath(model.home), encodeStore(snap), {
          key: "save",
          ok: "store_wrote",
          err: "store_write_failed",
        }),
      ];
    }
    case "clipboard_tick": {
      return [
        model,
        Cmd.clipboardRead({ key: "clip", ok: "clipboard_text", err: "clipboard_failed" }),
      ];
    }
    case "clipboard_text": {
      const url = detectUrl(msg.text);
      if (url === null) {
        return { ...model, lastClipboard: trimAscii(msg.text) };
      }
      if (bytesEqual(url, model.lastClipboard)) return model;
      return [
        { ...model, lastClipboard: url, pendingUrl: url },
        Cmd.now("capture_at"),
      ];
    }
    case "clipboard_failed": {
      return model;
    }
    case "capture_at": {
      const url = model.pendingUrl;
      if (url.length === 0) return model;
      if (isSuppressed(model.suppress, url, msg.at)) {
        return { ...model, pendingUrl: EMPTY };
      }
      if (hasUrlOnDay(model.items, model.todayId, url)) {
        const toast: Toast = {
          itemId: EMPTY,
          sourceUrl: url,
          message: asciiBytes("Already saved today"),
          expiresAt: msg.at + TOAST_MS,
        };
        return [
          {
            ...model,
            pendingUrl: EMPTY,
            lastClipboard: url,
            toast: toast,
          },
          Cmd.delay("toast", TOAST_MS, "toast_tick"),
        ];
      }
      const ids = nextIdPair(model.nextId);
      const item = makeLinkItem(ids.id, model.todayId, url, msg.at);
      const job: OgJob = { id: item.id, url: url };
      const idle = model.ogQueue.length === 0;
      const toast: Toast = {
        itemId: item.id,
        sourceUrl: url,
        message: asciiBytes("Saved link"),
        expiresAt: msg.at + TOAST_MS,
      };
      const next: Model = {
        ...model,
        nextId: ids.nextId,
        items: [item, ...model.items],
        lastClipboard: url,
        pendingUrl: EMPTY,
        currentDayId: model.todayId,
        tab: "links",
        toast: toast,
        dirty: true,
        ogQueue: [...model.ogQueue, job],
      };
      if (idle) {
        return [
          next,
          Cmd.batch([
            Cmd.delay("autosave", AUTOSAVE_MS, "save_now"),
            Cmd.delay("toast", TOAST_MS, "toast_tick"),
            Cmd.fetch(
              {
                url: metaFetchUrl(url),
                method: "GET",
                headers: {
                  "user-agent": "Sediment/2.0",
                  accept: "application/json",
                },
                timeoutMs: 8000,
              },
              { key: "og", ok: "og_ok", err: "og_err" },
            ),
          ]),
        ];
      }
      return [
        next,
        Cmd.batch([
          Cmd.delay("autosave", AUTOSAVE_MS, "save_now"),
          Cmd.delay("toast", TOAST_MS, "toast_tick"),
        ]),
      ];
    }
    case "note_at": {
      const text = model.pendingNote;
      if (text.length === 0) return model;
      const ids = nextIdPair(model.nextId);
      const item = makeNoteItem(ids.id, model.currentDayId, text, msg.at);
      return [
        {
          ...model,
          nextId: ids.nextId,
          items: [item, ...model.items],
          pendingNote: EMPTY,
          noteDraft: fieldInit(),
          tab: "notes",
          dirty: true,
        },
        Cmd.delay("autosave", AUTOSAVE_MS, "save_now"),
      ];
    }
    case "suppress_at": {
      if (model.pendingSuppressUrl.length === 0) {
        return { ...model, suppress: null };
      }
      const suppress: Suppress = {
        url: model.pendingSuppressUrl,
        until: msg.at + SUPPRESS_MS,
      };
      return {
        ...model,
        suppress: suppress,
        pendingSuppressUrl: EMPTY,
      };
    }
    case "toast_tick": {
      if (model.toast === null) return model;
      if (msg.at >= model.toast.expiresAt) return { ...model, toast: null };
      return model;
    }
    case "set_tab_links": {
      return { ...model, tab: "links" };
    }
    case "set_tab_notes": {
      return { ...model, tab: "notes" };
    }
    case "select_day": {
      return { ...model, currentDayId: msg.id, searchOpen: false };
    }
    case "go_today": {
      return { ...model, currentDayId: model.todayId };
    }
    case "open_search": {
      return { ...model, searchOpen: true, searchDraft: fieldInit() };
    }
    case "close_search": {
      return { ...model, searchOpen: false };
    }
    case "note_edit": {
      return { ...model, noteDraft: applyField(model.noteDraft, msg.text, MAX_DRAFT) };
    }
    case "search_edit": {
      return { ...model, searchDraft: applyField(model.searchDraft, msg.text, MAX_SEARCH) };
    }
    case "add_note": {
      const text = trimAscii(model.noteDraft.bytes);
      if (text.length === 0) return model;
      return [{ ...model, pendingNote: text }, Cmd.now("note_at")];
    }
    case "delete_item": {
      const items = model.items.filter((it) => !bytesEqual(it.id, msg.id));
      return [
        { ...model, items: items, dirty: true },
        Cmd.delay("autosave", AUTOSAVE_MS, "save_now"),
      ];
    }
    case "undo_capture": {
      if (model.toast === null || model.toast.itemId.length === 0) {
        return { ...model, toast: null };
      }
      const id = model.toast.itemId;
      const url = model.toast.sourceUrl;
      const items = model.items.filter((it) => !bytesEqual(it.id, id));
      // Keep an in-flight head as a tombstone so the pending fetch still
      // correlates; drop any queued (not-yet-fetched) jobs for this item.
      let ogQueue = model.ogQueue;
      if (ogQueue.length === 0 || !bytesEqual(ogQueue[0].id, id)) {
        ogQueue = ogQueue.filter((job) => !bytesEqual(job.id, id));
      }
      return [
        {
          ...model,
          items: items,
          toast: null,
          pendingSuppressUrl: url,
          dirty: true,
          ogQueue: ogQueue,
        },
        Cmd.batch([
          Cmd.delay("autosave", AUTOSAVE_MS, "save_now"),
          Cmd.now("suppress_at"),
        ]),
      ];
    }
    case "dismiss_toast": {
      return { ...model, toast: null };
    }
    case "open_item": {
      for (const it of model.items) {
        if (bytesEqual(it.id, msg.id) && it.type === "link" && it.sourceUrl.length > 0) {
          return [
            model,
            Cmd.spawn([asciiBytes("/usr/bin/open"), it.sourceUrl], {
              key: "open",
              collect: true,
              exit: "open_done",
              err: "open_failed",
            }),
          ];
        }
      }
      return model;
    }
    case "open_done":
    case "open_failed": {
      return model;
    }
    case "go_search_hit": {
      for (const it of model.items) {
        if (!bytesEqual(it.id, msg.id)) continue;
        return {
          ...model,
          currentDayId: it.dayId,
          tab: it.type === "link" ? "links" : "notes",
          searchOpen: false,
        };
      }
      return { ...model, searchOpen: false };
    }
    case "chrome_changed": {
      return {
        ...model,
        chromeLeading: msg.insets.left,
        headerHeight: msg.insets.top > HEADER_HEIGHT_MIN ? msg.insets.top : HEADER_HEIGHT_MIN,
      };
    }
    case "board_resized": {
      return { ...model, boardWidth: msg.width };
    }
    case "og_ok": {
      if (model.ogQueue.length === 0) return model;
      const head = model.ogQueue[0];
      const rest = model.ogQueue.slice(1);
      let items = model.items;
      let dirty = model.dirty;
      let thumbQueue = model.thumbQueue;
      let nextImageSlot = model.nextImageSlot;
      let imageByItem = model.imageByItem;
      if (msg.status >= 200 && msg.status < 400) {
        const patched = itemsWithOg(model.items, head.id, msg.body);
        if (patched !== null) {
          items = patched;
          dirty = true;
        }
        let thumbUrl = EMPTY;
        for (const it of items) {
          if (!bytesEqual(it.id, head.id)) continue;
          thumbUrl = resolveThumbnailUrl(it.sourceUrl, it.thumbnail);
          break;
        }
        if (thumbUrl.length === 0) {
          thumbUrl = resolveThumbnailUrl(head.url, EMPTY);
        }
        if (thumbUrl.length > 0) {
          const alloc = allocImageSlot(nextImageSlot, imageByItem, head.id);
          nextImageSlot = alloc.nextImageSlot;
          imageByItem = alloc.imageByItem;
          thumbQueue = [
            ...thumbQueue,
            { id: head.id, url: thumbUrl, imageId: alloc.imageId },
          ];
        }
      } else {
        // Non-2xx/3xx: still try YouTube hqdefault when the URL is a video.
        const thumbUrl = resolveThumbnailUrl(head.url, EMPTY);
        if (thumbUrl.length > 0) {
          const alloc = allocImageSlot(nextImageSlot, imageByItem, head.id);
          nextImageSlot = alloc.nextImageSlot;
          imageByItem = alloc.imageByItem;
          thumbQueue = [
            ...thumbQueue,
            { id: head.id, url: thumbUrl, imageId: alloc.imageId },
          ];
        }
      }
      const startThumb = model.thumbQueue.length === 0 && thumbQueue.length > 0;
      const pendingThumbImageId = startThumb ? thumbQueue[0].imageId : model.pendingThumbImageId;
      const next: Model = {
        ...model,
        items: items,
        ogQueue: rest,
        dirty: dirty,
        thumbQueue: thumbQueue,
        pendingThumbImageId: pendingThumbImageId,
        nextImageSlot: nextImageSlot,
        imageByItem: imageByItem,
      };
      if (rest.length > 0 && dirty && startThumb) {
        return [
          next,
          Cmd.batch([
            Cmd.delay("autosave", AUTOSAVE_MS, "save_now"),
            Cmd.fetch(
              {
                url: metaFetchUrl(rest[0].url),
                method: "GET",
                headers: {
                  "user-agent": "Sediment/2.0",
                  accept: "application/json",
                },
                timeoutMs: 8000,
              },
              { key: "og", ok: "og_ok", err: "og_err" },
            ),
            Cmd.fetch(
              {
                url: thumbQueue[0].url,
                method: "GET",
                headers: { "user-agent": "Sediment/2.0" },
                timeoutMs: 8000,
              },
              { key: "thumb", ok: "thumb_ok", err: "thumb_err" },
            ),
          ]),
        ];
      }
      if (rest.length > 0 && dirty) {
        return [
          next,
          Cmd.batch([
            Cmd.delay("autosave", AUTOSAVE_MS, "save_now"),
            Cmd.fetch(
              {
                url: metaFetchUrl(rest[0].url),
                method: "GET",
                headers: {
                  "user-agent": "Sediment/2.0",
                  accept: "application/json",
                },
                timeoutMs: 8000,
              },
              { key: "og", ok: "og_ok", err: "og_err" },
            ),
          ]),
        ];
      }
      if (rest.length > 0 && startThumb) {
        return [
          next,
          Cmd.batch([
            Cmd.fetch(
              {
                url: metaFetchUrl(rest[0].url),
                method: "GET",
                headers: {
                  "user-agent": "Sediment/2.0",
                  accept: "application/json",
                },
                timeoutMs: 8000,
              },
              { key: "og", ok: "og_ok", err: "og_err" },
            ),
            Cmd.fetch(
              {
                url: thumbQueue[0].url,
                method: "GET",
                headers: { "user-agent": "Sediment/2.0" },
                timeoutMs: 8000,
              },
              { key: "thumb", ok: "thumb_ok", err: "thumb_err" },
            ),
          ]),
        ];
      }
      if (rest.length > 0) {
        return [
          next,
          Cmd.fetch(
            {
              url: metaFetchUrl(rest[0].url),
              method: "GET",
              headers: {
                "user-agent": "Sediment/2.0",
                accept: "application/json",
              },
              timeoutMs: 8000,
            },
            { key: "og", ok: "og_ok", err: "og_err" },
          ),
        ];
      }
      if (dirty && startThumb) {
        return [
          next,
          Cmd.batch([
            Cmd.delay("autosave", AUTOSAVE_MS, "save_now"),
            Cmd.fetch(
              {
                url: thumbQueue[0].url,
                method: "GET",
                headers: { "user-agent": "Sediment/2.0" },
                timeoutMs: 8000,
              },
              { key: "thumb", ok: "thumb_ok", err: "thumb_err" },
            ),
          ]),
        ];
      }
      if (startThumb) {
        return [
          next,
          Cmd.fetch(
            {
              url: thumbQueue[0].url,
              method: "GET",
              headers: { "user-agent": "Sediment/2.0" },
              timeoutMs: 8000,
            },
            { key: "thumb", ok: "thumb_ok", err: "thumb_err" },
          ),
        ];
      }
      if (dirty) {
        return [next, Cmd.delay("autosave", AUTOSAVE_MS, "save_now")];
      }
      return next;
    }
    case "og_err": {
      if (model.ogQueue.length === 0) return model;
      const head = model.ogQueue[0];
      const rest = model.ogQueue.slice(1);
      let thumbQueue = model.thumbQueue;
      let nextImageSlot = model.nextImageSlot;
      let imageByItem = model.imageByItem;
      // Network/parse failure: still queue YouTube hqdefault when applicable.
      const thumbUrl = resolveThumbnailUrl(head.url, EMPTY);
      if (thumbUrl.length > 0) {
        const alloc = allocImageSlot(nextImageSlot, imageByItem, head.id);
        nextImageSlot = alloc.nextImageSlot;
        imageByItem = alloc.imageByItem;
        thumbQueue = [
          ...thumbQueue,
          { id: head.id, url: thumbUrl, imageId: alloc.imageId },
        ];
      }
      const startThumb = model.thumbQueue.length === 0 && thumbQueue.length > 0;
      const pendingThumbImageId = startThumb ? thumbQueue[0].imageId : model.pendingThumbImageId;
      const next: Model = {
        ...model,
        ogQueue: rest,
        thumbQueue: thumbQueue,
        pendingThumbImageId: pendingThumbImageId,
        nextImageSlot: nextImageSlot,
        imageByItem: imageByItem,
      };
      if (rest.length > 0 && startThumb) {
        return [
          next,
          Cmd.batch([
            Cmd.fetch(
              {
                url: metaFetchUrl(rest[0].url),
                method: "GET",
                headers: {
                  "user-agent": "Sediment/2.0",
                  accept: "application/json",
                },
                timeoutMs: 8000,
              },
              { key: "og", ok: "og_ok", err: "og_err" },
            ),
            Cmd.fetch(
              {
                url: thumbQueue[0].url,
                method: "GET",
                headers: { "user-agent": "Sediment/2.0" },
                timeoutMs: 8000,
              },
              { key: "thumb", ok: "thumb_ok", err: "thumb_err" },
            ),
          ]),
        ];
      }
      if (rest.length > 0) {
        return [
          next,
          Cmd.fetch(
            {
              url: metaFetchUrl(rest[0].url),
              method: "GET",
              headers: {
                "user-agent": "Sediment/2.0",
                accept: "application/json",
              },
              timeoutMs: 8000,
            },
            { key: "og", ok: "og_ok", err: "og_err" },
          ),
        ];
      }
      if (startThumb) {
        return [
          next,
          Cmd.fetch(
            {
              url: thumbQueue[0].url,
              method: "GET",
              headers: { "user-agent": "Sediment/2.0" },
              timeoutMs: 8000,
            },
            { key: "thumb", ok: "thumb_ok", err: "thumb_err" },
          ),
        ];
      }
      return next;
    }
    case "thumb_ok": {
      if (model.thumbQueue.length === 0) {
        return { ...model, pendingThumbImageId: 0 };
      }
      const head = model.thumbQueue[0];
      const rest = model.thumbQueue.slice(1);
      let imageByItem = model.imageByItem;
      if (msg.status >= 200 && msg.status < 300) {
        imageByItem = upsertImageSlot(imageByItem, head.id, head.imageId);
      }
      if (rest.length === 0) {
        return {
          ...model,
          thumbQueue: rest,
          imageByItem: imageByItem,
          pendingThumbImageId: 0,
        };
      }
      return [
        {
          ...model,
          thumbQueue: rest,
          imageByItem: imageByItem,
          pendingThumbImageId: rest[0].imageId,
        },
        Cmd.fetch(
          {
            url: rest[0].url,
            method: "GET",
            headers: { "user-agent": "Sediment/2.0" },
            timeoutMs: 8000,
          },
          { key: "thumb", ok: "thumb_ok", err: "thumb_err" },
        ),
      ];
    }
    case "thumb_err": {
      if (model.thumbQueue.length === 0) {
        return { ...model, pendingThumbImageId: 0 };
      }
      const rest = model.thumbQueue.slice(1);
      if (rest.length === 0) {
        return { ...model, thumbQueue: rest, pendingThumbImageId: 0 };
      }
      return [
        {
          ...model,
          thumbQueue: rest,
          pendingThumbImageId: rest[0].imageId,
        },
        Cmd.fetch(
          {
            url: rest[0].url,
            method: "GET",
            headers: { "user-agent": "Sediment/2.0" },
            timeoutMs: 8000,
          },
          { key: "thumb", ok: "thumb_ok", err: "thumb_err" },
        ),
      ];
    }
  }
}

export function subscriptions(model: Model): Sub<Msg> {
  if (!model.ready) return Sub.none;
  return Sub.timer("clipboard", CLIPBOARD_MS, "clipboard_tick");
}
