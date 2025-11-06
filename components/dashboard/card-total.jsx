import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import TooltipWrapper from '../ui/tooltip-wrapper';
import { ArrowRight, CircleQuestionMark } from 'lucide-react';
import Dot from '../icon/Dot';
import { formatCurrency } from '@/lib/format-currency';

export function CardTotal({
  title,
  total,
  icon,
  tooltip,
  quickLink,
  displayMode = 'single'
}) {
  const { Icon, textColor } = icon;
  const { tooltip: tooltipLink, href } = quickLink ?? {};
  let totalIDRLong;
  let totalIDRShort;
  let totalUSDLong;
  let totalUSDShort;

  if (displayMode === 'dual') {
    totalIDRShort = formatCurrency({
      value: total.first.value,
      currencyCode: total.first.currencyCode,
      notation: 'compact',
    });
    totalUSDShort = formatCurrency({
      value: total.second.value,
      currencyCode: total.second.currencyCode,
      notation: 'compact',
    });
    totalIDRLong = formatCurrency({ value: total.first.value, currencyCode: total.first.currencyCode });
    totalUSDLong = formatCurrency({ value: total.second.value, currencyCode: total.second.currencyCode });
  }

  return (
    <Card className="shadow-none flex-1 min-w-40 gap-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-1 font-medium">
          <span className={`rounded-md bg-zinc-100/90 dark:bg-zinc-800/70 px-1 py-0.5 ${textColor}`}>
            <Icon className="icon" size={20} />
          </span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">{title}</span>
            {tooltip && (
              <TooltipWrapper text={tooltip} {...(title === 'Unpaid' && { background: 'bg-gray-600' })}>
                <CircleQuestionMark className="icon text-zinc-400" size={14} />
              </TooltipWrapper>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end">
          {displayMode === 'dual' ? (
            <div className="flex gap-4 items-center">
              <TooltipWrapper text={totalIDRLong}>
                <h4 className="text-2xl font-semibold tabular-nums">{totalIDRShort}</h4>
              </TooltipWrapper>
              <Dot className="size-3 text-zinc-300 dark:text-zinc-700 icon" />
              <TooltipWrapper text={totalUSDLong}>
                <h4 className="text-2xl font-semibold tabular-nums">{totalUSDShort}</h4>
              </TooltipWrapper>
            </div>
          ) : (
            <h4 className="text-2xl font-semibold tabular-nums">{total}</h4>
          )}

          {quickLink && (
            <TooltipWrapper text={tooltipLink} {...(title === 'Unpaid' && { background: 'bg-gray-600' })}>
              <Link
                href={href}
                className="text-zinc-500 rounded-md hover:bg-zinc-100/90 hover:dark:bg-zinc-800/70 p-1.5 inline-block"
              >
                <ArrowRight size={14} />
              </Link>
            </TooltipWrapper>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
