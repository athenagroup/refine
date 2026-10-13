import { renderHook } from "@testing-library/react";
import * as core from "@refinedev/core";
import { type IResourceItem, useParsed } from "@refinedev/core";
import { vi } from "vitest";

import { routerProvider } from "./bindings";
import {
  MATCH_CACHE_LIMIT,
  matchResourceFromRouteCached,
} from "./match-resource-from-route-cached";
import { TestWrapper } from "./test/index";

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();
  return {
    ...actual,
    matchResourceFromRoute: vi.fn(actual.matchResourceFromRoute),
  };
});

const matchSpy = vi.mocked(core.matchResourceFromRoute);

const uncached = async (pathname: string, resources: IResourceItem[]) => {
  const actual =
    await vi.importActual<typeof import("@refinedev/core")>("@refinedev/core");
  return actual.matchResourceFromRoute(pathname, resources);
};

const createResources = (): IResourceItem[] => [
  {
    name: "students",
    list: "/organizational-unit/:organizationalUnitId/students",
    show: "/organizational-unit/:organizationalUnitId/students/show/:id",
    edit: "/organizational-unit/:organizationalUnitId/students/edit/:id",
    create: "/organizational-unit/:organizationalUnitId/students/create",
    clone: "/organizational-unit/:organizationalUnitId/students/clone/:id",
  },
  {
    name: "courses",
    list: "/courses",
    show: "/courses/show/:id",
    edit: "/courses/edit/:id",
    create: "/courses/create",
  },
];

describe("matchResourceFromRouteCached", () => {
  beforeEach(() => {
    matchSpy.mockClear();
  });

  it.each([
    ["list", "/organizational-unit/1/students"],
    ["show", "/organizational-unit/1/students/show/2"],
    ["edit", "/organizational-unit/1/students/edit/2"],
    ["create", "/organizational-unit/1/students/create"],
    ["clone", "/organizational-unit/1/students/clone/2"],
    ["sub-route under show", "/organizational-unit/1/students/show/2/planning"],
    ["list of another resource", "/courses"],
    ["unmatched path", "/does-not-exist"],
  ])("returns the same result as uncached for %s", async (_, pathname) => {
    const resources = createResources();

    const expected = await uncached(pathname, resources);

    expect(matchResourceFromRouteCached(pathname, resources)).toEqual(expected);
    // the cached result is the same as well
    expect(matchResourceFromRouteCached(pathname, resources)).toEqual(expected);
  });

  it("keeps the matched route of a sub-route", () => {
    const resources = createResources();

    const result = matchResourceFromRouteCached(
      "/organizational-unit/1/students/show/2/planning",
      resources,
    );

    expect(result.found).toBe(true);
    expect(result.resource?.name).toBe("students");
    expect(result.action).toBe("show");
    expect(result.matchedRoute).toBe(
      "/organizational-unit/:organizationalUnitId/students/show/:id",
    );
  });

  it("does not redo the scan for the same resources and pathname", () => {
    const resources = createResources();

    const first = matchResourceFromRouteCached("/courses/show/1", resources);
    const second = matchResourceFromRouteCached("/courses/show/1", resources);

    expect(second).toBe(first);
    expect(matchSpy).toHaveBeenCalledTimes(1);
  });

  it("caches unmatched paths as well", () => {
    const resources = createResources();

    matchResourceFromRouteCached("/does-not-exist", resources);
    const second = matchResourceFromRouteCached("/does-not-exist", resources);

    expect(second.found).toBe(false);
    expect(matchSpy).toHaveBeenCalledTimes(1);
  });

  it("computes each pathname separately", () => {
    const resources = createResources();

    const list = matchResourceFromRouteCached("/courses", resources);
    const show = matchResourceFromRouteCached("/courses/show/1", resources);

    expect(list.action).toBe("list");
    expect(show.action).toBe("show");
    expect(matchSpy).toHaveBeenCalledTimes(2);
  });

  it("recomputes for a new resources array", () => {
    const resources = createResources();
    const first = matchResourceFromRouteCached("/courses/show/1", resources);

    const changedResources = createResources().map((resource) =>
      resource.name === "courses"
        ? { ...resource, show: "/courses/detail/:id" }
        : resource,
    );
    const second = matchResourceFromRouteCached(
      "/courses/show/1",
      changedResources,
    );

    expect(matchSpy).toHaveBeenCalledTimes(2);
    expect(first.found).toBe(true);
    expect(second).not.toBe(first);
    // the show route moved, so the old path falls back to the list route
    expect(second.action).toBe("list");
    expect(second.matchedRoute).toBe("/courses");
  });

  it("evicts the least recently used pathname when the limit is reached", () => {
    const resources = createResources();

    for (let i = 0; i < MATCH_CACHE_LIMIT; i++) {
      matchResourceFromRouteCached(`/courses/show/${i}`, resources);
    }
    expect(matchSpy).toHaveBeenCalledTimes(MATCH_CACHE_LIMIT);

    // use the oldest entry, so the second oldest becomes the oldest
    matchResourceFromRouteCached("/courses/show/0", resources);
    expect(matchSpy).toHaveBeenCalledTimes(MATCH_CACHE_LIMIT);

    // one more pathname evicts "/courses/show/1"
    matchResourceFromRouteCached("/courses/show/new", resources);
    expect(matchSpy).toHaveBeenCalledTimes(MATCH_CACHE_LIMIT + 1);

    // still cached
    matchResourceFromRouteCached("/courses/show/0", resources);
    matchResourceFromRouteCached("/courses/show/2", resources);
    expect(matchSpy).toHaveBeenCalledTimes(MATCH_CACHE_LIMIT + 1);

    // evicted, so it is computed again
    matchResourceFromRouteCached("/courses/show/1", resources);
    expect(matchSpy).toHaveBeenCalledTimes(MATCH_CACHE_LIMIT + 2);
  });
});

describe("routerProvider.parse with the shared match cache", () => {
  beforeEach(() => {
    matchSpy.mockClear();
  });

  it("matches once for every hook instance on the same path", () => {
    const { result, rerender } = renderHook(
      () => [useParsed(), useParsed(), useParsed(), useParsed()],
      {
        wrapper: TestWrapper({
          routerProvider,
          resources: createResources(),
          routerInitialEntries: [
            "/organizational-unit/7/students/show/3/planning",
          ],
        }),
      },
    );

    for (const parsed of result.current) {
      expect(parsed.resource?.name).toBe("students");
      expect(parsed.action).toBe("show");
      expect(parsed.id).toBe("3");
      expect(parsed.params?.organizationalUnitId).toBe("7");
    }

    rerender();

    const pathnameCalls = matchSpy.mock.calls.filter(
      ([pathname]) =>
        pathname === "/organizational-unit/7/students/show/3/planning",
    );
    expect(pathnameCalls).toHaveLength(1);
  });
});
