import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ProductsTable from '@/components/product/products-table';
import { AdminRole } from '@/constants/enums';
import { hasAccess } from '@/lib/authorization';
import { getServerSession } from 'next-auth';

export const metadata = {
  title: 'Products',
};

export default async function ProductListPage() {
  const session = await getServerSession(authOptions);
  const isOwner = hasAccess(session.user.role, AdminRole.OWNER);
  return (
    <>
      <h1 className={`text-2xl ${isOwner ? 'mb-7' : 'mb-1'} font-bold`}>Products</h1>
      {!isOwner && (
        <h2 className="text-zinc-700 dark:text-zinc-300/80 mb-7">The products displayed are under your responsibility.</h2>
      )}

      <ProductsTable isOwner={isOwner} />
    </>
  );
}
