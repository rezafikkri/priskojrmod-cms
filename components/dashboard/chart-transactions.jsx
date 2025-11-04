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
  ChartTooltipContent,
} from '../ui/chart';
import { Info } from 'lucide-react';
import TooltipWrapper from '../ui/tooltip-wrapper';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { useState } from 'react';
import { CurrencyCode } from '@/constants/enums';

const chartData = [
  { date: '2024-01-31', IDR: 520_000, USD: 35 },
  { date: '2024-02-29', IDR: 640_000, USD: 43 },
  { date: '2024-03-31', IDR: 780_000, USD: 52 },
  { date: '2024-04-30', IDR: 720_000, USD: 48 },
  { date: '2024-05-31', IDR: 960_000, USD: 64 },
  { date: '2024-06-30', IDR: 1_120_000, USD: 75 },
  { date: '2024-07-31', IDR: 1_280_000, USD: 85 },
  { date: '2024-08-31', IDR: 1_460_000, USD: 97 },
  { date: '2024-09-30', IDR: 1_360_000, USD: 91 },
  { date: '2024-10-31', IDR: 1_620_000, USD: 108 },
  { date: '2024-11-30', IDR: 1_780_000, USD: 119 },
  { date: '2024-12-31', IDR: 1_950_000, USD: 130 },
];
const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'var(--chart-1)',
  },
};

export default function ChartTransactions() {
  const [activeChart, setActiveChart] = useState(CurrencyCode.IDR);

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex">
          <div className="flex-1">
            <CardTitle className="text-lg">
              <span className="me-2">Monthly Sales</span>
              <TooltipWrapper text="Sales figures exclude tax">
                <Info className="icon text-zinc-500" size={14} />
              </TooltipWrapper>
            </CardTitle>
            <CardDescription className="text-base">Sales from the past 12 months.</CardDescription>
          </div>
          <ButtonGroup>
            <Button
              variant="outline"
              className="shadow-none"
              size="sm"
              onClick={() => setActiveChart(CurrencyCode.IDR)}
            >
              {CurrencyCode.IDR}
            </Button>
            <Button
              variant="outline"
              className="shadow-none"
              size="sm"
              onClick={() => setActiveChart(CurrencyCode.USD)}
            >
              {CurrencyCode.USD}
            </Button>
          </ButtonGroup>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full">
          <AreaChart
            data={chartData}
            margin={{
              left: -22,
              right: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tickCount={3}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  year: '2-digit',
                  month: 'short',
                });
              }}
            />
            <ChartTooltip
              cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  className="text-sm"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      year: 'numeric',
                      month: 'short',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey={activeChart}
              type="monotone"
              fill="url(#fillSales)"
              fillOpacity={0.4}
              stroke="var(--color-sales)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
