import { CardTotal } from '@/components/dashboard/card-total';
import ChartTransactions from '@/components/dashboard/chart-transactions';
import DashHeader from '@/components/dashboard/dash-header';
import TopSellingProduct from '@/components/dashboard/top-selling-product';
import ShopBag from '@/components/icon/shop-bag';
import {
  Users,
  Package,
} from 'lucide-react';

export default function Dashboard() {
  return (
    <>
      <div className="flex max-lg:flex-col mb-7 lg:items-center max-lg:gap-5 lg:gap-10">
        <DashHeader />
      </div>
      <div className="flex gap-4 mb-4 flex-wrap">
        <CardTotal title="Sales" total={240} icon={<ShopBag />} />
        <CardTotal title="Customers" total={600} icon={<Users />} />
        <CardTotal title="Products" total={400} icon={<Package />} />
      </div>
      <ChartTransactions />
      {/* <TopSellingProduct /> */}
    </>
  );
}
