export type Role = "admin" | "manager" | "sales";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  manager: "Gerente",
  sales: "Asesor",
};

// Managers get full operational access — every property, every lead,
// regardless of who it's assigned to — but never user management, which
// stays admin-only. Both requireRole() calls and UI-side role checks (e.g.
// "show the reassignment dropdown") should read these instead of repeating
// role lists, so the two stay in sync by construction.
export const PROPERTY_MANAGER_ROLES: Role[] = ["admin", "manager"];
export const LEAD_MANAGER_ROLES: Role[] = ["admin", "manager"];
export const PIPELINE_ROLES: Role[] = ["admin", "manager", "sales"];

export interface NavItem {
  label: string;
  href: string;
  roles: Role[];
}

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { label: "Panel de Control", href: "/dashboard", roles: PROPERTY_MANAGER_ROLES },
  { label: "Propiedades", href: "/dashboard/properties", roles: PROPERTY_MANAGER_ROLES },
  { label: "Embudo de Ventas", href: "/dashboard/pipeline", roles: PIPELINE_ROLES },
  { label: "Prospectos", href: "/dashboard/leads", roles: PIPELINE_ROLES },
  { label: "Usuarios", href: "/dashboard/users", roles: ["admin"] },
];

export function getDefaultRouteForRole(role: Role): string {
  return role === "sales" ? "/dashboard/pipeline" : "/dashboard";
}

export function getNavItemsForRole(role: Role): NavItem[] {
  return DASHBOARD_NAV_ITEMS.filter((item) => item.roles.includes(role));
}
