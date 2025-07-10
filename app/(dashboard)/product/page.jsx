import ProductsTable from '@/components/product/products-table';

export const metadata = {
  title: 'Products',
};

export default function ProductListPage() {
  return (
    <>
      <h1 className="text-2xl mb-7 font-bold">Products</h1>

      <ProductsTable />
    </>
  );
}
