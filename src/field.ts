import {
  applyTextInputEvent,
  clampedInsertEvent,
  type TextEditState,
  type TextInputEvent,
} from "@native-sdk/core/text";
import { EMPTY, type Bytes } from "./bytes.ts";

export interface FieldDraft {
  readonly bytes: Bytes;
  readonly anchor: number;
  readonly focus: number;
  readonly compStart: number;
  readonly compEnd: number;
}

export function fieldInit(): FieldDraft {
  return { bytes: EMPTY, anchor: 0, focus: 0, compStart: -1, compEnd: -1 };
}

function fieldState(d: FieldDraft): TextEditState {
  return {
    text: d.bytes,
    selection: { anchor: d.anchor, focus: d.focus },
    composition: d.compStart >= 0 ? { start: d.compStart, end: d.compEnd } : null,
  };
}

function fromEditState(state: TextEditState): FieldDraft {
  return {
    bytes: state.text,
    anchor: state.selection.anchor,
    focus: state.selection.focus,
    compStart: state.composition === null ? -1 : state.composition.start,
    compEnd: state.composition === null ? -1 : state.composition.end,
  };
}

export function applyField(d: FieldDraft, event: TextInputEvent, cap: number): FieldDraft {
  const state = fieldState(d);
  const next = applyTextInputEvent(state, event, cap);
  if (next !== null) return fromEditState(next);
  const clamped = clampedInsertEvent(state, event, cap);
  if (clamped === null) return d;
  const again = applyTextInputEvent(state, clamped, cap);
  if (again === null) return d;
  return fromEditState(again);
}
