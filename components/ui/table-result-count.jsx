'use client';

export default function TableResultCount({ data }) {
  const resultCount = data?.items?.length ?? 0;
  const resultLabel = resultCount === 1 ? 'result' : 'results';

  return (
    <p className="text-muted-foreground mt-4">
      {resultCount} {resultLabel}
    </p>
  );
}
