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

if (privateKey) {
  console.log('[DEBUG] Private key length:', privateKey.length);
  console.log('[DEBUG] Private key starts with:', privateKey.substring(0, 50));
  console.log('[DEBUG] Private key ends with:', privateKey.substring(privateKey.length - 50));
  console.log('[DEBUG] Has BEGIN marker:', privateKey.includes('-----BEGIN PRIVATE KEY-----'));
  console.log('[DEBUG] Has END marker:', privateKey.includes('-----END PRIVATE KEY-----'));
} else {
  console.log('[DEBUG] No private key available');
  console.log('[DEBUG] Base64 key available:', !!base64Key);
  console.log('[DEBUG] Raw key available:', !!rawPrivateKey);
  if (base64Key) console.log('[DEBUG] Base64 key length:', base64Key.length);
  if (rawPrivateKey) console.log('[DEBUG] Raw key length:', rawPrivateKey.length);
}

const hasAdminConfig = projectId && clientEmail && privateKey;

export const getAdminApp = () => {
  if (!hasAdminConfig) {
    const missingFields = [];
    if (!projectId) missingFields.push('projectId');
    if (!clientEmail) missingFields.push('clientEmail');
    if (!privateKey) missingFields.push('privateKey');

    throw new Error(
      `Missing Firebase admin credentials: ${missingFields.join(', ')}. Check FIREBASE_ADMIN_* environment variables.`,
    );
  }

  try {
    return getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
  } catch (error) {
    console.error('[DEBUG] Firebase admin initialization failed:', error);
    console.error('[DEBUG] Using projectId:', projectId);
    console.error('[DEBUG] Using clientEmail:', clientEmail);
    console.error('[DEBUG] Private key format check:');
    console.error('[DEBUG] - Length:', privateKey?.length);
    console.error('[DEBUG] - Type:', typeof privateKey);
    console.error('[DEBUG] - Starts correctly:', privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'));
    console.error('[DEBUG] - Ends correctly:', privateKey?.endsWith('-----END PRIVATE KEY-----'));
    throw error;
  }
};

export const getAdminDb = () => getFirestore(getAdminApp());
export const getAdminAuth = () => getAuth(getAdminApp());
