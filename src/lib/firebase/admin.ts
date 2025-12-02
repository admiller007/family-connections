import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// Try base64 encoded key first, fallback to regular key
const base64Key = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

let privateKey: string | undefined;

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

console.log('[DEBUG] Private key starts with:', privateKey?.substring(0, 30));
console.log('[DEBUG] Private key ends with:', privateKey?.substring(privateKey.length - 30));

const hasAdminConfig = projectId && clientEmail && privateKey;

export const getAdminApp = () => {
  if (!hasAdminConfig) {
    throw new Error(
      "Missing Firebase admin credentials. Check FIREBASE_ADMIN_* environment variables.",
    );
  }

  return getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
};

export const getAdminDb = () => getFirestore(getAdminApp());
export const getAdminAuth = () => getAuth(getAdminApp());
