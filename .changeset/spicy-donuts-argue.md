---
"@athenagroup/refine-react-hook-form": patch
---

Fix all query data fields being put into the form (and submitted) after the initial load. The first data load now resets the form with only the registered subset of the record (mounted fields, current form values, and `useFieldArray` names), so unregistered record fields never enter the form. All paths written by the initial application are marked as synced, so later sync passes can no longer re-apply stale query data over user edits — e.g. resurrecting a removed `useFieldArray` row whose inputs are only detected as "newly mounted" after the user has already changed the array.
