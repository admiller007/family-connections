import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
console.log('[DEBUG] Raw private key length:', rawPrivateKey?.length);
console.log('[DEBUG] First 50 chars:', rawPrivateKey?.substring(0, 50));
console.log('[DEBUG] Last 50 chars:', rawPrivateKey?.substring(rawPrivateKey.length - 50));

const privateKey = rawPrivateKey
  ? rawPrivateKey.replace(/\\n/g, "\n").trim()
  : undefined;

console.log('[DEBUG] Processed private key length:', privateKey?.length);
console.log('[DEBUG] Processed first 50 chars:', privateKey?.substring(0, 50));
console.log('[DEBUG] Processed last 50 chars:', privateKey?.substring(privateKey.length - 50));

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
