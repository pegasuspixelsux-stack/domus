import { LeadsTable } from "@/components/dashboard/leads-table";
import { LEAD_MANAGER_ROLES, PIPELINE_ROLES } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/require-role";
import { getLeads } from "@/lib/leads/data";
import { getTeamMembers } from "@/lib/team/data";

export default async function LeadsPage() {
  const session = await requireRole(PIPELINE_ROLES);
  // Same optimization as the pipeline page: only admins/managers get the
  // reassignment dropdown, so only they should pay for (and receive) the
  // team directory.
  const [leads, teamMembers] = await Promise.all([
    getLeads(session),
    LEAD_MANAGER_ROLES.includes(session.role) ? getTeamMembers() : Promise.resolve([]),
  ]);

  return <LeadsTable leads={leads} teamMembers={teamMembers} currentRole={session.role} />;
}
