import { getOwners } from '@/lib/services/owner-service';
import DataTable from './data-table';

export default async function OwnersTable() {
  const owners = await getOwners();
  return <DataTable owners={owners} />;
}
