import { EMPTY, bytesEqual, type Bytes } from "./bytes.ts";
import { type OgJob } from "./capture.ts";
import {
  IMAGE_SLOT_MAX,
  allocImageSlot,
  type ImageSlot,
} from "./images.ts";
import { type Item } from "./store.ts";
import { resolveThumbnailUrl } from "./tags.ts";

export const AUTOSAVE_MS = 600;

export interface ThumbJob {
  readonly id: Bytes;
  readonly url: Bytes;
  readonly imageId: number;
}

export interface EnqueueThumb {
  readonly nextImageSlot: number;
  readonly imageByItem: readonly ImageSlot[];
  readonly thumbQueue: readonly ThumbJob[];
}

/** Append a thumbnail job when `thumbUrl` is non-empty. */
export function enqueueThumb(
  nextImageSlot: number,
  imageByItem: readonly ImageSlot[],
  thumbQueue: readonly ThumbJob[],
  itemId: Bytes,
  thumbUrl: Bytes,
): EnqueueThumb {
  if (thumbUrl.length === 0) {
    return {
      nextImageSlot: nextImageSlot,
      imageByItem: imageByItem,
      thumbQueue: thumbQueue,
    };
  }
  const alloc = allocImageSlot(nextImageSlot, imageByItem, itemId);
  return {
    nextImageSlot: alloc.nextImageSlot,
    imageByItem: alloc.imageByItem,
    thumbQueue: [
      ...thumbQueue,
      { id: itemId, url: thumbUrl, imageId: alloc.imageId },
    ],
  };
}

/** Warm thumb jobs for links that already have resolvable art (store load). */
export function warmThumbQueue(
  items: readonly Item[],
  nextImageSlot: number,
  imageByItem: readonly ImageSlot[],
): EnqueueThumb {
  let slot = nextImageSlot;
  let slots = imageByItem;
  const queue: ThumbJob[] = [];
  for (const it of items) {
    if (it.type !== "link") continue;
    const thumbUrl = resolveThumbnailUrl(it.sourceUrl, it.thumbnail);
    if (thumbUrl.length === 0) continue;
    const alloc = allocImageSlot(slot, slots, it.id);
    slot = alloc.nextImageSlot;
    slots = alloc.imageByItem;
    queue.push({
      id: it.id,
      url: thumbUrl,
      imageId: alloc.imageId,
    });
    if (queue.length >= IMAGE_SLOT_MAX) break;
  }
  return {
    nextImageSlot: slot,
    imageByItem: slots,
    thumbQueue: queue,
  };
}

/** Resolve thumb URL for an OG head (patched item first, else source URL fallbacks). */
export function thumbUrlForOgHead(items: readonly Item[], head: OgJob): Bytes {
  for (const it of items) {
    if (!bytesEqual(it.id, head.id)) continue;
    const fromItem = resolveThumbnailUrl(it.sourceUrl, it.thumbnail);
    if (fromItem.length > 0) return fromItem;
    break;
  }
  return resolveThumbnailUrl(head.url, EMPTY);
}
