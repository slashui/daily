import { Area, AreaChart as RechartsAreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'

interface AreaChartProps {
  data: Array<{ name: string; value: number }>
  height?: number
}

export function AreaChart({ data, height = 300 }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(43, 86%, 51%)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="hsl(43, 86%, 51%)" stopOpacity={0}/>
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(43, 86%, 51%)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}