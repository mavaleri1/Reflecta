"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./line-chart";
import { Badge } from "./badge";
import { TrendingUp } from "lucide-react";

interface MoodData {
  date: string;
  mood: number;
  emoji: string;
}

interface MoodLineChartProps {
  data: MoodData[];
  title?: string;
  description?: string;
  showTrend?: boolean;
  trendValue?: number;
}

const chartConfig = {
  mood: {
    label: "Mood",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function MoodLineChart({ 
  data, 
  title = "Trend of Mood",
  description,
  showTrend = true,
  trendValue = 0
}: MoodLineChartProps) {
  // Transform data for recharts format
  const chartData = data.map(item => ({
    date: item.date,
    mood: item.mood,
    emoji: item.emoji
  }));

  // Calculate trend (average change)
  const calculateTrend = () => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].mood;
    const last = chartData[chartData.length - 1].mood;
    return ((last - first) / first) * 100;
  };

  const trend = showTrend ? calculateTrend() : trendValue;
  const isPositiveTrend = trend > 0;

  return (
    <Card className="reflecta-surface border-none reflecta-shadow">
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
              tickCount={Math.min(data.length, 7)} // Maximum 7 dates
              interval="preserveStartEnd" // Show first and last date
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="mood"
              type="linear"
              stroke="white"
              strokeWidth={1}
              dot={<CustomizedMoodDot />}
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const CustomizedMoodDot = (props: React.SVGProps<SVGCircleElement> & { payload?: any }) => {
  const { cx, cy, stroke, payload } = props;

  if (!payload) return null;

  return (
    <g>
      {/* Main dot */}
      <circle cx={cx} cy={cy} r={4} fill={stroke} />
      {/* Emoji background */}
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="rgba(255, 255, 255, 0.1)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={1}
      />
      {/* Ping animation circles */}
      <circle
        cx={cx}
        cy={cy}
        r={4}
        stroke={stroke}
        fill="none"
        strokeWidth="1"
        opacity="0.6"
      >
        <animate
          attributeName="r"
          values="4;12"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
};
