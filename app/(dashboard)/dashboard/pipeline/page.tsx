import { PipelineBoard } from "@/components/dashboard/pipeline-board";
import { requireRole } from "@/lib/auth/require-role";
import { getLeads } from "@/lib/leads/data";
import { getTeamMembers } from "@/lib/team/data";

export default async function PipelinePage() {
  const session = await requireRole(["admin", "sales"]);
  const [leads, teamMembers] = await Promise.all([getLeads(session), getTeamMembers()]);

  return <PipelineBoard leads={leads} teamMembers={teamMembers} currentRole={session.role} />;
}
