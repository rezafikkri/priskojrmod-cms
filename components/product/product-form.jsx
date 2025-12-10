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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isOwnerAdmin } from '@/lib/utils';
import { getAdmins } from '@/lib/services/admin-service';
import { v4 } from 'uuid';

export const defaultFormStoreInitState = {
  form: {
    basic: {
      name: '',
      category_id: '',
      owner_id: '',
      license_id: '',
      price_type: '',
      drive_file_id: '',
      download_url: '',
      version: '',
    },
    content: {
      description: {
        id: '',
        en: '',
      },
    },
    extras: {
      variants: [
        {
          id: v4(),
          name: '',
          download_url: '',
          file_access_password: '',
        },
      ],
      images: [],
    },
    pricing: {
      prices: [],
      discount: {
        value: '',
        expired_at: '',
      },
      coupon: {
        code: '',
        discount: '',
        expired_at: '',
      },
      is_published: false,
    },
  },
  reference: {},
  meta: {},
};

export default async function ProductForm({ mode = 'create', id = null }) {
  const session = await getServerSession(authOptions);
  const categories = await getCategories({
    id: true,
    name: true,
    slug: true,
  });
  const owners = await getOwners({
    select: {
      id: true,
      first_name: true,
      last_name: true,
      sm_profile_url: true,
    },
    withDisplayLabel: true,
  });
  const licenses = await getLicensesWithTranslation();
  let admins;
  if (isOwnerAdmin(session.user.role)) {
    admins = await getAdmins({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
      withDisplayLabel: true,
    });
    admins.unshift({
      id: session.user.id,
      displayLabel: 'Myself',
    });
  }

  if (mode === 'create') {
    if (isOwnerAdmin(session.user.role)) {
      defaultFormStoreInitState.form.basic.admin_id = '';
    }

    return (
      <ProductFormStoreProvider initState={defaultFormStoreInitState}>
        <CreateForm
          categories={categories}
          owners={owners}
          licenses={licenses}
          admins={admins}
        />
      </ProductFormStoreProvider>
    );
  }

  const product = await getProduct(id);
  if (!product) {
    return (
      <Alert className="text-base lg:max-w-2/3">
        <Error404 />
        <AlertTitle>Product not found.</AlertTitle>
      </Alert>
    );
  }

  return (
    <ProductFormStoreProvider initState={product}>
      <EditForm
        categories={categories}
        owners={owners}
        licenses={licenses}
        admins={admins}
      />
    </ProductFormStoreProvider>
  );
}
