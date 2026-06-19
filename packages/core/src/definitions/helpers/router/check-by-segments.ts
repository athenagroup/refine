import { isParameter } from "./is-parameter";
import { removeLeadingTrailingSlashes } from "./remove-leading-trailing-slashes";
import { splitToSegments } from "./split-to-segments";

/**
 * This function checks if the `resourceRoute` matches the `route` by segments.
 * - First, trailing and leading slashes are removed
 * - Then, both are split to segments
 * - A `resourceRoute` matches when it is either an exact match or a **parent**
 *   (prefix) of the `route`. This allows sub-routes (e.g. a tabbed interface
 *   rendered under `show/:id`) to resolve to their parent resource without
 *   having to declare a separate "virtual" resource for every sub-route.
 * - Therefore the `resourceRoute` must not have more segments than the `route`,
 *   otherwise it can not be a parent of it.
 * - Each `resourceRoute` segment must be a parameter (e.g. `:id`) or be equal to
 *   the segment at the same position in the `route`.
 * - If all `resourceRoute` segments match, the function returns true, otherwise
 *   false.
 */
export const checkBySegments = (route: string, resourceRoute: string) => {
  const stdRoute = removeLeadingTrailingSlashes(route);
  const stdResourceRoute = removeLeadingTrailingSlashes(resourceRoute);

  const routeSegments = splitToSegments(stdRoute);
  const resourceRouteSegments = splitToSegments(stdResourceRoute);

  // a resource route with no segments (the root "/") should only match the root
  // route exactly. otherwise it would be a parent of every route and match all.
  if (resourceRouteSegments.length === 0) {
    return routeSegments.length === 0;
  }

  // if the resource route has more segments than the route, it can not be a
  // parent (prefix) of it, so they can't match.
  if (resourceRouteSegments.length > routeSegments.length) {
    return false;
  }

  return resourceRouteSegments.every((segment, index) => {
    return isParameter(segment) || segment === routeSegments[index];
  });
};
