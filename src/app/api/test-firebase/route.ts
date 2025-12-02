import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    console.log('Testing Firebase connection...');
    console.log('FIREBASE_ADMIN_PROJECT_ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
    console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log('FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
    console.log('Has FIREBASE_ADMIN_PRIVATE_KEY:', !!process.env.FIREBASE_ADMIN_PRIVATE_KEY);

    const db = getAdminDb();

    // Try to read the test invite
    const testToken = '55dacc9c2a';
    const docPath = `inviteTokens/${testToken}`;
    console.log('Testing document path:', docPath);

    const snapshot = await db.doc(docPath).get();
    console.log('Document exists:', snapshot.exists);

    if (snapshot.exists) {
      const data = snapshot.data();
      console.log('Document data:', data);
      return NextResponse.json({
        success: true,
        exists: true,
        data,
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
      });
    } else {
      return NextResponse.json({
        success: true,
        exists: false,
        message: 'Document not found',
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
      });
    }
  } catch (error) {
    console.error('Firebase test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
    }, { status: 500 });
  }
}