import type { ResourceActionRoute } from "./get-action-routes-from-resource";
import { isParameter } from "./is-parameter";
import { removeLeadingTrailingSlashes } from "./remove-leading-trailing-slashes";
import { splitToSegments } from "./split-to-segments";

/**
 * Picks the most eligible route from the given matched routes.
 * - If there's only one route, it returns it.
 * - Matched routes may have different number of segments, since a route can
 *   match both a parent (prefix) route and a more specific one. The most
 *   specific match is the one with the most segments, so only the longest
 *   matches are considered. (An exact match is always the longest possible
 *   match for a given route, so exact matches are preferred over parent ones.)
 * - If there's more than one route with the same length, it picks the best
 *   non-greedy (least parametrized) match.
 */
export const pickMatchedRoute = (
  routes: ResourceActionRoute[],
): ResourceActionRoute | undefined => {
  // these routes are all matched, we should pick the most specific one and,
  // among equally specific ones, the least parametrized one

  // no routes, no match
  if (routes.length === 0) {
    return undefined;
  }

  // no need to calculate the route segments if there's only one route
  if (routes.length === 1) {
    return routes[0];
  }

  // remove trailing and leading slashes
  // split them to segments
  const sanitizedRoutes = routes.map((route) => ({
    ...route,
    splitted: splitToSegments(removeLeadingTrailingSlashes(route.route)),
  }));

  // routes may have a different number of segments when a route matches a
  // parent (prefix) route as well as a more specific one. the most specific
  // match is the one with the most segments, so we only keep the longest
  // matches and pick the least parametrized one among them.
  const segmentsCount = Math.max(
    ...sanitizedRoutes.map((route) => route.splitted.length),
  );

  let eligibleRoutes = sanitizedRoutes.filter(
    (route) => route.splitted.length === segmentsCount,
  );

  // loop through the segments
  for (let i = 0; i < segmentsCount; i++) {
    const nonParametrizedRoutes = eligibleRoutes.filter(
      (route) => !isParameter(route.splitted[i]),
    );

    if (nonParametrizedRoutes.length === 0) {
      // keep the eligible routes as they are
      continue;
    }
    if (nonParametrizedRoutes.length === 1) {
      // no need to continue, we found the route
      eligibleRoutes = nonParametrizedRoutes;
      break;
    }

    // we have more than one non-parametrized route, we need to check the next segment
    eligibleRoutes = nonParametrizedRoutes;
  }

  return eligibleRoutes[0];
};
