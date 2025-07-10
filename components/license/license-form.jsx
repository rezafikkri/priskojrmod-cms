import { getLicense } from '@/lib/services/license-service';
import {
  Alert,
  AlertTitle,
} from '../ui/alert';
import Error404 from '../icon/error-404';
import EditForm from './edit-form';

export default async function LicenseForm({ id }) {
  const license = await getLicense(id);

  if (!license) return (
    <Alert className="lg:max-w-2/3">
      <Error404 />
      <AlertTitle>License not found.</AlertTitle>
    </Alert>
  );

  return <EditForm license={license} />;
}
