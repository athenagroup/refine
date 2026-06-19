---
"@refinedev/core": patch
"@refinedev/react-router": patch
---

fix: match resource by parent (prefix) routes so sub-routes resolve to their resource

Resource matching (`matchResourceFromRoute`) previously required the current route to match a resource's action route **exactly** by segment count. This made it impossible to render nested/sub-routes (e.g. a tabbed interface under `show/:id`) without declaring a separate "virtual" resource for every sub-route, which also broke active sidebar item selection, breadcrumbs and other resource-derived behavior.

A resource action route now also matches when it is a **parent (prefix)** of the current route. The most specific match wins: the route with the most matching segments is preferred, and exact matches are always preferred over parent matches, so existing behavior is preserved. Among equally specific matches the least parametrized one is still chosen.

With this change, a single resource definition is enough to support sub-routes:

```tsx
{
  name: "students",
  list: "/organizational-unit/:organizationalUnitId/students",
  show: "/organizational-unit/:organizationalUnitId/students/show/:id",
  edit: "/organizational-unit/:organizationalUnitId/students/edit/:id",
}
```

```tsx
// React Router – nested routes under `show/:id` now all resolve to the
// `students` resource with the `show` action and the correct `id`.
<Route path="organizational-unit/:organizationalUnitId/students">
  <Route path="show/:id" Component={StudentShow}>
    <Route index Component={StudentDetail} />
    <Route path="planning" Component={StudentPlanning} />
    <Route path="projects" Component={StudentProjects} />
    <Route path="invoices" Component={StudentInvoices} />
  </Route>
</Route>
```

In `@refinedev/react-router`, the `parse` fallback that infers params from the matched route now matches the resource route as a prefix (`end: false`), so params (including the record `id`) are still extracted when the component reading them is rendered outside the route tree.
