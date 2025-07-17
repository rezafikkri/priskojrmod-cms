import { getSecretKeys } from '@/lib/services/secret-key-service';
import CreateForm from './create-form';
import { getLicenseKey } from '@/lib/services/license-key-service';
import EditForm from './edit-form';
import {
  Alert,
  AlertTitle,
} from '../ui/alert';
import Error404 from '../icon/error-404';

export default async function LicenseKeyForm({ mode = 'create', id = null }) {
  const secretKeys = await getSecretKeys({ id: true, app_name: true });

  if (mode === 'create') {
    return <CreateForm secretKeys={secretKeys} />;
  }

  const licenseKey = await getLicenseKey(id);
  if (!licenseKey) {
    return (
      <Alert className="lg:max-w-2/3">
        <Error404 />
        <AlertTitle>License Key not found.</AlertTitle>
      </Alert>
    );
  }

  return <EditForm licenseKey={licenseKey} />;
}
