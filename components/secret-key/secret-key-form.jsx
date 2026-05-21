import RegenerateForm from '@/components/secret-key/regenerate-form';
import { getSecretKey } from '@/lib/services/secret-key-service';
import { getSelectableProducts } from '@/lib/services/product-service';
import CreateForm from './create-form';
import NotFoundAlert from '../ui/not-found-alert';

export default async function SecretKeyForm({ mode = 'create', id }) {
  if (mode === 'create') {
    const products = await getSelectableProducts();
    return <CreateForm products={products} />;
  }

  const secretKey = await getSecretKey(id);
  if (!secretKey) return <NotFoundAlert message="Secret key not found" />;

  return <RegenerateForm secretKey={secretKey} />;
}
