import { getLicenses } from '@/lib/services/license-service';
import DataTable from './data-table';

export default async function LicensesTable() {
  const licenses = await getLicenses({
    id: true,
    createdAt: true,
    updatedAt: true,
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
