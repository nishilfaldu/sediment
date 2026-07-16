// Sediment core — local-first daily board for links and notes.
// Entry module: Model, Msg, update, subscriptions, binding helpers.

import { Cmd, Sub, asciiBytes, type EnvMsg } from "@native-sdk/core";
import { type TextInputEvent } from "@native-sdk/core/text";
import { type ChromeButtons, type ChromeInsets, type FrameEvent } from "@native-sdk/core/events";
import {
  EMPTY,
  bytesEqual,
  concat2,
  trimAscii,
  type Bytes,
} from "./bytes.ts";
import {
  hasUrlOnDay,
  isSuppressed,
  itemsWithOg,
  makeLinkItem,
  makeNoteItem,
  nextIdPair,
  type OgJob,
  type Suppress,
  type Toast,
} from "./capture.ts";
import { detectUrl } from "./detect.ts";
import {
  buildBoardColumns,
  buildCurrentDayLabel,
  buildDayRows,
  buildSearchHits,
  buildStatusText,
  buildVisibleCards,
  type CardRow,
  type DayRow,
  type SearchHit,
} from "./derive.ts";
import { applyField, fieldInit, type FieldDraft } from "./field.ts";
import {
  upsertImageSlot,
  type ImageSlot,
} from "./images.ts";
import {
  AUTOSAVE_MS,
  enqueueThumb,
  thumbUrlForOgHead,
  warmThumbQueue,
  type ThumbJob,
} from "./previews.ts";
import {
  decodeStore,
  encodeStore,
  type Item,
  type StoreSnapshot,
} from "./store.ts";
import {
  metaFetchUrl,
  resolveThumbnailUrl,
} from "./tags.ts";

export type Tab = "links" | "notes";

export type { CardRow, DayRow, SearchHit };

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

const MAX_DRAFT = 8000;
const MAX_SEARCH = 200;
const CLIPBOARD_MS = 500;
const TOAST_MS = 8000;
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

export function dayRows(model: Model): readonly DayRow[] {
  return buildDayRows(model);
}

export function visibleCards(model: Model): readonly CardRow[] {
  return buildVisibleCards(model);
}

export function searchHits(model: Model): readonly SearchHit[] {
  return buildSearchHits(model);
}

export function currentDayLabel(model: Model): Bytes {
  return buildCurrentDayLabel(model);
}

export function boardColumns(model: Model): number {
  return buildBoardColumns(model);
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
  return buildStatusText(model);
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
      const warmed = warmThumbQueue(parsed.items, model.nextImageSlot, model.imageByItem);
      if (warmed.thumbQueue.length === 0) {
        return {
          ...model,
          ready: true,
          nextId: parsed.nextId,
          items: parsed.items,
          dirty: false,
          nextImageSlot: warmed.nextImageSlot,
          imageByItem: warmed.imageByItem,
        };
      }
      const next: Model = {
        ...model,
        ready: true,
        nextId: parsed.nextId,
        items: parsed.items,
        dirty: false,
        thumbQueue: warmed.thumbQueue,
        pendingThumbImageId: warmed.thumbQueue[0].imageId,
        nextImageSlot: warmed.nextImageSlot,
        imageByItem: warmed.imageByItem,
      };
      return [
        next,
        Cmd.fetch(
          {
            url: warmed.thumbQueue[0].url,
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
        const enq = enqueueThumb(
          nextImageSlot,
          imageByItem,
          thumbQueue,
          head.id,
          thumbUrlForOgHead(items, head),
        );
        nextImageSlot = enq.nextImageSlot;
        imageByItem = enq.imageByItem;
        thumbQueue = enq.thumbQueue;
      } else {
        // Non-2xx/3xx: still try YouTube hqdefault when the URL is a video.
        const enq = enqueueThumb(
          nextImageSlot,
          imageByItem,
          thumbQueue,
          head.id,
          resolveThumbnailUrl(head.url, EMPTY),
        );
        nextImageSlot = enq.nextImageSlot;
        imageByItem = enq.imageByItem;
        thumbQueue = enq.thumbQueue;
      }
      const startThumb = model.thumbQueue.length === 0 && thumbQueue.length > 0;
      const next: Model = {
        ...model,
        items: items,
        ogQueue: rest,
        dirty: dirty,
        thumbQueue: thumbQueue,
        pendingThumbImageId: startThumb ? thumbQueue[0].imageId : model.pendingThumbImageId,
        nextImageSlot: nextImageSlot,
        imageByItem: imageByItem,
      };
      // Cmd must be constructed inline in update's return (NS1017) — shared
      // fetch builders are illegal; the boolean tree stays here by design.
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
      const enq = enqueueThumb(
        model.nextImageSlot,
        model.imageByItem,
        model.thumbQueue,
        head.id,
        resolveThumbnailUrl(head.url, EMPTY),
      );
      const startThumb = model.thumbQueue.length === 0 && enq.thumbQueue.length > 0;
      const next: Model = {
        ...model,
        ogQueue: rest,
        thumbQueue: enq.thumbQueue,
        pendingThumbImageId: startThumb ? enq.thumbQueue[0].imageId : model.pendingThumbImageId,
        nextImageSlot: enq.nextImageSlot,
        imageByItem: enq.imageByItem,
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
                url: enq.thumbQueue[0].url,
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
              url: enq.thumbQueue[0].url,
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
    default: {
      const _exhaustive: never = msg;
      return model;
    }
  }
}

export function subscriptions(model: Model): Sub<Msg> {
  if (!model.ready) return Sub.none;
  return Sub.timer("clipboard", CLIPBOARD_MS, "clipboard_tick");
}
