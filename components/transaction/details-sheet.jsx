'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import DetailsSection from './details-section';
import InfoSection from './info-section';
import InvoicesSection from './invoices-section';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import InfoSectionSkeleton from './info-section-skeleton';
import DetailsSectionSkeleton from './details-section-skeleton';
import InvoicesSectionSkeleton from './invoices-section-skeleton';
import { safeFetch } from '@/lib/safe-fetch';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import Error404 from '../icon/error-404';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';

function DetailsContent({ isFetching, data, isError, error }) {
  if (!isFetching) {
    if (data === undefined) return null;

    if (isError) {
      return (
        <div className="px-4">
          <Alert variant="destructive" className="border-destructive/50 text-base">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        </div>
      );
    }

    if (data === null) {
      return (
        <div className="px-4">
          <Alert className="text-base">
            <Error404 />
            <AlertTitle>Transaction not found</AlertTitle>
          </Alert>
        </div>
      );
    }
  }

  let details, invoices, info;

  if (!isFetching) {
    ({ details, invoices, ...info } = data);
  }

  return (
    <div className="space-y-7 p-4 pt-0">
      <section>
        <h3 className="text-xl font-semibold">Transaction Info</h3>

        {isFetching ? (
          <InfoSectionSkeleton />
        ) : (
          <InfoSection info={info} />
        )}
      </section>

      <section>
        <h3 className="text-xl font-semibold">Transaction Details</h3>

        {isFetching ? (
          <DetailsSectionSkeleton />
        ) : (
          <DetailsSection details={details} />
        )}
      </section>

      <section className="last:mb-7">
        <h3 className="text-xl font-semibold">Invoices</h3>

        {isFetching ? (
          <InvoicesSectionSkeleton />
        ) : (
          <InvoicesSection invoices={invoices} />
        )}
      </section>

      {info?.refundNote && (
        <section className="mb-7">
          <h3 className="text-xl font-semibold">Refund Note</h3>

          <p className="mt-2 leading-7">{info.refundNote}</p>
        </section>
      )}
    </div>
  );
}

// In this function "details" word, not refer to the data "details" for details section,
// but refer to details of transaction,
// include transaction info itself and also details of it.
export default function DetailsSheet({ detailsId, onDetailsIdChange }) {
  const { data, isError, error, isFetching } = useQuery({
    queryKey: ['transactionDetails', detailsId],
    queryFn: async ({ signal }) => {
      const results = await safeFetch({
        url: `/api/transactions/${detailsId}`,
        signal,
      });
      return results?.data;
    },
    staleTime: 1000 * 30,
    enabled: !!detailsId,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  function handleOpenChange(isOpen) {
    if (!isOpen) {
      onDetailsIdChange(null);
    }
  }

  return (
    <Sheet open={!!detailsId} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold flex items-center">
            Transaction
            {isFetching ? (
              <Skeleton className="h-5.5 w-50 ms-2 rounded-sm" />
            ) : (
              <Badge variant="secondary" className="ms-2">{data?.code}</Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-base">
            Detailed information and history of the transaction.
          </SheetDescription>
        </SheetHeader>

        <DetailsContent
          isFetching={isFetching}
          data={data}
          isError={isError}
          error={error}
        />
      </SheetContent>
    </Sheet>
  );
}
