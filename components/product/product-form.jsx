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
import { ProductStatus } from '@/constants/enums';

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
  const categories = await getCategories({
    id: true,
    name: true,
    slug: true,
  });
  const owners = await getOwners({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      smProfileUrl: true,
    },
    withDisplayLabel: true,
  });
  const licenses = await getLicensesWithTranslation();
  const isOwner = isOwnerAdmin(session?.user?.role);
  let admins;
  if (isOwner) {
    admins = await getAdmins({
      select: {
        id: true,
        firstName: true,
        lastName: true,
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
    if (isOwner) {
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
