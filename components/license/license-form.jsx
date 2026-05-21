import { getLicense } from '@/lib/services/license-service';
import EditForm from './edit-form';
import NotFoundAlert from '../ui/not-found-alert';

export default async function LicenseForm({ id }) {
  const license = await getLicense(id);

  if (!license) return <NotFoundAlert message="License not found" />;

  return <EditForm license={license} />;
}
