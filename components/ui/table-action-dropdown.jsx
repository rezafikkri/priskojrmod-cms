import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function TableActionDropdown({ children, disabled = false, visible = true }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`size-8 p-0 focus-visible:ring-ring ${visible ? '' : 'invisible'}`}
          disabled={disabled}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-50">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
