import { bytesEqual, type Bytes } from "./bytes.ts";

/** Canvas image registry has 16 slots; we use 1..15 for fetched thumbs. */
export const IMAGE_SLOT_MAX = 15;

export interface ImageSlot {
  readonly id: Bytes;
  readonly imageId: number;
}

export interface AllocImage {
  readonly imageId: number;
  readonly nextImageSlot: number;
  readonly imageByItem: readonly ImageSlot[];
}

/**
 * Allocate the next canvas ImageId (1..15). Reusing a slot clears any prior
 * item mapping that pointed at it — avoids colliding art when many cards share ids.
 */
export function allocImageSlot(
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

export function lookupImageId(slots: readonly ImageSlot[], id: Bytes): number {
  for (const slot of slots) {
    if (bytesEqual(slot.id, id)) return slot.imageId;
  }
  return 0;
}

export function upsertImageSlot(
  slots: readonly ImageSlot[],
  id: Bytes,
  imageId: number,
): readonly ImageSlot[] {
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
