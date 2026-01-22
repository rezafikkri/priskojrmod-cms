import { getLicenses } from '@/lib/services/license-service';
import DataTable from './data-table';

export default async function LicensesTable() {
  const licenses = await getLicenses();
  return <DataTable licenses={licenses} />
}
