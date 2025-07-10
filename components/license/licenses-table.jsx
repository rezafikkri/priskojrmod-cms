import { getLicenses } from '@/lib/services/license-service';
import DataTable from './data-table';

export default async function LicensesTable() {
  const licenses = await getLicenses({
    id: true,
    created_at: true,
    updated_at: true,
    translations: {
      select: {
        id: true,
        language: true,
        name: true,
        content: true,
      },
    },
  });

  return <DataTable licenses={licenses} />
}
