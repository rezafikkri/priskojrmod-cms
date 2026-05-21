import { getAdmin } from '@/lib/services/admin-service';
import EditForm from './edit-form';
import NotFoundAlert from '../ui/not-found-alert';

export default async function AdminForm({ id }) {
  const admin = await getAdmin(id);

  if (!admin) return <NotFoundAlert message="Admin not found" />;

  return <EditForm admin={admin} />;
}
