import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return Response.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Find the user code
    const userCodesSnapshot = await db
      .collection("userCodes")
      .where("email", "==", email)
      .where("code", "==", code.toUpperCase())
      .where("status", "==", "pending")
      .get();

    if (userCodesSnapshot.empty) {
      return Response.json(
        { error: "Invalid code or email" },
        { status: 400 }
      );
    }

    const userCodeDoc = userCodesSnapshot.docs[0];
    const userCodeData = userCodeDoc.data();

    // Check if code is expired
    if (userCodeData.expiresAt && userCodeData.expiresAt.toDate() < new Date()) {
      return Response.json(
        { error: "This code has expired" },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(16).toString("hex");

    let userId: string;

    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      userId = existingUser.uid;

      // Update the user's password
      await auth.updateUser(userId, {
        password: tempPassword,
      });
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // Create new Firebase Auth user
        const newUser = await auth.createUser({
          email,
          password: tempPassword,
          displayName: userCodeData.displayName || email.split("@")[0],
          emailVerified: true, // Since admin created them, we trust the email
        });
        userId = newUser.uid;
      } else {
        throw error;
      }
    }

    // Mark code as used
    await userCodeDoc.ref.update({
      status: "used",
      usedAt: new Date(),
      userId,
    });

    return Response.json({
      success: true,
      tempPassword,
      message: "Code verified successfully",
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    return Response.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
