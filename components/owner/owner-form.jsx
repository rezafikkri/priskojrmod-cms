import { getOwner } from '@/lib/services/owner-service';
import EditForm from './edit-form';
import NotFoundAlert from '../ui/not-found-alert';

export default async function OwnerForm({ id }) {
  const owner = await getOwner(id);
  if (!owner) return <NotFoundAlert message="Owner not found" />;

  return <EditForm owner={owner} />;
}
