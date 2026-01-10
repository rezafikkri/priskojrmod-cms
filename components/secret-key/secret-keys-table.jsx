import DataTable from './data-table';
import { getSecretKeys } from '@/lib/services/secret-key-service';

export default async function SecretKeysTable() {
  const secretKeys = await getSecretKeys();
  return  <DataTable secretKeys={secretKeys} />;
}
