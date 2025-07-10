import { getSecretKeys } from '@/lib/services/secret-key-service';

export async function GET() {
  const secretKeys = await getSecretKeys({
    id: true,
    app_name: true,
  });
  return Response.json({
    message: 'success',
    data: secretKeys,
  });
}
