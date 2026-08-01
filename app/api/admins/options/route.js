import { getSelectableAdmins } from '@/lib/services/admin-service';

export async function GET() {
  try {
    const admins = await getSelectableAdmins(false);
    return Response.json({
      message: 'success',
      data: admins,
    });   
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, { status: 500 });
  }
}
