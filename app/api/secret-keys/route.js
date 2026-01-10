import { getSelectableSecretKeys } from '@/lib/services/secret-key-service';

export async function GET() {
  try {
    const secretKeys = await getSelectableSecretKeys();
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
