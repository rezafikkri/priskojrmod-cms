import { getLicenseKeyRevokeNote } from '@/lib/services/license-key-service';

export async function GET(_, { params }) {
  const { id: licenseKeyId } = await params;

  try {
    const revokeNote = await getLicenseKeyRevokeNote(licenseKeyId);
    return Response.json({
      message: 'success',
      data: revokeNote,
    });   
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, { status: 500 });
  }
}
