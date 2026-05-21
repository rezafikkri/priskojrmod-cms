import { getCustomer } from '@/lib/services/customer-service';
import EditForm from './edit-form';
import NotFoundAlert from '../ui/not-found-alert';

export default async function CustomerForm({ id }) {
  const customer = await getCustomer(id);

  if (!customer) return <NotFoundAlert message="Customer not found" />;

  return <EditForm customer={customer} />;
}
