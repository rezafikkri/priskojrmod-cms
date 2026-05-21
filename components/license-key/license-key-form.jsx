import { getSelectableSecretKeys } from '@/lib/services/secret-key-service';
import CreateForm from './create-form';
import { getLicenseKey } from '@/lib/services/license-key-service';
import EditForm from './edit-form';
import NotFoundAlert from '../ui/not-found-alert';

export default async function LicenseKeyForm({ mode = 'create', id = null }) {
  const secretKeys = await getSelectableSecretKeys();

  if (mode === 'create') {
    return <CreateForm secretKeys={secretKeys} />;
  }

  const licenseKey = await getLicenseKey(id);
  if (!licenseKey) return <NotFoundAlert message="License key not found" />;

  return <EditForm licenseKey={licenseKey} />;
}
