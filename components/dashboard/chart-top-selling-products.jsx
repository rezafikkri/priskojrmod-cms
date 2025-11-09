'use client';

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  LabelList,
  CartesianGrid,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useTheme } from 'next-themes';
import { formatNumber } from '@/lib/format-number';

const topSellingProducts = [
  { name: 'SEO Master Course', quantity: 2847 },
  { name: 'Canva Template Pack', quantity: 2134 },
  { name: 'Digital Marketing E-Book', quantity: 1992 },
  { name: 'Notion Productivity Kit', quantity: 1428 },
  { name: 'Lightroom Presets Bundle', quantity: 1056 },
  { name: 'After Effects Tutorial', quantity: 823 },
  { name: 'Copywriting Guide', quantity: 697 },
  { name: 'Figma UI Kit', quantity: 671 },
  { name: 'Content Calendar Template', quantity: 489 },
  { name: 'Email Template Pack', quantity: 412 },
];

const chartConfig = Object.fromEntries(
  topSellingProducts.map(product => [
    product.name.replace(/\s+/g, ''),
    {
      label: product.name,
    }
  ])
);

export default function ChartTopSellingProducts() {
  const { theme } = useTheme();

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <CardTitle className="text-lg">Top Selling Products</CardTitle>
            <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">Based on units sold.</CardDescription>
          </div>

          <Select value="last_month"> 
            <SelectTrigger className="shadow-none text-sm h-auto! px-3 py-1.5"> 
              <SelectValue /> 
            </SelectTrigger> 
            <SelectContent> 
              <SelectGroup> 
                <SelectItem className="text-sm" value="last_month">Last Month</SelectItem> 
                <SelectItem className="text-sm" value="last_year">Last Year</SelectItem> 
              </SelectGroup> 
            </SelectContent> 
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-90">
          <BarChart
            accessibilityLayer
            data={topSellingProducts}
            layout="vertical"
            margin={{
              top: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              type="number"
              dataKey="quantity"
              hide
            />
            <YAxis
              dataKey="name"
              type="category"
              width={250}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={({ y, payload }) => (
                <text
                  x={0}
                  y={y + 4}
                  textAnchor="start"
                  style={{
                    fill: theme === 'light' ? '#52525b' : '#a1a1aa',
                    fontSize: 15,
                    whiteSpace: 'normal',
                  }}
                >
                  {payload.value.length > 24
                    ? `${payload.value.slice(0, 24)}...`
                    : payload.value}
                </text>
              )}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;

                const product = payload[0].payload;

                return (
                  <div className="bg-white dark:bg-popover p-2 border rounded shadow text-sm max-w-60">
                    <p className="mb-1.5 leading-snug">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`size-3 rounded-sm`} style={{ backgroundColor: payload[0].color }} />
                      <div>
                        <span className="font-semibold">
                          {formatNumber({ value: product.quantity})}
                        </span>
                        {' '}
                        <span className="text-zinc-800 dark:text-zinc-300">sold</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="quantity"
              fill="var(--chart-1)"
              radius={[2, 4, 4, 2]} // top-left, top-right, bottom-right, bottom-left
            >
              <LabelList
                dataKey="quantity"
                position="right"
                offset={8}
                fontSize={13.5}
                content={({ x, y, width, height, value }) => (
                  <text
                    x={x + width + 8}
                    y={y + height / 2}
                    dy={4}
                    textAnchor="start"
                    fill={theme === 'light' ? '#3f3f46' : '#d4d4d8'}
                    fontSize={12}
                  >
                    {formatNumber({ value, notation: 'compact' })}
                  </text>
                )}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <small className="text-sm text-zinc-500 dark:text-zinc-400/70">Showing top 10 of 25 products</small>
      </CardFooter>
    </Card>
  );
}
