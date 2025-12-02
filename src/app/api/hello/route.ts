export async function GET() {
  return Response.json({
    message: 'Hello World',
    timestamp: new Date().toISOString(),
    status: 'API routes working'
  });
}