import { getFaq } from '@/lib/services/faq-service';
import EditForm from './edit-form';
import NotFoundAlert from '../ui/not-found-alert';

export default async function FaqForm({ id }) {
  const faq = await getFaq(id);

  if (!faq) return <NotFoundAlert message="FAQ not found" />;

  return <EditForm faq={faq} />
}
