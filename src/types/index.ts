interface APIDataWithoutDate {
  open: number
  high: number
  low: number
  close: number
  adjusted_close: number
  volume: number
}

export interface StockData extends APIDataWithoutDate {
  date: string
}

export interface ChartData extends APIDataWithoutDate {
  date: Date
}

export type UseD3ChartReturnType = {
  chartRef: React.MutableRefObject<HTMLDivElement | null>
  warning?: string
}