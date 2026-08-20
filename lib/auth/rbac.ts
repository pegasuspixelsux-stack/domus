export type Role = "admin" | "sales";

export interface NavItem {
  label: string;
  href: string;
  roles: Role[];
}

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { label: "Propiedades", href: "/dashboard/properties", roles: ["admin"] },
  { label: "Pipeline", href: "/dashboard/pipeline", roles: ["admin", "sales"] },
  { label: "Usuarios", href: "/dashboard/users", roles: ["admin"] },
];

export function getDefaultRouteForRole(role: Role): string {
  return role === "admin" ? "/dashboard/properties" : "/dashboard/pipeline";
}

export function getNavItemsForRole(role: Role): NavItem[] {
  return DASHBOARD_NAV_ITEMS.filter((item) => item.roles.includes(role));
}
