import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isUserAdmin } from "@/lib/auth/check-admin";
import { NextRequest } from "next/server";

// Generate a random 8-character alphanumeric code
function generateUserCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar looking chars like 0/O, 1/I
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

    // Check if user is admin
    const adminStatus = await isUserAdmin(currentUser.uid);
    if (!adminStatus) {
      return Response.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, displayName } = body;

    if (!email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const code = generateUserCode();

    // Check if email already exists in userCodes collection
    const existingCodesSnapshot = await db
      .collection("userCodes")
      .where("email", "==", email)
      .where("status", "==", "pending")
      .get();

    if (!existingCodesSnapshot.empty) {
      return Response.json(
        { error: "A pending code already exists for this email" },
        { status: 400 }
      );
    }

    // Check if user already exists in Firebase Auth
    try {
      await auth.getUserByEmail(email);
      return Response.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    } catch (error: any) {
      // User doesn't exist, which is what we want
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Create user code document
    const userCodeRef = db.collection("userCodes").doc();
    await userCodeRef.set({
      email,
      displayName: displayName || null,
      code,
      createdBy: currentUser.uid,
      createdAt: new Date(),
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    return Response.json({
      success: true,
      id: userCodeRef.id,
      email,
      code,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Error creating user code:", error);
    return Response.json(
      { error: "Failed to create user code" },
      { status: 500 }
    );
  }
}
