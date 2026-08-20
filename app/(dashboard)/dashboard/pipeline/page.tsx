import { PipelineBoard } from "@/components/dashboard/pipeline-board";
import { requireRole } from "@/lib/auth/require-role";
import { getLeads } from "@/lib/leads/data";
import { getTeamMembers } from "@/lib/team/data";

export default async function PipelinePage() {
  const session = await requireRole(["admin", "sales"]);
  // Only admins see the reassignment dropdown, so only admins should pay the
  // Firestore read — and, more importantly, only admins should receive the
  // team directory in the client component's serialized RSC payload.
  const [leads, teamMembers] = await Promise.all([
    getLeads(session),
    session.role === "admin" ? getTeamMembers() : Promise.resolve([]),
  ]);

  return <PipelineBoard leads={leads} teamMembers={teamMembers} currentRole={session.role} />;
}
