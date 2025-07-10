import { getOwner } from '@/lib/services/owner-service';
import {
  Alert,
  AlertTitle,
} from '../ui/alert';
import Error404 from '../icon/error-404';
import EditForm from './edit-form';

export default async function OwnerForm({ id }) {
  const owner = await getOwner(id);
  if (!owner) return (
    <Alert className="lg:max-w-2/3">
      <Error404 />
      <AlertTitle>Owner not found.</AlertTitle>
    </Alert>
  );

  return <EditForm owner={owner} />;
}
