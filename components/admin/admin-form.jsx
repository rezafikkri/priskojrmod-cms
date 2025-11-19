import { Alert, AlertTitle } from '../ui/alert';
import Error404 from '../icon/error-404';
import { getAdmin } from '@/lib/services/admin-service';
import EditForm from './edit-form';

export default async function AdminForm({ id }) {
  const admin = await getAdmin(id);

  if (!admin) return (
    <Alert className="text-base lg:max-w-2/3">
      <Error404 />
      <AlertTitle>Admin not found.</AlertTitle>
    </Alert>
  );

  return <EditForm admin={admin} />;
}
