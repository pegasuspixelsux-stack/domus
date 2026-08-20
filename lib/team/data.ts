import type { DocumentData } from "firebase-admin/firestore";
import type { Role } from "@/lib/auth/rbac";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export interface TeamMember {
  uid: string;
  displayName: string;
  role: Role;
}

function toTeamMember(uid: string, data: DocumentData): TeamMember {
  return {
    uid,
    displayName: data.displayName || data.email || uid,
    role: data.role,
  };
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const snapshot = await getFirebaseAdminFirestore().collection("users").get();
  return snapshot.docs
    // Deactivated users can't log in, so they must never be offered as an
    // assignee. Missing/undefined `active` is treated as active for backward
    // compatibility with pre-existing user docs.
    .filter((doc) => doc.data().active !== false)
    .map((doc) => toTeamMember(doc.id, doc.data()));
}
