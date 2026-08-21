import { PipelineBoard } from "@/components/dashboard/pipeline-board";
import { LEAD_MANAGER_ROLES, PIPELINE_ROLES } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/require-role";
import { getLeads } from "@/lib/leads/data";
import { getTeamMembers } from "@/lib/team/data";

export default async function PipelinePage() {
  const session = await requireRole(PIPELINE_ROLES);
  // Only admins/managers see the reassignment dropdown, so only they should
  // pay the Firestore read — and, more importantly, only they should receive
  // the team directory in the client component's serialized RSC payload.
  const [leads, teamMembers] = await Promise.all([
    getLeads(session),
    LEAD_MANAGER_ROLES.includes(session.role) ? getTeamMembers() : Promise.resolve([]),
  ]);

  return <PipelineBoard leads={leads} teamMembers={teamMembers} currentRole={session.role} />;
}
