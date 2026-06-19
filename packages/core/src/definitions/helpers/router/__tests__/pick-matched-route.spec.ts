import { pickMatchedRoute } from "../pick-matched-route";

describe("pickMatchedRoute", () => {
  it("should return the route with no params", () => {
    const routes = [
      {
        route: "/users/edit/123",
        action: "edit" as const,
        resource: { name: "users" },
      },
      {
        route: "users/:action/:id/",
        action: "edit" as const,
        resource: { name: "users" },
      },
      {
        route: "/users/:action/:id",
        action: "edit" as const,
        resource: { name: "users" },
      },
      {
        route: "/users/edit/:id",
        action: "edit" as const,
        resource: { name: "users" },
      },
    ];

    const picked = pickMatchedRoute(routes);

    expect(picked?.route).toEqual("/users/edit/123");
  });

  it("should return the route with least params", () => {
    const routes = [
      {
        route: "/users/:action/:id",
        action: "edit" as const,
        resource: { name: "users" },
      },
      {
        route: "/users/edit/:id",
        action: "edit" as const,
        resource: { name: "users" },
      },
    ];

    const picked = pickMatchedRoute(routes);

    expect(picked?.route).toEqual("/users/edit/:id");
  });

  it("should return the latest parametrized route", () => {
    const routes = [
      {
        route: "/users/page/:action/:id",
        action: "edit" as const,
        resource: { name: "users" },
      },
      {
        route: "/users/page/list/:id/",
        action: "edit" as const,
        resource: { name: "users" },
      },
    ];

    const picked = pickMatchedRoute(routes);

    expect(picked?.route).toEqual("/users/page/list/:id/");
  });

  it("should return the latest parametrized route with single", () => {
    const routes = [
      {
        route: "/users/:org/list/123",
        action: "edit" as const,
        resource: { name: "users" },
      },
      {
        route: "/users/refine/list/:id",
        action: "edit" as const,
        resource: { name: "users" },
      },
    ];

    const picked = pickMatchedRoute(routes);

    expect(picked?.route).toEqual("/users/refine/list/:id");
  });

  it("should prefer the most specific (longest) route", () => {
    const routes = [
      {
        route: "/users",
        action: "list" as const,
        resource: { name: "users" },
      },
      {
        route: "/users/show/:id",
        action: "show" as const,
        resource: { name: "users" },
      },
    ];

    const picked = pickMatchedRoute(routes);

    expect(picked?.route).toEqual("/users/show/:id");
  });

  it("should pick the least parametrized route among the longest matches", () => {
    const routes = [
      {
        route: "/users",
        action: "list" as const,
        resource: { name: "users" },
      },
      {
        route: "/users/:type/show/:id",
        action: "show" as const,
        resource: { name: "users" },
      },
      {
        route: "/users/orgs/show/:id",
        action: "show" as const,
        resource: { name: "org-users" },
      },
    ];

    const picked = pickMatchedRoute(routes);

    expect(picked?.route).toEqual("/users/orgs/show/:id");
  });
});
