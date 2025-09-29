import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'

interface BarChartProps {
  data: Array<{ name: string; value: number }>
  height?: number
}

export function BarChart({ data, height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(240, 4%, 46.1%)"
          strokeOpacity={0.3}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(240, 4%, 46.1%)', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(240, 4%, 46.1%)', fontSize: 12 }}
        />
        <Bar
          dataKey="value"
          fill="hsl(43, 86%, 51%)"
          radius={[4, 4, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}