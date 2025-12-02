import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const base64Key = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
    const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    let privateKey: string | undefined;
    let keySource = 'none';

    if (base64Key) {
      try {
        privateKey = Buffer.from(base64Key, 'base64').toString('utf8');
        keySource = 'base64';
      } catch (error) {
        console.log('Base64 decode failed:', error);
      }
    }

    if (!privateKey && rawPrivateKey) {
      privateKey = rawPrivateKey.replace(/\\n/g, "\n").trim();
      keySource = 'raw';
    }

    return NextResponse.json({
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasBase64Key: !!base64Key,
      hasRawKey: !!rawPrivateKey,
      keySource,
      hasPrivateKey: !!privateKey,
      projectId: projectId ? `${projectId.substring(0, 10)}...` : 'missing',
      clientEmail: clientEmail ? `${clientEmail.substring(0, 20)}...` : 'missing',
      base64KeyLength: base64Key?.length || 0,
      rawKeyLength: rawPrivateKey?.length || 0,
      privateKeyLength: privateKey?.length || 0,
      privateKeyStart: privateKey?.substring(0, 30) || 'missing',
      privateKeyEnd: privateKey?.substring(privateKey.length - 30) || 'missing',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Failed to debug environment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}