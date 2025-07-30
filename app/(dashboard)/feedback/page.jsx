import FeedbacksTable from '@/components/feedback/feedbacks-table';

export const metadata = {
  title: 'Feedbacks',
};

export default function FeedbackListPage() {
  return (
    <>
      <h1 className="text-2xl mb-1 font-bold">Feedbacks</h1>
      <h2  className="text-zinc-700 dark:text-zinc-300/80 mb-7">User-submitted messages and suggestions. New feedback can be pulled once every 1 hour.</h2>

      <FeedbacksTable />
    </>
  );
}
