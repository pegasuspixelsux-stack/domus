import { describe, expect, it } from "vitest";
import { DASHBOARD_NAV_ITEMS, getDefaultRouteForRole, getNavItemsForRole } from "./rbac";

describe("getDefaultRouteForRole", () => {
  it("sends admins to the properties page", () => {
    expect(getDefaultRouteForRole("admin")).toBe("/dashboard/properties");
  });

  it("sends sales staff to the pipeline page", () => {
    expect(getDefaultRouteForRole("sales")).toBe("/dashboard/pipeline");
  });
});

describe("getNavItemsForRole", () => {
  it("gives admins every nav item", () => {
    expect(getNavItemsForRole("admin")).toEqual(DASHBOARD_NAV_ITEMS);
  });

  it("gives sales staff only the pipeline item", () => {
    const items = getNavItemsForRole("sales");
    expect(items).toHaveLength(1);
    expect(items[0].href).toBe("/dashboard/pipeline");
  });
});
