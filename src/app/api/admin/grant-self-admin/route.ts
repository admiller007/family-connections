import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const auth = getAdminAuth();

    // Verify the user is authenticated
    let currentUser;
    try {
      currentUser = await auth.verifyIdToken(token);
    } catch (error) {
      return Response.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const db = getAdminDb();

    // Get or create profile for current user
    const profileRef = db.collection("profiles").doc(currentUser.uid);
    const profileDoc = await profileRef.get();

    const profileData = profileDoc.exists ? profileDoc.data() : {};

    // Update profile with admin role
    await profileRef.set(
      {
        ...profileData,
        role: "admin",
        isAdmin: true,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return Response.json({
      success: true,
      message: "Admin role granted successfully",
      userId: currentUser.uid,
      email: currentUser.email,
    });
  } catch (error) {
    console.error("Error granting admin role:", error);
    return Response.json(
      { error: "Failed to grant admin role", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
