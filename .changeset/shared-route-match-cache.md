---
"@athenagroup/refine-react-router": patch
---

perf: share the resource match of the `parse` hook across hook instances, so a navigation scans the resources once per pathname instead of once per hook.
