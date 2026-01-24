import { getSelectableCategories } from '@/lib/services/category-service';
import CreateForm from './create-form';
import { getSelectableOwners } from '@/lib/services/owner-service';
import { getSelectableLicenses } from '@/lib/services/license-service';
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
import { getSelectableAdmins } from '@/lib/services/admin-service';
import { v4 } from 'uuid';
import { UserRole, ProductStatus } from '@/constants/enums';
import { hasAccess } from '@/lib/authorization';

export const defaultFormStoreInitState = {
  form: {
    basic: {
      name: '',
      categoryId: '',
      ownerId: '',
      licenseId: '',
      priceType: '',
      driveFileId: '',
      downloadUrl: '',
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
          downloadUrl: '',
          fileAccessPassword: '',
        },
      ],
      images: [],
    },
    pricing: {
      prices: [],
      discount: {
        value: '',
        expiredAt: '',
      },
      coupon: {
        code: '',
        discount: '',
        expiredAt: '',
      },
      status: ProductStatus.UNPUBLISHED,
    },
  },
  reference: {},
  meta: {},
};

export default async function ProductForm({ mode = 'create', id = null }) {
  const session = await getServerSession(authOptions);
  
  const categories = await getSelectableCategories();
  const owners = await getSelectableOwners();
  const licenses = await getSelectableLicenses();
  const admins = await getSelectableAdmins();

  if (mode === 'create') {
    if (hasAccess(session?.user?.role, UserRole.OWNER)) {
      defaultFormStoreInitState.form.basic.adminId = '';
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
        <AlertTitle>Product not found</AlertTitle>
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
