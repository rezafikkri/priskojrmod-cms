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

const topSellingProducts = [
  { name: 'E-Book Marketing Digital 2024: Strategi Lengkap dari Nol sampai Mahir', quantity: 1247 },
  { name: 'Course SEO Mastery Pro', quantity: 892 },
  { name: 'Template Canva Premium Pack - 500+ Design Siap Pakai', quantity: 634 },
  { name: 'Notion Productivity System', quantity: 570 },
  { name: 'Instagram Preset Lightroom', quantity: 321 },
  { name: 'Video Tutorial After Effects untuk Pemula hingga Advanced', quantity: 215 },
  { name: 'E-Book Copywriting Formula', quantity: 143 },
  { name: 'Figma UI Kit Dashboard', quantity: 89 },
  { name: 'Social Media Content Calendar - Planning Template 12 Bulan', quantity: 52 },
  { name: 'Email Marketing Templates', quantity: 50 },
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
  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <CardTitle className="text-lg">Top Selling Products</CardTitle>
            <CardDescription className="text-base text-zinc-600">Based on units sold.</CardDescription>
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
                    fill: '#3f3f46',
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
                  <div className="bg-white p-2 border rounded shadow text-sm max-w-60">
                    <p className="mb-1.5 leading-snug">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`size-3 rounded-sm`} style={{ backgroundColor: payload[0].color }} />
                      <div>
                        <span className="font-semibold">
                          {product.quantity}
                        </span>
                        {' '}
                        <span className="text-zinc-800">sold</span>
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
                className="fill-foreground"
                fontSize={13.5}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <small className="text-sm text-zinc-500">Showing top 10 of 25 products</small>
      </CardFooter>
    </Card>
  );
}
