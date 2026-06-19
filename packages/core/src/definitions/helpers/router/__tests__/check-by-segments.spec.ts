import { checkBySegments } from "../check-by-segments";

describe("checkBySegments", () => {
  it("should return true if the route and resourceRoute match by segments", () => {
    const result = checkBySegments("/users/edit/123", "/users/edit/:id");

    expect(result).toEqual(true);
  });

  it("should return false if the route and resourceRoute don't match by segments", () => {
    const result = checkBySegments("/users/edit/123", "/posts/edit/:id/");

    expect(result).toEqual(false);
  });

  it("should return false if the resource route has more segments than the route", () => {
    const result = checkBySegments("/users/edit/123", "/users/edit/:id/step");

    expect(result).toEqual(false);
  });

  it("should return true if the resource route is a parent (prefix) of the route", () => {
    // sub-routes (e.g. a tabbed interface under `show/:id`) should still match
    // the parent resource route.
    const result = checkBySegments(
      "/users/show/123/planning",
      "/users/show/:id",
    );

    expect(result).toEqual(true);
  });

  it("should return true for a deeply nested sub-route", () => {
    const result = checkBySegments(
      "/organizational-unit/1/students/show/2/planning",
      "/organizational-unit/:organizationalUnitId/students/show/:id",
    );

    expect(result).toEqual(true);
  });

  it("should return true if the list route is a parent of the route", () => {
    const result = checkBySegments("/users/show/123", "/users");

    expect(result).toEqual(true);
  });

  it("should not let the root route match every route", () => {
    expect(checkBySegments("/users/show/123", "/")).toEqual(false);
    expect(checkBySegments("/", "/")).toEqual(true);
  });

  it("should return false if a parent segment does not match", () => {
    const result = checkBySegments(
      "/users/show/123/planning",
      "/posts/show/:id",
    );

    expect(result).toEqual(false);
  });
});
