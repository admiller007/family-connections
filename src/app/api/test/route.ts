export async function GET() {
  return new Response('API Working', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}