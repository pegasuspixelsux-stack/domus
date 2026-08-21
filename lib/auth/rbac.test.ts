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

  it("gives sales staff only pipeline and leads", () => {
    const items = getNavItemsForRole("sales");
    expect(items.map((item) => item.href)).toEqual(["/dashboard/pipeline", "/dashboard/leads"]);
  });

  it("gives managers the control panel, properties, pipeline, and leads, but not users", () => {
    const items = getNavItemsForRole("manager");
    expect(items.map((item) => item.href)).toEqual([
      "/dashboard",
      "/dashboard/properties",
      "/dashboard/pipeline",
      "/dashboard/leads",
    ]);
  });
});
