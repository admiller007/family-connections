require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

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

async function testInvite(token) {
  try {
    console.log("Testing invite token:", token);
    console.log("Using project:", projectId);

    const docPath = `inviteTokens/${token}`;
    console.log("Document path:", docPath);

    const snapshot = await db.doc(docPath).get();
    console.log("Document exists:", snapshot.exists);

    if (snapshot.exists) {
      console.log("Document data:", snapshot.data());
    } else {
      console.log("Document not found");

      // Let's also try listing all inviteTokens to see what's there
      console.log("\nListing all invite tokens:");
      const collection = await db.collection('inviteTokens').get();
      console.log("Total documents in inviteTokens:", collection.size);
      collection.docs.forEach(doc => {
        console.log("- Token:", doc.id, "Data:", doc.data());
      });
    }
  } catch (error) {
    console.error("Error testing invite:", error);
  }
}

const token = process.argv[2] || "55dacc9c2a";
testInvite(token).catch(console.error);