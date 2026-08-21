import { describe, expect, it } from "vitest";
import { DASHBOARD_NAV_ITEMS, getDefaultRouteForRole, getNavItemsForRole } from "./rbac";

describe("getDefaultRouteForRole", () => {
  it("sends admins to the control panel", () => {
    expect(getDefaultRouteForRole("admin")).toBe("/dashboard");
  });

  it("sends sales staff to the pipeline page", () => {
    expect(getDefaultRouteForRole("sales")).toBe("/dashboard/pipeline");
  });

  it("sends managers to the control panel", () => {
    expect(getDefaultRouteForRole("manager")).toBe("/dashboard");
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

  it("gives managers the control panel, properties, and pipeline, but not users", () => {
    const items = getNavItemsForRole("manager");
    expect(items.map((item) => item.href)).toEqual([
      "/dashboard",
      "/dashboard/properties",
      "/dashboard/pipeline",
    ]);
  });
});
