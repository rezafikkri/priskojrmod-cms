import { getCategory } from '@/lib/services/category-service';
import EditForm from './edit-form';
import NotFoundAlert from '../ui/not-found-alert';

export default async function CategoryForm({ id }) {
  const category = await getCategory(id);

  if (!category) return <NotFoundAlert message="Category not found" />;

  return <EditForm category={category} />;
}
