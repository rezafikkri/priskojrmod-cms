import { getCustomer } from '@/lib/services/customer-service';
import EditForm from './edit-form';
import {
  Alert,
  AlertTitle,
} from '../ui/alert';
import Error404 from '../icon/error-404';

export default async function CustomerForm({ id }) {
  const customer = await getCustomer({ id });
  if (!customer) {
    return (
      <Alert>
        <Error404 />
        <AlertTitle>License Key not found.</AlertTitle>
      </Alert>
    );
  }
  return <EditForm customer={customer} />;
}
