import DataTable from './data-table';
import { getSecretKeys } from '@/lib/services/secret-key-service';

export default async function SecretKeysTable() {
  const secretKeys = await getSecretKeys({
    id: true,
    key: true,
    app_name: true,
    created_at: true,
    regenerated_at: true,
  });
  return  <DataTable secretKeys={secretKeys} />;
}
