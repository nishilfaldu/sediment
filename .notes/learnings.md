# Learnings & Good Patterns

Reusable practices, conventions, and hard-won lessons. Project-agnostic — transferable to any codebase. Add an entry any time something turns out meaningfully better than the naive approach.

---

## Agent Behaviour & Code Conventions

### Do the work — never ask the developer to make a one-line change

If the solution is a concrete edit to a file or a shell command, just do it. Never instruct the developer to "add this to `package.json`" or "run this command" — that's the agent's job. Only escalate when the decision genuinely requires human input (product direction, credentials, irreversible ops). A patch, a config change, a missing script — always handle it directly.

---

### Export everything that could be reused

`export` all interfaces, types, and constants from every file — hooks, components, stores, lib utils — even if currently only used locally. The only exception is genuinely private implementation details (e.g. an internal helper that is an implementation detail of one file). This keeps the API surface visible and makes refactoring easier.

---

### Add inline comments that explain the *why*, not the *what*

Comment the reasoning behind non-obvious decisions — especially:
- Platform-specific behaviour (e.g. why WAL mode, why SQLite foreign keys are off by default)
- Library quirks (e.g. why Drizzle can't generate FTS5, why `.$type<>()` instead of a CHECK constraint)
- Patterns that look strange but are intentional

Prefer `// WAL mode: readers and writers don't block each other; better crash recovery` over `// set WAL mode`. A developer reading the code should learn *why* it is the way it is, not just *what* it does.

---

## TypeScript

### Derive types from Drizzle schema instead of writing them manually

Drizzle generates two inferred types per table automatically:
- `typeof table.$inferInsert` — shape required to insert a row
- `typeof table.$inferSelect` — shape of a fully selected row

Export named aliases from `schema.ts`:
```ts
export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
```

Then derive narrower types from those:
```ts
type CreateItemInput = Omit<NewItem, 'id' | 'createdAt' | 'updatedAt'>
type MetadataPatch = Pick<NewItem, 'title' | 'description' | 'thumbnail' | 'metadata'>
```

If the schema changes, all derived types update automatically. No manual interface to keep in sync.

---

### Use `src/shared/` for cross-process contracts when the renderer can't import main

The renderer cannot import `src/main/db/schema.ts` (it transitively pulls in `better-sqlite3`). Instead of manually mirroring types in the renderer and casting `unknown` at every IPC call:

- Put domain types (`Item`, `ItemType`), IPC shapes (`Api`, `CreateItemPayload`), and pure logic (`detectContent`) in `src/shared/`
- Import from `@shared/*` in main, preload, and renderer
- Type the preload bridge as `Api` so hooks call `window.api.items.create(payload)` without casts

Main still derives insert/select types from Drizzle for DB operations; shared types mirror the row shape for IPC.

---

### Use `as const` arrays to define enums, derive the union type from them

Instead of a bare `type ItemType = 'text' | 'image' | ...` and a separate runtime array for validation, combine both into one definition:

```ts
export const ITEM_TYPES = ['text', 'image', 'link', 'video', 'social'] as const
export type ItemType = (typeof ITEM_TYPES)[number]
```

One place to add a new value. The union type, any runtime checks (`ITEM_TYPES.includes(x)`), and Drizzle's `.$type<ItemType>()` all derive from the same array.

---

### Use `interface` (not `type`) for object shapes — and always export them

`interface` is preferred over `type` for all object shapes: component props, store shapes, hook payloads. Always export them even if only used locally. Union types (`type ItemType = 'text' | 'image'`) stay as `type` since `interface` can't express unions.

---

## React

### One component per file, no matter how small

Even tiny helper components (icons, wrappers) get their own file. No co-located private components. This keeps files predictable to navigate and avoids barrel files turning into dumping grounds. Icons live in `components/icons/`, each in its own kebab-case file.

---

### `JSX.Element` return type via `import type { JSX } from 'react'`

Avoid `React.JSX.Element` as a return type — it requires `React` in scope even when not used. The canonical form:

```tsx
import type { JSX } from 'react'

export function MyComponent(): JSX.Element { ... }
```

React 19 + the `react-jsx` transform mean `React` no longer needs to be imported for JSX itself; this keeps the import list honest.

---

### Kebab-case filenames, PascalCase exports

All filenames use kebab-case: `day-board.tsx`, `use-items.ts`, `current-day.ts`. PascalCase is for the exported component/function name, not the filename. Avoids case-sensitivity surprises on Linux and matches the broader JS ecosystem convention.

**macOS gotcha:** HFS+ is case-insensitive. When renaming `Foo.tsx` → `foo.tsx`, write the new file first then delete the old — `rm Foo.tsx` silently deletes `foo.tsx` too since they share an inode.

---

### `@/` path alias instead of relative imports

Configure a `@/` alias pointing to the renderer source root in both Vite and `tsconfig`. Every import uses `@/components/...`, `@/hooks/...` — never `../../`. Imports don't break on file moves, easier to read, consistent with React ecosystem convention.

```ts
// vite config
alias: { '@': resolve('src/renderer/src') }

// tsconfig
"paths": { "@/*": ["src/renderer/src/*"] }
```

---

### Centralise colours with Tailwind v4 `@theme`

Tailwind v4 supports an `@theme` block in CSS that creates semantic custom properties usable as utility classes (`bg-surface`, `text-primary` etc.). Define all semantic tokens in one CSS file. Retheme the whole app by editing those lines, not hunting colour values across dozens of files.

Biome requires `"css": { "parser": { "tailwindDirectives": true } }` in `biome.json` or it treats `@theme` / `@layer` / `@apply` as parse errors.

---

## Biome

### Never use `biome-ignore` comments — configure rules off globally

If a lint rule fires legitimately but is wrong for the project, turn it off globally in `biome.json`. Inline suppression comments are noisy, fragile, and spread policy across files instead of keeping it in one place.

---

### `biome.json` is strict JSON — no `//` comments

Unlike `tsconfig.json` (JSONC), `biome.json` is parsed as strict JSON. Adding `//` comments causes cascading parse errors that silently break all linting — Biome reports hundreds of errors rather than one clear message. Keep explanatory notes in project docs instead.

---

## Electron

### CSP meta tags in `index.html` break Vite HMR

The `electron-vite` template ships with a `Content-Security-Policy` meta tag. In Electron it silently kills two things:

1. **HMR WebSocket** — `default-src 'self'` blocks `ws://localhost:5173`. File changes appear to do nothing.
2. **Module evaluation** — `script-src 'self'` blocks `'unsafe-eval'`, which Vite's dev module runner needs.

Remove the meta tags entirely. In Electron the security boundary is context isolation + the preload bridge, not CSP. Any production CSP should be applied via `webRequest.onHeadersReceived` in the main process — not a meta tag that also applies in dev.

---

### Always audit the scaffold template — it ships generic deps you may not need

`electron-vite` and similar scaffolds add packages that don't apply to every project. After scaffolding, grep for unused toolkit packages and remove them. Common offenders:
- Preload utility libraries that expose APIs your app never uses
- Auto-update libraries added by default but never imported
- Dev utility wrappers that silently break on newer Electron versions

**Rule of thumb:** `grep -r 'package-name' src/` — if nothing imports it, remove it.

---

### `better-sqlite3` has a version ceiling per Electron version

`better-sqlite3` uses V8 APIs directly (not NAPI), so it must be compiled against the exact V8 version bundled in your Electron release. When Electron upgrades its Chromium/V8, `better-sqlite3` may not yet have a compatible release. Check compatibility before upgrading Electron — pin both until a compatible pair exists.

---

### ESM main process required for Electron 36+

In Electron 36+, `require('electron')` in a CJS-format main process returns the npm package shim (a path string), not Electron's built-in module — `electron.app` is `undefined`. Electron's module interception only works with ESM `import`.

Output the main process as ESM (`format: 'es'` in Rollup options) and point `package.json` `"main"` at the `.mjs` output file.

---

### `ELECTRON_RUN_AS_NODE=1` is set by Electron-based IDEs

Cursor and VS Code set `ELECTRON_RUN_AS_NODE=1` in their terminal shells. Running `bun dev` from that shell makes the Electron binary act as plain Node.js — no window opens, `app.getPath()` crashes. Unset it in the dev script:

```json
"dev": "ELECTRON_RUN_AS_NODE= electron-vite dev"
```

---

## Database

### When an ORM can't express a query, export the raw connection alongside it

Drizzle has no support for FTS5 `MATCH` queries. Rather than hacking the ORM, export the raw `better-sqlite3` instance directly alongside the Drizzle instance:

```ts
export function getSqlite(): Database.Database { ... }
export function getDb(): DrizzleDb { ... }
```

Use the ORM for all normal queries. Use the raw connection only when the ORM can't express it. Keeps the escape hatch explicit and auditable.

---

### Hand-written migrations alongside generated ones — use a custom runner

Most ORM migration runners only process files they generated themselves and can't handle special SQL (e.g. FTS5 virtual tables, custom triggers). A simple custom runner that reads all `.sql` files alphabetically, tracks applied ones in a `__migrations` table, and runs new ones in a transaction handles both generated and hand-written SQL equally with no extra overhead.
