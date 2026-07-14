---
"@athenagroup/refine-core": patch
---

fix(core): include tenantId in data query keys

The data hooks now include the combined meta's `tenantId` in their query keys, so a tenant switch is a cache miss with per-tenant caching instead of serving the previous tenant's cached data.
