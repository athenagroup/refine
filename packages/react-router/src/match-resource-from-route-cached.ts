import { type IResourceItem, matchResourceFromRoute } from "@refinedev/core";

type MatchResult = ReturnType<typeof matchResourceFromRoute>;

/**
 * Maximum number of pathnames kept per `resources` array.
 * The least recently used pathname is evicted first.
 */
export const MATCH_CACHE_LIMIT = 100;

/**
 * Cached results, keyed by the `resources` array and then by pathname.
 * - The `WeakMap` drops the entries of a `resources` array as soon as that
 *   array is garbage collected, and a new array never hits an old entry.
 * - Module level on purpose: every `parse` hook instance (one per `useList`,
 *   `useCan`, `useParsed`, ...) shares one result per `(resources, pathname)`.
 * - Holds no browser state, so it is safe on the server.
 */
const cache = new WeakMap<IResourceItem[], Map<string, MatchResult>>();

/**
 * Same as `matchResourceFromRoute` from `@refinedev/core`, but computes the
 * match only once per `(resources, pathname)` pair.
 *
 * `matchResourceFromRoute` scans every action route of every resource. The
 * `parse` hook runs it per hook instance, so without this cache a single
 * navigation repeats the same scan for every hook that reads the route.
 */
export const matchResourceFromRouteCached = (
  pathname: string,
  resources: IResourceItem[],
): MatchResult => {
  let byPathname = cache.get(resources);

  if (!byPathname) {
    byPathname = new Map();
    cache.set(resources, byPathname);
  }

  const cached = byPathname.get(pathname);

  if (cached) {
    // move to the end, so it is the most recently used entry
    byPathname.delete(pathname);
    byPathname.set(pathname, cached);
    return cached;
  }

  const result = matchResourceFromRoute(pathname, resources);

  if (byPathname.size >= MATCH_CACHE_LIMIT) {
    // a `Map` iterates in insertion order, so the first key is the oldest one
    const oldest = byPathname.keys().next();
    if (!oldest.done) {
      byPathname.delete(oldest.value);
    }
  }

  byPathname.set(pathname, result);

  return result;
};
