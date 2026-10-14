---
"@athenagroup/refine-mui": patch
---

fix(mui): stabilize `useDataGrid`'s `dataGridProps` identity to stop full-grid re-renders

`useDataGrid` returned a brand-new `dataGridProps` object — with fresh handler closures (`onSortModelChange`, `onFilterModelChange`, `onPaginationModelChange`, `onStateChange`, `processRowUpdate`), a fresh `paginationModel`, and a fresh `rows` fallback — on every render. MUI X memoizes on the incoming props object and exposes it through its internal `rootProps` context, which every (memoized) `GridRow`, column header, and panel subscribes to. A fresh object each render therefore busts that context and re-renders the entire visible viewport on every parent render (the "GridRow:25" pattern), regardless of MUI's own `React.memo`/`fastMemo`.

The returned `dataGridProps` object and all of its members now keep a stable identity across renders and only change when the grid's content actually changes:

- handlers are wrapped in `useCallback` (closing over already-stable state setters);
- `paginationModel`/`onPaginationModelChange` are memoized;
- `rows` falls back to a shared module-level empty array (`data?.data || EMPTY_ROWS`) so the no-data case no longer allocates a fresh `[]` and forces a full row-tree rebuild;
- `processRowUpdate` is kept stable via a ref, since `useUpdate`'s `mutate` is not referentially stable;
- the whole `dataGridProps` object is wrapped in `useMemo`.

This is behavior-preserving — only the referential identity of the returned props is stabilized — and lets MUI X's row/header/panel memoization bail out, so navigating to or re-rendering a grid page no longer re-renders the full viewport.

Also fixes two related issues in `useDataGrid`:

- **Column types now tracked in state instead of a ref.** `transformedFilterModel` depended on `columnsTypes.current` in its `useMemo` deps; a ref mutation doesn't trigger a re-render, so the memo could serve a stale filter model (e.g. a number column's `eq` operator mapped to `equals` instead of `=`) until an unrelated render coincided. `columnsTypes` is now state, updated from `onStateChange` only when the types actually change (returning the previous reference otherwise so re-renders stay rare).
- **`rowCount` can now drop to `0`.** The cached row count only updated when `data.total` was truthy, so a genuine transition to zero rows (empty resource, restrictive filter, or switching to a resource that returns `total: 0`) kept the previous larger count and produced phantom pagination pages. It now updates whenever `data` is present.
