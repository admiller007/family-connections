require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// Try base64 encoded key first, fallback to regular key
const base64Key = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

let privateKey;

if (base64Key) {
  try {
    privateKey = Buffer.from(base64Key, 'base64').toString('utf8');
    console.log('[DEBUG] Using base64 decoded private key');
  } catch (error) {
    console.log('[DEBUG] Base64 decode failed, falling back to raw key');
  }
}

if (!privateKey && rawPrivateKey) {
  privateKey = rawPrivateKey.replace(/\\n/g, "\n").trim();
  console.log('[DEBUG] Using raw private key');
}

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Missing Firebase admin credentials in environment variables.");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@familyconnections.app";
const ADMIN_PASSWORD = "admin123456";
const ADMIN_USERNAME = "admin";
const ADMIN_DISPLAY_NAME = "System Administrator";

async function main() {
  console.log("Creating admin user...\n");

  let userId;
  let userCreated = false;

  try {
    // Try to get existing user
    const existingUser = await auth.getUserByEmail(ADMIN_EMAIL);
    userId = existingUser.uid;
    console.log("✓ Admin user already exists");
    console.log("  UID:", userId);

    // Update password just in case
    await auth.updateUser(userId, {
      password: ADMIN_PASSWORD,
      displayName: ADMIN_DISPLAY_NAME,
    });
    console.log("✓ Admin password updated");
  } catch (error) {
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
      console.log("✓ Admin user created");
      console.log("  UID:", userId);
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log("✓ Admin profile created/updated in Firestore");
  console.log("✓ Admin role granted\n");

  console.log("=" .repeat(50));
  console.log("ADMIN CREDENTIALS");
  console.log("=" .repeat(50));
  console.log("Email:    ", ADMIN_EMAIL);
  console.log("Password: ", ADMIN_PASSWORD);
  console.log("=" .repeat(50));
  console.log("\n⚠️  IMPORTANT: Change this password after first login!");
  console.log("\nYou can now log in at: /login");
  console.log("Then navigate to: /admin/users to create new users\n");
}

main().catch((error) => {
  console.error("Error creating admin user:", error);
  process.exit(1);
});
