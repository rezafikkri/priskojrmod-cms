import { getAccount } from '@/lib/services/account-settings-service';

export async function GET() {
  const account = await getAccount({
    last_name: true,
  });
  return Response.json({
    message: 'success',
    data: account,
  });
}
