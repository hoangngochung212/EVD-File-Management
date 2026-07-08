# EVD — File Management (Document Admin)

Next.js 14 (App Router) + Ant Design 5 admin screen for the EVD document module.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 (redirects to `/documents`).

There is no external backend — `app/api/documents/**` are Next.js Route Handlers backed
by an in-memory store (`app/api/_data/seed.ts`, seeded with 500 rows on first request).
Swap these for real endpoints later without touching any UI code — everything goes
through `lib/api.ts`.

## Where things live

- `app/documents/page.tsx` — the admin screen (composition root).
- `components/DocumentTable.tsx` — table with **inline edit-in-place**, dirty-state
  tracking, per-cell validation, single-row save and batch "Save All", delete
  confirmation, and permission-based UI (Delete hidden for `STAFF`). Uses AntD's
  `virtual` table mode for smooth scrolling over large pages.
- `components/DocumentFormModal.tsx` — Create/Edit via a validated form (modal).
- `components/BulkImportModal.tsx` + `workers/import.worker.ts` — CSV/Excel bulk
  import. Parsing and validation run in a Web Worker (PapaParse in streaming/chunk
  mode for CSV, SheetJS for Excel) so the UI thread never blocks, with a live
  progress bar and a report of invalid rows. Valid rows are POSTed to the server in
  chunks (2,000 rows/request) with upload progress.
- `components/FilterBar.tsx` — debounced search (400ms), status/category filters,
  and a role switch (`ADMIN` / `STAFF`) to simulate permissions.
- `hooks/useDocuments.ts` — TanStack Query hooks (server state / caching /
  invalidation).
- `store/useAppStore.ts` — Zustand store for the simulated role/current user (UI
  state, not server state).
- `lib/validation.ts` — single source of truth for field validation, shared by the
  form modal, inline edit, and the import worker.

## Requirements checklist

- **List as table**: code, title, category, status, created by, created date. ✅
- **Server-side pagination, search (title/code), filter (status/category)**. ✅
- **Create/Edit via modal form with validation**. ✅ (`DocumentFormModal`)
- **Inline edit-in-place** with per-cell validation and single-row/batch save. ✅
  (`DocumentTable` — click the pencil icon on a row)
- **Bulk import (CSV/Excel), chunked/streamed via Web Worker, progress, invalid
  row report, virtualization-friendly rendering**. ✅ (`BulkImportModal` +
  `import.worker.ts`)
- **Delete with confirmation dialog**. ✅ (`Popconfirm`)
- **Loading / empty / error states**. ✅ (table spinner, AntD `Empty`, retryable
  `Alert` on API failure)
- **Permission-based UI**: `STAFF` role hides Delete and only sees documents where
  `createdBy === currentUser` (server-side filter, not just UI hiding). ✅
- **State management**: TanStack Query (server state) + Zustand (UI state). ✅
- **Bonus**: virtualized table (`virtual` prop), responsive layout, debounced
  search, color-coded status badges. Deployment and i18n are left as follow-ups.

## Notes / trade-offs

- The mock API is in-memory per server process — fine for a demo, but state resets
  on server restart and isn't safe for multi-instance deployments. Swap
  `app/api/_data/seed.ts` for a real database when wiring this to production.
- Excel parsing (`xlsx`/SheetJS) reads the whole workbook into memory inside the
  worker; for CSV, PapaParse streams the file in ~512KB chunks so memory stays
  bounded even for very large files. Both paths report progress back to the main
  thread without blocking it.
- Bulk import validation dedupes codes within the uploaded file and reports the
  first 200 invalid rows in the UI (counts are exact; the sample table is capped
  for render performance).
