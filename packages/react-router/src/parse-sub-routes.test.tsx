import { renderHook } from "@testing-library/react";
import { useParsed, type IResourceItem } from "@refinedev/core";

import { routerProvider } from "./bindings";
import { TestWrapper } from "./test/index";

const students: IResourceItem = {
  name: "students",
  list: "/organizational-unit/:organizationalUnitId/students",
  show: "/organizational-unit/:organizationalUnitId/students/show/:id",
  edit: "/organizational-unit/:organizationalUnitId/students/edit/:id",
  create: "/organizational-unit/:organizationalUnitId/students/create",
};

const renderUseParsed = (path: string) =>
  renderHook(() => useParsed(), {
    wrapper: TestWrapper({
      routerProvider,
      resources: [students],
      routerInitialEntries: [path],
    }),
  });

describe("routerProvider.parse with sub-routes", () => {
  it("matches the exact show route to the resource", () => {
    const { result } = renderUseParsed(
      "/organizational-unit/1/students/show/2",
    );

    expect(result.current.resource?.name).toBe("students");
    expect(result.current.action).toBe("show");
    expect(result.current.id).toBe("2");
    expect(result.current.params?.organizationalUnitId).toBe("1");
  });

  it("matches a sub-route (tab) to the parent show route without virtual resources", () => {
    const { result } = renderUseParsed(
      "/organizational-unit/1/students/show/2/planning",
    );

    // the sub-route resolves to the same resource and action as the parent
    expect(result.current.resource?.name).toBe("students");
    expect(result.current.action).toBe("show");
    expect(result.current.id).toBe("2");
    expect(result.current.params?.organizationalUnitId).toBe("1");
  });

  it("matches a deeper sub-route to the parent show route", () => {
    const { result } = renderUseParsed(
      "/organizational-unit/1/students/show/2/invoices",
    );

    expect(result.current.resource?.name).toBe("students");
    expect(result.current.action).toBe("show");
    expect(result.current.id).toBe("2");
  });
});
