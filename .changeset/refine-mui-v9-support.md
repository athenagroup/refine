---
"@athenagroup/refine-mui": minor
---

Add support for Material UI v9 and MUI X Data Grid v9.

- Replace the removed `@mui/material/Grid2` import with `@mui/material/Grid` (the unified Grid API, available since MUI v7) in `Breadcrumb` and `ErrorComponent`.
- Replace `@mui/lab/LoadingButton` with `@mui/material/Button` and its native `loading`/`loadingPosition` props (LoadingButton was promoted into Button and `@mui/lab` has no stable v9 release). Removes the `@mui/lab` dependency.
- Widen MUI peer/dependency ranges: `@mui/material`, `@mui/system`, `@mui/icons-material` to `^7.3.0 || ^9.0.0` and `@mui/x-data-grid` to `^8.24.0 || ^9.0.0`. This drops MUI v6 support; the data-grid range now also dedupes against a v9 host so consumers no longer get a second, nested grid copy.
