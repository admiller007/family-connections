import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@familyconnections.app";
const ADMIN_PASSWORD = "admin123456";
const ADMIN_USERNAME = "admin";
const ADMIN_DISPLAY_NAME = "System Administrator";

export async function POST(request: NextRequest) {
  try {
    // Optional: Add a setup secret to prevent unauthorized access
    const setupSecret = request.headers.get("x-setup-secret");
    const expectedSecret = process.env.ADMIN_SETUP_SECRET || "change-me-in-production";

    if (setupSecret !== expectedSecret) {
      return Response.json(
        { error: "Unauthorized - Invalid setup secret" },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    let userId: string;
    let userCreated = false;

    try {
      // Try to get existing user
      const existingUser = await auth.getUserByEmail(ADMIN_EMAIL);
      userId = existingUser.uid;

      // Update password just in case
      await auth.updateUser(userId, {
        password: ADMIN_PASSWORD,
        displayName: ADMIN_DISPLAY_NAME,
      });
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // Create new admin user
        const newUser = await auth.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: ADMIN_DISPLAY_NAME,
          emailVerified: true,
        });
        userId = newUser.uid;
        userCreated = true;
      } else {
        throw error;
      }
    }

    // Create or update profile in Firestore with admin role
    await db.collection("profiles").doc(userId).set(
      {
        username: ADMIN_USERNAME,
        displayName: ADMIN_DISPLAY_NAME,
        email: ADMIN_EMAIL,
        role: "admin",
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return Response.json({
      success: true,
      userCreated,
      userId,
      message: userCreated ? "Admin user created successfully" : "Admin user updated successfully",
      credentials: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return Response.json(
      { error: "Failed to create admin user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
