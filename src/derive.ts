import { asciiBytes } from "@native-sdk/core";
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
import { itemsForDay } from "./capture.ts";
import type { Model } from "./core.ts";
import { lookupImageId } from "./images.ts";
import {
  domainLabel,
  formatDayHeading,
  formatDaySidebar,
  isVideoHost,
  linkDisplayTitle,
  linkTagLabel,
} from "./tags.ts";

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

export interface SearchHit {
  readonly id: Bytes;
  readonly dayId: Bytes;
  readonly label: Bytes;
  readonly detail: Bytes;
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

function isAwaitingOg(model: Model, itemId: Bytes): boolean {
  for (const job of model.ogQueue) {
    if (bytesEqual(job.id, itemId)) return true;
  }
  return false;
}

export function buildDayRows(model: Model): readonly DayRow[] {
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

export function buildVisibleCards(model: Model): readonly CardRow[] {
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
      const isVideo = isVideoHost(it.sourceUrl);
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
        hasImage: hasImage,
        hasDomain: domain.length > 0,
        isVideo: isVideo,
        awaitingMeta: awaitingMeta,
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
      hasImage: false,
      hasDomain: false,
      isVideo: false,
      awaitingMeta: false,
      showTagFooter: false,
      showDomainFooter: false,
    };
  });
}

export function buildSearchHits(model: Model): readonly SearchHit[] {
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

export function buildCurrentDayLabel(model: Model): Bytes {
  return formatDayHeading(model.currentDayId, model.todayId);
}

export function buildBoardColumns(model: Model): number {
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

export function buildStatusText(model: Model): Bytes {
  if (!model.ready) return asciiBytes("Loading...");
  let n = 0;
  for (const it of model.items) {
    if (bytesEqual(it.dayId, model.currentDayId)) n += 1;
  }
  if (n === 0) return concat2(asciiBytes("No items - "), buildCurrentDayLabel(model));
  if (n === 1) return concat2(asciiBytes("1 item - "), buildCurrentDayLabel(model));
  return concat3(decimalBytes(n), asciiBytes(" items - "), buildCurrentDayLabel(model));
}
