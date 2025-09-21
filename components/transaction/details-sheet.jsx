'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useState } from 'react';
import DetailsSection from './details-section';
import InfoSection from './info-section';
import InvoicesSection from './invoices-section';
import { useQueryClient } from '@tanstack/react-query';
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

function DetailsContent({ isLoading, data, error }) {
  if (!isLoading) {
    if (!data) {
      return (
        <div className="px-4">
          <Alert className="text-base">
            <Error404 />
            <AlertTitle>Transaction not found.</AlertTitle>
          </Alert>
        </div>
      );
    }

    if (error) {
      return (
        <div className="px-4">
          <Alert variant="destructive" className="border-destructive/50 text-base">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        </div>
      );
    }
  }

  let details, invoices, info;

  if (!isLoading) {
    ({ details, invoices, ...info } = data);
  }

  return (
    <div className="space-y-6 p-4 pt-0">
      <section>
        <h3 className="text-xl font-semibold">Transaction Info</h3>

        {isLoading ? (
          <InfoSectionSkeleton />
        ) : (
          <InfoSection info={info} />
        )}
      </section>

      <section>
        <h3 className="text-xl font-semibold">Transaction Details</h3>

        {isLoading ? (
          <DetailsSectionSkeleton />
        ) : (
          <DetailsSection details={details} />
        )}
      </section>

      <section>
        <h3 className="text-xl font-semibold">Invoices</h3>

        {isLoading ? (
          <InvoicesSectionSkeleton />
        ) : (
          <InvoicesSection invoices={invoices} />
        )}
      </section>
    </div>
  );
}

// In this function "details" word, not refer to the data "details" for details section,
// but refer to details of transaction,
// include transaction info itself and also details of it.
export default function DetailsSheet({ detailsId, onDetailsIdChange }) {
  const queryClient = useQueryClient();
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchDetails() {
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['transactionDetails', detailsId],
        queryFn: async () => {
          setIsLoading(true);

          return await safeFetch({
            url: `/api/transactions/${detailsId}`,
            onFinally: () => {
              setIsLoading(false);
            },
            errorMessage: 'Something went wrong while searching. Please try again.',
          });
        },
        staleTime: 10_000,
        gcTime: 10_000,
      });

      setDetails(result.data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  if (detailsId) {
    fetchDetails();
  }

  function handleOpenChange(isOpen) {
    if (!isOpen) {
      setDetails(null);
      setError(null);
      onDetailsIdChange(null);
    }
  }

  return (
    <Sheet open={!!detailsId} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Transaction</SheetTitle>
          <SheetDescription className="text-base">
            Information about the transaction, including its details and invoice history.
          </SheetDescription>
        </SheetHeader>

        <DetailsContent
          isLoading={isLoading}
          data={details}
          error={error}
        />
      </SheetContent>
    </Sheet>
  );
}
