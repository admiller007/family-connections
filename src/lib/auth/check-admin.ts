import { getAdminDb } from "@/lib/firebase/admin";

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const db = getAdminDb();
    const profileDoc = await db.collection("profiles").doc(userId).get();

    if (!profileDoc.exists) {
      return false;
    }

    const profile = profileDoc.data();
    return profile?.isAdmin === true || profile?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
