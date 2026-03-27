"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataPoint {
  label: string;
  value: number;
}

interface ChartData {
  packagesOverTime: DataPoint[];
  complianceBreakdown: { name: string; value: number; color: string }[];
}

function SimpleLineChart({ data }: { data: DataPoint[] }) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  // Calculate points for the line
  const width = 100;
  const height = 60;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((d.value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  // Create area fill points
  const areaPoints = [
    `${padding},${height - padding}`,
    ...data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((d.value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    }),
    `${width - padding},${height - padding}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full">
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGradient)" />
      <polyline
        points={points}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((d.value - minValue) / range) * chartHeight;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill="var(--chart-1)"
            className="opacity-0 hover:opacity-100"
          />
        );
      })}
    </svg>
  );
}

function CompliancePieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90;

  const createArcPath = (
    startAngle: number,
    endAngle: number,
    radius: number
  ) => {
    const start = {
      x: 50 + radius * Math.cos((startAngle * Math.PI) / 180),
      y: 50 + radius * Math.sin((startAngle * Math.PI) / 180),
    };
    const end = {
      x: 50 + radius * Math.cos((endAngle * Math.PI) / 180),
      y: 50 + radius * Math.sin((endAngle * Math.PI) / 180),
    };
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M 50 50 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-32 w-32">
        {data.map((segment, i) => {
          const angle = (segment.value / total) * 360;
          const path = createArcPath(currentAngle, currentAngle + angle, 45);
          currentAngle += angle;
          return (
            <path
              key={i}
              d={path}
              fill={segment.color}
              className="transition-opacity hover:opacity-80"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="var(--card)" />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-xs font-semibold"
        >
          {total}
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((segment) => (
          <div key={segment.name} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">{segment.name}</span>
            <span className="font-medium">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartsProps {
  data?: ChartData;
}

export function Charts({ data }: ChartsProps) {
  const defaultData: ChartData = {
    packagesOverTime: [
      { label: "Jan", value: 12 },
      { label: "Feb", value: 19 },
      { label: "Mar", value: 15 },
      { label: "Apr", value: 25 },
      { label: "May", value: 22 },
      { label: "Jun", value: 30 },
      { label: "Jul", value: 28 },
    ],
    complianceBreakdown: [
      { name: "Compliant", value: 45, color: "#22c55e" },
      { name: "Pending Check", value: 12, color: "#f59e0b" },
      { name: "At Risk", value: 3, color: "#ef4444" },
    ],
  };

  const chartData = data || defaultData;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Packages Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleLineChart data={chartData.packagesOverTime} />
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            {chartData.packagesOverTime.map((d) => (
              <span key={d.label}>{d.label}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Plot Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CompliancePieChart data={chartData.complianceBreakdown} />
        </CardContent>
      </Card>
    </div>
  );
}
