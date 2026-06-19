---
"@refinedev/remix-router": patch
"@refinedev/nextjs-router": patch
---

fix: match resource by parent (prefix) routes so sub-routes resolve to their resource

Sub-routes (e.g. a tabbed interface rendered under `show/:id`) now resolve to their parent resource and action without having to declare a separate "virtual" resource for every sub-route. This builds on the parent (prefix) matching added to `matchResourceFromRoute` in `@refinedev/core`; param inference (including the record `id`) already iterates over the matched resource route, so the correct params are extracted on sub-routes.
