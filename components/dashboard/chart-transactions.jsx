'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
} from '../ui/chart';
import TooltipWrapper from '../ui/tooltip-wrapper';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { useState } from 'react';
import { CurrencyCode } from '@/constants/enums';
import { formatCurrency } from '@/lib/format-currency';
import { formatNumber } from '@/lib/format-number';
import { formatMonthYear } from '@/lib/format-date';
import { cmsConfig } from '@/config/cms';
import HelpIcon from '../icon/help-icon';

const chartData = [
  { timestamp: 1706634000, IDR: 920_000, USD: 45 },
  { timestamp: 1709223780, IDR: 1_030_000, USD: 72.55 },
  { timestamp: 1711902180, IDR: 950_000, USD: 38 },
  { timestamp: 1714494180, IDR: 420_500, USD: 68.6 },
  { timestamp: 1717172580, IDR: 2_150_000, USD: 52 },
  { timestamp: 1719764580, IDR: 3_900_000, USD: 58 },
  { timestamp: 1722442980, IDR: 1_280_000, USD: 28 },
  { timestamp: 1725121380, IDR: 490_000, USD: 75 },
  { timestamp: 1727713380, IDR: 3_599_900, USD: 100 },
  { timestamp: 1730391780, IDR: 2_000_000, USD: 70 },
  { timestamp: 1732983780, IDR: 3_300_000, USD: 30 },
  { timestamp: 1735662180, IDR: 580_000, USD: 65 },
];

const chartConfig = {
  IDR: {
    label: 'Sales (IDR)',
    color: 'var(--chart-1)',
  },
  USD: {
    label: 'Sales (USD)',
    color: 'var(--chart-1)',
  },
};

export default function ChartTransactions() {
  const [activeCurrency, setActiveCurrency] = useState(cmsConfig.defaults.currency);

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex">
          <div className="flex-1">
            <CardTitle className="text-lg">
              <span>Monthly Sales</span>
              {' '}
              <TooltipWrapper text="Sales figures exclude tax">
                <HelpIcon />
              </TooltipWrapper>
            </CardTitle>
            <CardDescription
              className="text-base text-zinc-600 dark:text-zinc-400"
            >
              Sales from the past 12 months.
            </CardDescription>
          </div>
          <ButtonGroup>
            <Button
              variant="outline"
              className={`shadow-none ${activeCurrency === CurrencyCode.IDR ? 'bg-accent dark:bg-input/60' : ''}`}
              size="sm"
              onClick={() => setActiveCurrency(CurrencyCode.IDR)}
            >
              {CurrencyCode.IDR}
            </Button>
            <Button
              variant="outline"
              className={`shadow-none ${activeCurrency === CurrencyCode.USD ? 'bg-accent dark:bg-input/60' : ''}`}
              size="sm"
              onClick={() => setActiveCurrency(CurrencyCode.USD)}
            >
              {CurrencyCode.USD}
            </Button>
          </ButtonGroup>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-65 w-full">
          <AreaChart
            data={chartData}
            margin={{
              left: -12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tickCount={4}
              tickFormatter={(value) => formatNumber({ value, notation: 'compact' })}
            />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => formatMonthYear(value, true)}
            />
            <ChartTooltip
              cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;

                return (
                  <div className="bg-white dark:bg-popover p-2 border rounded shadow text-sm">
                    <p className="mb-1.5">
                      {formatMonthYear(label)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`size-3 rounded-sm`} style={{ backgroundColor: payload[0].color }} />
                      <span className="font-semibold">
                        {formatCurrency({
                          value: payload[0].payload[activeCurrency],
                          currencyCode: activeCurrency,
                        })}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <defs>
              <linearGradient id={`fill${activeCurrency}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={`var(--color-${activeCurrency})`}
                  stopOpacity={0.5}
                />
                <stop
                  offset="100%"
                  stopColor={`var(--color-${activeCurrency})`}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey={activeCurrency}
              type="monotone"
              fill={`url(#fill${activeCurrency})`}
              fillOpacity={0.4}
              stroke={`var(--color-${activeCurrency})`}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
