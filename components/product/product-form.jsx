import { getCategories } from '@/lib/services/category-service';
import CreateForm from './create-form';
import { getOwners } from '@/lib/services/owner-service';
import { getLicensesWithTranslation } from '@/lib/services/license-service';
import { getProduct } from '@/lib/services/product-service';
import EditForm from './edit-form';
import {
  Alert,
  AlertTitle,
} from '../ui/alert';
import Error404 from '../icon/error-404';
import { ProductFormStoreProvider } from '@/lib/providers/product-form-store-provider';

export default async function ProductForm({ mode = 'create', id = null }) {
  const categories = await getCategories({
    id: true,
    name: true,
  });
  const owners = await getOwners({
    id: true,
    first_name: true,
  });
  const licenses = await getLicensesWithTranslation();

  if (mode === 'create') {
    return (
      <ProductFormStoreProvider>
        <CreateForm categories={categories} owners={owners} licenses={licenses} />
      </ProductFormStoreProvider>
    );
  }

  const product = await getProduct(id);
  if (!product) {
    return (
      <Alert className="lg:max-w-2/3">
        <Error404 />
        <AlertTitle>Product not found.</AlertTitle>
      </Alert>
    );
  }

  return (
    <ProductFormStoreProvider initState={product}>
      <EditForm categories={categories} owners={owners} licenses={licenses} />
    </ProductFormStoreProvider>
  );
}
