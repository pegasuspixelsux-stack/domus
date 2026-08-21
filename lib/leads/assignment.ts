import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getTeamMembers } from "@/lib/team/data";

const COLLECTION = "leads";

/**
 * Picks the active salesperson with the fewest total leads currently
 * assigned. A single equality-filter count query per candidate keeps this
 * index-free — no composite index needs deploying for a status filter on
 * top of it, which matters here since nothing in this repo manages Firestore
 * indexes for the admin to deploy.
 *
 * Deliberately not in lib/leads/actions.ts (a "use server" file): every
 * export from a "use server" file becomes a client-callable server action,
 * and this has no business being invokable directly from the browser. Both
 * the prequalification wizard's action and the chat tool's bookAppointment
 * import it from here instead.
 */
export async function pickRoundRobinAssignee(): Promise<{ uid: string } | null> {
  const salespeople = (await getTeamMembers()).filter((member) => member.role === "sales");
  if (salespeople.length === 0) return null;

  const firestore = getFirebaseAdminFirestore();
  const counted = await Promise.all(
    salespeople.map(async (person) => {
      const snapshot = await firestore
        .collection(COLLECTION)
        .where("assignedTo", "==", person.uid)
        .count()
        .get();
      return { uid: person.uid, count: snapshot.data().count };
    }),
  );

  return counted.reduce((fewest, candidate) => (candidate.count < fewest.count ? candidate : fewest));
}
