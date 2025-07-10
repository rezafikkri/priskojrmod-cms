import { getCategories } from '@/lib/services/category-service';
import DataTable from './data-table';

export default async function CategoriesTable() {
  const categories = await getCategories();
  return <DataTable categories={categories} />;
}
