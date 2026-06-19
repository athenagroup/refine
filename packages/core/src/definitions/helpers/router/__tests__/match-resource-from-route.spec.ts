import { matchResourceFromRoute } from "../match-resource-from-route";

describe("matchResourceFromRoute", () => {
  it("should return found false if no resource is given", () => {
    const result = matchResourceFromRoute("/users", []);

    expect(result.found).toEqual(false);
  });

  it("should return found false if no route is given", () => {
    const result = matchResourceFromRoute("", [
      {
        name: "users",
        edit: "/users/edit/:id",
      },
    ]);

    expect(result.found).toEqual(false);
  });

  it("should return found true if route is found", () => {
    const result = matchResourceFromRoute("/users/edit/123", [
      {
        name: "users",
        edit: "/users/edit/:id",
      },
    ]);

    expect(result.found).toEqual(true);
  });

  it("should return the best one if multiple routes are found", () => {
    const result = matchResourceFromRoute("/users/orgs/edit/123", [
      {
        name: "users",
        edit: "/users/:type/edit/:id",
      },
      {
        name: "org-users",
        edit: "/users/orgs/edit/:id",
      },
    ]);

    expect(result.found).toEqual(true);
    expect(result.matchedRoute).toEqual("/users/orgs/edit/:id");
  });

  it("should match a sub-route to its parent resource action", () => {
    const result = matchResourceFromRoute("/users/show/123/planning", [
      {
        name: "users",
        list: "/users",
        show: "/users/show/:id",
        edit: "/users/edit/:id",
      },
    ]);

    expect(result.found).toEqual(true);
    expect(result.resource?.name).toEqual("users");
    expect(result.action).toEqual("show");
    expect(result.matchedRoute).toEqual("/users/show/:id");
  });

  it("should prefer the most specific (longest) match over a parent list route", () => {
    const result = matchResourceFromRoute("/users/show/123", [
      {
        name: "users",
        list: "/users",
        show: "/users/show/:id",
      },
    ]);

    expect(result.found).toEqual(true);
    expect(result.action).toEqual("show");
    expect(result.matchedRoute).toEqual("/users/show/:id");
  });

  it("should match deeply nested sub-routes without virtual resources", () => {
    const result = matchResourceFromRoute(
      "/organizational-unit/1/students/show/2/invoices",
      [
        {
          name: "students",
          list: "/organizational-unit/:organizationalUnitId/students",
          show: "/organizational-unit/:organizationalUnitId/students/show/:id",
          edit: "/organizational-unit/:organizationalUnitId/students/edit/:id",
        },
      ],
    );

    expect(result.found).toEqual(true);
    expect(result.resource?.name).toEqual("students");
    expect(result.action).toEqual("show");
    expect(result.matchedRoute).toEqual(
      "/organizational-unit/:organizationalUnitId/students/show/:id",
    );
  });

  it("should still match the parent list when only the list route is a prefix", () => {
    const result = matchResourceFromRoute("/users/show/123", [
      {
        name: "users",
        list: "/users",
      },
    ]);

    expect(result.found).toEqual(true);
    expect(result.action).toEqual("list");
    expect(result.matchedRoute).toEqual("/users");
  });
});
