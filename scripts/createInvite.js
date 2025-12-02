require("dotenv").config({ path: ".env.local" });
const crypto = require("crypto");
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

const db = admin.firestore();
const { FieldValue, Timestamp } = require("firebase-admin/firestore");

async function main() {
  const token = crypto.randomBytes(5).toString("hex");
  const familyId = process.argv[2] || "miller-family";
  const familyName = process.argv[3] || "Miller Crew";
  const label = process.argv[4] || "Family test link";
  const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.collection("inviteTokens").doc(token).set({
    token,
    familyId,
    familyName,
    label,
    status: "active",
    createdBy: "admin-script",
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://family-connections-e5uhyoeip-lotterys-projects-1f9a4a6c.vercel.app";
  const inviteUrl = `${baseUrl}/invite/${token}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Join today's Family Connections puzzle: ${inviteUrl}`,
  )}`;

  console.log("Invite token:", token);
  console.log("Invite URL:", inviteUrl);
  console.log("WhatsApp link:", whatsapp);
  console.log("Project ID:", projectId);
  console.log("Family ID:", familyId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
