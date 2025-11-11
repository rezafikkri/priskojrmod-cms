import 'server-only';

import pjmeDBPrismaClient from '../pjme-prisma-client';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import UnauthenticatedError from '../errors/UnauthenticatedError';

export async function getAdmins() {
  const session = await verifySession();

  if (!session) {
    throw new UnauthenticatedError();
  }

  try {
    const admins = await pjmeDBPrismaClient.Admin.findMany({
      where: { id: { not: session.userId } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        picture: true,
        created_at: true,
        updated_at: true,
      },
    });

    return admins.map(admin => ({
      ...admin,
      name: `${admin.first_name} ${admin.last_name}`,
    }));
  } catch (error) {
    console.error(error);
    throw new UnknownError();
  }
}
