import RegenerateForm from '@/components/secret-key/regenerate-form';
import { getSecretKey } from '@/lib/services/secret-key-service';
import {
  Alert,
  AlertTitle,
} from '../ui/alert';
import Error404 from '../icon/error-404';
import { getProducts } from '@/lib/services/product-service';
import CreateForm from './create-form';

export default async function SecretKeyForm({ mode = 'create', id }) {
  if (mode === 'create') {
    const products = await getProducts({
      select: { id: true, name: true },
      filters: {
        price_type: 'paid',
        category: {
          slug: 'application',
        },
      },
    });
    return <CreateForm products={products} />;
  }

  const secretKey = await getSecretKey(id);
  if (!secretKey) {
    return (
      <Alert className="text-base lg:max-w-2/3">
        <Error404 />
        <AlertTitle>Secret key not found</AlertTitle>
      </Alert>
    );
  }

  return <RegenerateForm secretKey={secretKey} />;
}
