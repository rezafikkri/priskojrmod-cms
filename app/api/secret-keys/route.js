import { getSecretKeys } from '@/lib/services/secret-key-service';

export async function GET() {
  try {
    const secretKeys = await getSecretKeys({
      id: true,
      app_name: true,
    });
    return Response.json({
      message: 'success',
      data: secretKeys,
    });   
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, 500);   
  }
}
