import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Button } from '../ui/button';

export default function SelectionAlert({
  table,
}) {
  const totalSelectedCount = Object.keys(table.getState().rowSelection).length;
  const currentPageSelectedCount = table.getSelectedRowModel().rows.length;

  if (totalSelectedCount <= 0) return null;

  return (
    <Alert className="mb-4 flex items-center justify-center -mx-4 w-auto border-x-0 rounded-none text-center h-[50px] p-0">
      <AlertDescription className="text-base inline-block">
        <span className="pe-1">
          {totalSelectedCount} rows selected.
        </span>
        {currentPageSelectedCount < totalSelectedCount && (
          <Button
            variant="ghost"
            className="text-base h-auto py-0.5 px-1.5"
            onClick={() => table.resetRowSelection(true)}
          >
            Clear Selection
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
