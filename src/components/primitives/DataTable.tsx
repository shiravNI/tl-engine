import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export interface DataTableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'right'
  width?: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Optional leading column (e.g. a checkbox) rendered before `columns`. */
  leading?: (row: T) => ReactNode
  leadingHeader?: ReactNode
}

export function DataTable<T>({ columns, rows, rowKey, leading, leadingHeader }: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
        <thead>
          <tr>
            {leading && <th className="w-10 px-3.5 pb-2.5 text-left">{leadingHeader}</th>}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cx(
                  'px-3.5 pb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted',
                  col.align === 'right' ? 'text-right' : 'text-left',
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-border-soft">
              {leading && <td className="px-3.5 py-3 align-middle">{leading(row)}</td>}
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cx(
                    'px-3.5 py-3 align-middle text-body',
                    col.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
