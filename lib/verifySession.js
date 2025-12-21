import 'server-only';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export default async function verifySession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return false;
  }

  return {
    userId: session.user.id,
    userRole: session.user.role,
    userFirstName: session.user.first_name,
    userLastName: session.user.last_name,
    userPicture: session.user.image,
    userEmail: session.user.email,
  };
}
