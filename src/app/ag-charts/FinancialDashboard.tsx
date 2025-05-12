"use client"

import { useCallback, useEffect, useState } from "react"
import { useDuckDBContext } from "../_providers/DuckDBContext"
import FinancialTable from "./FinancialTable"
import type { FinancialData } from "@/types/Schemas"
import { CustomSelect } from "@/components/ui/inputs"

interface FilterOption {
  label: string
  value: string
}

const AllMonths: FilterOption[] = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

export default function FinancialDashboard() {
  const [monthData, setMonthData] = useState<FinancialData[]>([])
  const [yearData, setYearData] = useState<FinancialData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [availableYears, setAvailableYears] = useState<FilterOption[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('2017');
  const [selectedMonth, setSelectedMonth] = useState<string>('01');

  const { executeQuery, isDataLoaded } = useDuckDBContext()

  // Fetch available years and months for filters
  const fetchFilterOptions = useCallback(async () => {
    if (!isDataLoaded) return

    try {
      // Fetch distinct years
      const yearsResult = await executeQuery("SELECT DISTINCT fiscalYear FROM financial_data ORDER BY fiscalYear")
      if (yearsResult.success && yearsResult.data) {
        const years = yearsResult.data.map((item) => {
          return {
            label: item.fiscalYear.toString(),
            value: item.fiscalYear.toString(),
          };
        });
        setAvailableYears(years)
      }
    } catch (err) {
      console.error("Error fetching filter options:", err)
    }
  }, [isDataLoaded, executeQuery])

  const fetchData = useCallback(async () => {
    if (!isDataLoaded) return

    setIsLoading(true)

    try {
      // Current Month Data
      const currentMonthQuery = `
        SELECT 
          fiscalYear, 
          period, 
          SUM(revenue) as revenue, 
          SUM(otherIncome) as otherIncome, 
          SUM(grossMargin) as grossMargin, 
          SUM(operatingExpenses) as operatingExpenses, 
          SUM(operatingProfit) as operatingProfit, 
          SUM(FinancialResult) as FinancialResult, 
          SUM(EarningsBeforeTax) as EarningsBeforeTax, 
          SUM(nonRecurringResult) as nonRecurringResult, 
          SUM(netProfit) as netProfit,
          country
        FROM financial_data 
        WHERE fiscalYear = ${selectedYear} 
        AND SUBSTRING(CAST(period AS VARCHAR), 5, 2) = '${selectedMonth}'
        GROUP BY fiscalYear, period, country
      `

      // Current Year Data (YTD)
      const currentYearQuery = `
        SELECT 
          fiscalYear,
          'YTD' as period,
          SUM(revenue) as revenue, 
          SUM(otherIncome) as otherIncome, 
          SUM(grossMargin) as grossMargin, 
          SUM(operatingExpenses) as operatingExpenses, 
          SUM(operatingProfit) as operatingProfit, 
          SUM(FinancialResult) as FinancialResult, 
          SUM(EarningsBeforeTax) as EarningsBeforeTax, 
          SUM(nonRecurringResult) as nonRecurringResult, 
          SUM(netProfit) as netProfit,
          'All' as country
        FROM financial_data 
        WHERE fiscalYear = ${selectedYear}
        GROUP BY fiscalYear
      `

      const monthResult = await executeQuery(currentMonthQuery)
      const yearResult = await executeQuery(currentYearQuery)

      if (monthResult.success && monthResult.data) {
        setMonthData(monthResult.data)
      } else {
        setError(monthResult.error || "Failed to fetch current month data")
      }

      if (yearResult.success && yearResult.data) {
        setYearData(yearResult.data)
      } else {
        setError(yearResult.error || "Failed to fetch year-to-date data")
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }, [isDataLoaded, executeQuery, selectedYear, selectedMonth])

  // Fetch filter options on initial load
  useEffect(() => {
    fetchFilterOptions()
  }, [isDataLoaded, fetchFilterOptions])

  // Fetch data when filters change
  useEffect(() => {
    if (isDataLoaded && selectedYear && selectedMonth) {
      fetchData()
    }
  }, [isDataLoaded, fetchData, selectedYear, selectedMonth])

  return (
    <>
      <section className="w-full flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 bg-white shadow-md rounded-lg">
          <div className="flex items-center justify-between p-4 ">
            <div>
              <h1 className="font-bold text-xl">FINANCE P&L</h1>
              <p className="text-gray-700 text-sm mt-2">
                Showing data for:{" "}
                <span className="font-semibold">
                  {AllMonths[parseInt(selectedMonth || '0', 10) - 1]?.label || "Month"}
                </span>{" "}
                /{" "}
                <span className="font-semibold">
                  {selectedYear || "Year"}
                </span>
              </p>
            </div>
            <div className="flex gap-4">
              <CustomSelect
                onChange={(option: any) => setSelectedYear(option?.value)}
                value={availableYears.find((opt) => opt.value === selectedYear)}
                className="w-[200px] shadow"
                options={availableYears}
                placeholder="Select a Year"
              />
              <CustomSelect
                onChange={(option: any) => setSelectedMonth(option?.value)}
                value={AllMonths.find((opt) => opt.value === selectedMonth)}
                className="w-[200px] shadow"
                options={AllMonths}
                placeholder="Select a Month"
              />
            </div>
          </div>
        </div>
        <div className="w-full">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">
              <p>{error}</p>
            </div>
          ) : (
            <FinancialTable
              monthData={monthData}
              yearData={yearData}
            />
           )}
        </div>
      </section>
    </>
  )
}