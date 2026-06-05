# Phase 4 — Rich Content Types

**Status:** ✅ Done

## Goal
Links show OG preview cards, YouTube/Vimeo show thumbnails, images are stored locally and displayed inline.

## Tasks
- [x] `src/main/services/og-fetcher.ts` — fetch OG tags using `cheerio`; fires async after item insert, pushes `item:metadataUpdated` event to renderer
- [x] `LinkCard` — renders title, description, OG image, domain, open button
- [x] `src/main/services/image-store.ts` — save base64 data URL as PNG to `userData/images/<id>.png`
- [x] `ImageCard` — renders stored image, click to open lightbox
- [x] `VideoCard` — YouTube thumbnail from `img.youtube.com/vi/{id}/hqdefault.jpg`, platform badge
- [x] `SocialCard` — styled card with platform colour badge; falls back to OG data for content
- [x] `src/main/protocol.ts` — `sediment://images/<file>` → `userData/images/<file>` via `protocol.handle`
