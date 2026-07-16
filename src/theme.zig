//! Sediment field-guide design tokens.
//!
//! Maps the Electron app's paper/ink/moss/iron palette onto Native SDK
//! ColorTokens, and points typography at the bundled field-guide faces
//! (Archivo / IBM Plex Mono / Besley — registered in wire.zig).

const native_sdk = @import("native_sdk");

const canvas = native_sdk.canvas;
const Color = canvas.Color;

/// App-registered font ids (must match `Options.fonts` in wire.zig).
pub const font_archivo: canvas.FontId = canvas.min_registered_font_id; // 64
pub const font_plex_mono: canvas.FontId = canvas.min_registered_font_id + 1; // 65
pub const font_besley: canvas.FontId = canvas.min_registered_font_id + 2; // 66

// Canonical Sediment tokens (keep website/tokens.css in sync).
const paper = Color.rgb8(0xea, 0xea, 0xe3); // #eaeae3
const silt = Color.rgb8(0xdd, 0xdb, 0xcf); // #dddbcf
const card = Color.rgb8(0xfb, 0xfa, 0xf7); // #fbfaf7
const board = Color.rgb8(0xf4, 0xf3, 0xee); // #f4f3ee
const ink = Color.rgb8(0x26, 0x2a, 0x22); // #262a22
const ink_secondary = Color.rgb8(0x56, 0x5b, 0x4e); // #565b4e
const ink_muted = Color.rgb8(0x8b, 0x8b, 0x7e); // #8b8b7e
const moss = Color.rgb8(0x4e, 0x6e, 0x58); // #4e6e58
const iron = Color.rgb8(0x9c, 0x3d, 0x22); // #9c3d22
// ink @ 16% ≈ field-guide hairline
const ui_border = Color.rgba8(0x26, 0x2a, 0x22, 41);
const ink_shadow = Color.rgba8(0x26, 0x2a, 0x22, 26);

const field_guide = canvas.DesignTokenOverrides{
    .colors = .{
        .background = paper,
        .surface = card,
        .surface_subtle = board,
        .surface_pressed = silt,
        .text = ink,
        .text_muted = ink_muted,
        .border = ui_border,
        // Active day block / primary fills — ink on paper (Electron accent).
        .accent = ink,
        .accent_text = paper,
        .destructive = iron,
        .destructive_text = paper,
        // Specimen tags / success — moss.
        .success = moss,
        .success_text = paper,
        .warning = iron,
        .warning_text = paper,
        .info = ink_secondary,
        .info_text = paper,
        .focus_ring = moss,
        .shadow = ink_shadow,
        .scrim = Color.rgba8(0x26, 0x2a, 0x22, 40),
    },
    .typography = .{
        // Archivo = Electron --font-sans (body/UI). Besley stays registered
        // for a future display-only day title; Plex Mono for specimen tags.
        .font_id = font_archivo,
        .mono_font_id = font_plex_mono,
        .button_font_id = font_archivo,
        .body_size = 13,
        .label_size = 10,
        .title_size = 14,
        .button_size = 12,
        .heading_size = 19,
        .display_size = 36,
    },
    // Hard field-guide corners (print cards).
    .radius = .{
        .sm = 0,
        .md = 0,
        .lg = 0,
        .xl = 2,
    },
    .shadow = .{
        // Approximate Electron --shadow-hard (3px 3px 0); SDK shadows are y-only.
        .xs = .{ .y = 1, .blur = 0, .spread = 0 },
        .sm = .{ .y = 3, .blur = 0, .spread = 0 },
        .md = .{ .y = 5, .blur = 0, .spread = 0 },
    },
    .metrics = .{
        .control_height_sm = 28,
        .control_height = 32,
        .control_height_lg = 40,
        .button_inset_sm = 6,
        .button_inset = 8,
        .button_inset_lg = 12,
        .tabs_indicator_thickness = 2,
        .tabs_gap = 28,
    },
};

/// Fixed light field-guide register for the whole app.
pub fn tokens() canvas.DesignTokens {
    return canvas.DesignTokens.themeWithOverrides(.{
        .pack = .geist,
        .color_scheme = .light,
        .contrast = .standard,
        .reduce_motion = false,
    }, field_guide);
}
