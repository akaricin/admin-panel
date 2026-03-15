'use client'

import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, BarChart, Bar, ScatterChart, Scatter, ZAxis 
} from 'recharts'
import { format } from 'date-fns'

interface VotesData {
  hour: string
  count: number
}

interface LatencyPoint {
  timestamp: number
  processingTime: number
  modelId: number
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function VoteVolumeBarChart({ data }: { data: VotesData[] }) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="hour" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
          />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar 
            dataKey="count" 
            fill="#6366f1" 
            radius={[4, 4, 0, 0]} 
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LLMPerformanceScatterPlot({ data, modelIds }: { data: LatencyPoint[], modelIds: number[] }) {
  // Group data by modelId for multiple scatters
  const dataByModel = modelIds.map(id => ({
    modelId: id,
    points: data.filter(p => p.modelId === id)
  }))

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            type="number" 
            dataKey="timestamp" 
            name="Time" 
            domain={['auto', 'auto']}
            tickFormatter={(unixTime) => format(new Date(unixTime), 'HH:mm')}
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
          />
          <YAxis 
            type="number" 
            dataKey="processingTime" 
            name="Seconds" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: 12 } }}
          />
          <ZAxis range={[20, 20]} /> {/* This controls point size */}
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const pData = payload[0].payload as LatencyPoint
                return (
                  <div className="bg-white p-3 rounded-xl shadow-lg border-none text-xs">
                    <p className="font-bold text-gray-900">Model {pData.modelId}</p>
                    <p className="text-gray-500">{format(new Date(pData.timestamp), 'HH:mm:ss')}</p>
                    <p className="text-indigo-600 font-medium">{pData.processingTime}s</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
          {dataByModel.map((model, index) => (
            <Scatter
              key={model.modelId}
              name={`Model ${model.modelId}`}
              data={model.points}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
