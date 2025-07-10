import {
  Alert,
  AlertTitle,
} from '../ui/alert';
import Error404 from '../icon/error-404';
import { getCategory } from '@/lib/services/category-service';
import EditForm from './edit-form';

export default async function CategoryForm({ id }) {
  const category = await getCategory(id);

  if (!category) return (
    <Alert className="lg:max-w-2/3">
      <Error404 />
      <AlertTitle>Category not found.</AlertTitle>
    </Alert>
  );

  return <EditForm category={category} />;
}
