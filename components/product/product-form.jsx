import { getSelectableCategories } from '@/lib/services/category-service';
import CreateForm from './create-form';
import { getSelectableOwners } from '@/lib/services/owner-service';
import { getSelectableLicenses } from '@/lib/services/license-service';
import { getProduct } from '@/lib/services/product-service';
import EditForm from './edit-form';
import { ProductFormStoreProvider } from '@/lib/providers/product-form-store-provider';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSelectableAdmins } from '@/lib/services/admin-service';
import { v4 } from 'uuid';
import { UserRole, ProductStatus } from '@/constants/enums';
import { hasAccess } from '@/lib/authorization';
import NotFoundAlert from '../ui/not-found-alert';

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
          description: {
            id: '',
            en: '',
          },
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
      upgradeCoupon: {
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
  if (!product) return <NotFoundAlert message="Product not found" />;

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
