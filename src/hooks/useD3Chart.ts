
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { ChartData, StockData, UseD3ChartReturnType } from '../types'
import { generateD3Chart } from '../utils'

const API_URL = 'https://eodhd.com/api/eod/'
const API_TOKEN = import.meta.env.VITE_APP_EODHD_API_TOKEN || 'demo'

export const useD3Chart = (stockSymbol: string, year: number): UseD3ChartReturnType => {
  const chartRef: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null)
  // We can get a warning and no data from the free version of the API
  const [warning, setWarning] = useState<string | undefined>(undefined)

  useEffect(() => {
    const apiEndpoint = `${API_URL}${stockSymbol}?from=${year}-01-01&to=${year}-12-31&period=d&fmt=json&&api_token=${API_TOKEN}`

    // Create an AbortController instance to cancel the fetch request when the component is unmounted
    const abortController: AbortController = new AbortController()

    // Get the chart container element
    const element: HTMLDivElement | null = chartRef.current

    const fetchStockData = async (): Promise<ChartData[] | undefined> => {
      try {
        const response = await fetch(apiEndpoint, {
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch data. Status: ${response.status}`)
        }

        const data: StockData[] = await response.json()

        // We can get a warning and no data from the free version of the API
        if (data.length === 1 && Object.prototype.hasOwnProperty.call(data[0], 'warning')) {
          setWarning(() => (data as unknown as { warning: string }[])[0].warning)
          return
        }

        // Convert the date strings to Date objects to not to do it in D3.js
        return data.map((d: StockData): ChartData => ({
          ...d,
          date: dayjs(d.date).toDate(),
        }))
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // Fetch was cancelled, ignore the error
          return
        } else {
          console.error('Error fetching data:', error)
        }
      }
    }
    fetchStockData().then((data: ChartData[] | undefined) => {
      if (data && element && !warning) {
        generateD3Chart(stockSymbol, data, element, 1200, 400)
      }
    })

    return () => {
      // Cancel the fetch request if it's still pending when the component is unmounted
      abortController.abort()
      if (element) {
        // Clear the chart when the component is unmounted
        element.innerHTML = ''
      }
    }
  }, [stockSymbol, warning, year])

  return { chartRef, warning }
}