import { getFaqs } from '@/lib/services/faq-service';
import DataTable from './data-table';

export default async function FaqsTable() {
  const faqs = await getFaqs();

  return <DataTable faqs={faqs} />
}
