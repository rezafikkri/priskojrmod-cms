import { CardTotal } from '@/components/dashboard/card-total';
import ChartTransactions from '@/components/dashboard/chart-transactions';
import DashHeader from '@/components/dashboard/dash-header';
import ShopBag from '@/components/icon/shop-bag';
import {
  Package,
  Hourglass,
} from 'lucide-react';

export default function Dashboard() {
  return (
    <>
      <div className="flex max-lg:flex-col mb-7 lg:items-center max-lg:gap-5 lg:gap-10">
        <DashHeader />
      </div>
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="lg:flex-1 w-full">
          <CardTotal
            title="Total Sales"
            displayMode="dual"
            icon={{
              Icon: ShopBag,
              textColor: 'text-green-600/80',
            }}
            tooltip="Total revenue per currency (excluding tax)"
            total={{
              first: 'Rp2.5M',
              second: '$450',
            }}
            quickLink={{
              tooltip: 'View all paid transactions.',
              href: '/transaction?status=paid',
            }}
          />
        </div>
        <div className="flex gap-4 w-full lg:flex-1 items-start">
          <CardTotal
            title="Items Sold"
            total={400}
            icon={{
              Icon: Package,
              textColor: 'text-green-600/80',
            }}
          />
          <CardTotal
            title="Unpaid"
            total={4}
            tooltip="Total amount of transactions pending payment"
            icon={{
              Icon: Hourglass,
              textColor: 'text-gray-600/80',
            }}
            quickLink={{
              tooltip: 'View all pending transactions.',
              href: '/transaction?status=pending',
            }}
          />
        </div>
      </div>
      <ChartTransactions />
      {/* <TopSellingProduct /> */}
    </>
  );
}
