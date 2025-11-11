import { getAdmins } from '@/lib/services/admin-service';
import DataTable from './data-table';

export default async function AdminsTable() {
  const admins = await getAdmins();
  return <DataTable admins={admins} />;
}
