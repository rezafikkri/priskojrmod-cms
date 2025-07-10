import { getTermsOfService } from '@/lib/services/terms-of-service-service';
import EditForm from './edit-form';

export default async function TermsOfSeviceForm() {
  const termsOfService = await getTermsOfService();
  return <EditForm termsOfService={termsOfService} />;
}
