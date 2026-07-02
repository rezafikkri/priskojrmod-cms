import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Minus } from 'lucide-react';
import HelpIcon from '../icon/help-icon';
import TooltipWrapper from '../ui/tooltip-wrapper';

export default function PartiesSection({ data }) {
  return (
    <div className="mt-2.5">
      <h5 className="mb-1 text-zinc-700 dark:text-zinc-300 text-sm font-light">Customer</h5>
      <div className="rounded-md border">
        <Table className="text-base">
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300 w-60">Name</TableHead>
              <TableCell>{data.customerName}</TableCell>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Email</TableHead>
              <TableCell>{data.customerEmail}</TableCell>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="font-normal text-zinc-700 dark:text-zinc-300"
              >
                Phone Number
              </TableHead>
              <TableCell>
                {data.customerPhoneNumber ?? <Minus className="size-4 text-zinc-300" />}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <h5 className="mt-2 mb-1 text-zinc-700 dark:text-zinc-300 text-sm font-light">
        <span className="me-1">Admin</span>
        <TooltipWrapper text="Admin assigned to this transaction">
          <HelpIcon size={12} />
        </TooltipWrapper>
      </h5>
      <div className="rounded-md border">
        <Table className="text-base">
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300 w-60">Name</TableHead>
              <TableCell>{data.adminName}</TableCell>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-normal text-zinc-700 dark:text-zinc-300">Email</TableHead>
              <TableCell>{data.adminEmail}</TableCell>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="font-normal text-zinc-700 dark:text-zinc-300"
              >
                Whatsapp Phone Number
              </TableHead>
              <TableCell>
                {data.adminWhatsappPhoneNumber ?? <Minus className="size-4 text-zinc-300" />}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
