import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { Icon } from '@/components/icons/Icon'
import { Card } from '@/components/primitives/Card'
import { Skeleton } from '@/components/primitives/Skeleton'
import { SkeletonBoundary } from '@/components/primitives/SkeletonBoundary'
import type { KpiTile as KpiTileData } from '@/data/services/insightsService'

interface KpiTileProps {
  isLoading: boolean
  data?: KpiTileData
}

export function KpiTile({ isLoading, data }: KpiTileProps) {
  return (
    <Card className="flex flex-col gap-2.5 p-4">
      <SkeletonBoundary
        isLoading={isLoading || !data}
        fallback={
          <>
            <Skeleton width={70} height={9} />
            <Skeleton width={100} height={24} />
            <Skeleton height={24} />
          </>
        }
      >
        {data && (
          <>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{data.label}</p>
            <div className="flex items-end gap-2">
              <span className="text-[26px] font-bold leading-none">{data.value}</span>
              <span
                className={
                  'inline-flex items-center gap-0.5 text-[11.5px] font-semibold ' +
                  (data.deltaDirection === 'up' ? 'text-success-fg' : 'text-danger-fg')
                }
              >
                <Icon name={data.deltaDirection === 'up' ? 'up' : 'down'} className="h-3 w-3" />
                {data.deltaLabel}
              </span>
            </div>
            <div className="h-[26px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.spark.map((v, i) => ({ i, v }))}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={data.deltaDirection === 'up' ? 'var(--tl-accent)' : 'var(--tl-muted-2)'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </SkeletonBoundary>
    </Card>
  )
}
