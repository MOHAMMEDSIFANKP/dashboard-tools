"use client"

import { useCallback, useEffect, useState } from "react"
import FinancialTable from "./FinancialTable"
import type { FinancialData } from "@/types/Schemas"
import { CustomSelect } from "@/components/ui/inputs"
import {
  useFetchAvailableYearsQuery,
  useLazyFetchFinancialDataQuery
} from "@/lib/services/usersApi"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { testCase2ProductId, useLazyFetchFinancialDataTestCase2Query } from "@/lib/services/testCase2Api"

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
  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

  const [monthData, setMonthData] = useState<FinancialData[]>([])
  const [yearData, setYearData] = useState<FinancialData[]>([])

  const [availableYears, setAvailableYears] = useState<FilterOption[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('2022');
  const [selectedMonth, setSelectedMonth] = useState<string>('01');

  // API hooks
  const {
    data: yearsData,
    error: yearsError,
    isLoading: yearsLoading
  } = useFetchAvailableYearsQuery('sample_100k');

  const [fetchFinancialData] = useLazyFetchFinancialDataQuery();
  const [fetchFinancialDataTestCase2] = useLazyFetchFinancialDataTestCase2Query()

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process available years data
  useEffect(() => {
    if (yearsData && yearsData.success && yearsData.years) {
      const formattedYears = yearsData.years.map((year: any) => ({
        label: year.label,
        value: year.value
      }));
      setAvailableYears(formattedYears);

      // Set default year if not already set
      if (!selectedYear && formattedYears.length > 0) {
        setSelectedYear(formattedYears[formattedYears.length - 1].value); // Latest year
      }
    }
  }, [yearsData, selectedYear]);

  // Handle years loading error
  useEffect(() => {
    if (yearsError) {
      console.error("Error fetching available years:", yearsError);
      setError("Failed to load available years");
    }
  }, [yearsError]);

  // Fetch financial data when filters change
  const fetchData = useCallback(async () => {
    if (!selectedYear || !selectedMonth) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch current month and YTD data from API
      const result: any = testCase === 'test-case-1'
        ? await fetchFinancialData({
          tableName: 'sample_100k',
          year: selectedYear,
          month: selectedMonth
        }).unwrap()
        : await fetchFinancialDataTestCase2({
          productId: testCase2ProductId,
          year: selectedYear,
          month: selectedMonth
        })



      const isSuccess = testCase === 'test-case-1'
        ? result?.success
        : !!result?.data?.success;

      if (isSuccess) {
        const monthData = testCase === 'test-case-1'
          ? result.month_data
          : result.data?.month_data;

        const ytdData = testCase === 'test-case-1'
          ? result.ytd_data
          : result.data?.ytd_data;

        // Set month data
        if (monthData && monthData.length > 0) {
          // Transform API response to match FinancialData interface
          const transformedMonthData =monthData.map((item: any) => ({
            fiscalyear: parseInt(item.fiscalyear),
            period: item.period,
            revenue: item.revenue || 0,
            otherIncome: item.otherIncome || 0,
            grossMargin: item.grossMargin || 0,
            operatingExpenses: item.operatingExpenses || 0,
            operatingProfit: item.operatingProfit || 0,
            FinancialResult: item.FinancialResult || 0,
            EarningsBeforeTax: item.EarningsBeforeTax || 0,
            nonRecurringResult: item.nonRecurringResult || 0,
            netProfit: item.netProfit || 0
          }));
          setMonthData(transformedMonthData);
        } else {
          setMonthData([]);
        }

        // Set YTD data
        if (ytdData && ytdData.length > 0) {
          const transformedYearData = ytdData.map((item: any) => ({
            fiscalyear: parseInt(item.fiscalyear),
            period: item.period,
            revenue: item.revenue || 0,
            otherIncome: item.otherIncome || 0,
            grossMargin: item.grossMargin || 0,
            operatingExpenses: item.operatingExpenses || 0,
            operatingProfit: item.operatingProfit || 0,
            FinancialResult: item.FinancialResult || 0,
            EarningsBeforeTax: item.EarningsBeforeTax || 0,
            nonRecurringResult: item.nonRecurringResult || 0,
            netProfit: item.netProfit || 0
          }));
          setYearData(transformedYearData);
        } else {
          setYearData([]);
        }
      } else {
        setError("Failed to fetch financial data");
        setMonthData([]);
        setYearData([]);
      }
    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      setError(err?.data?.detail || err.message || "Failed to fetch financial data");
      setMonthData([]);
      setYearData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, fetchFinancialData, testCase]);

  // Fetch data when filters change
  useEffect(() => {
    if (selectedYear && selectedMonth) {
      fetchData();
    }
  }, [fetchData]);

  // Handle year selection change
  const handleYearChange = (option: any) => {
    if (option?.value) {
      setSelectedYear(option.value);
    }
  };

  // Handle month selection change
  const handleMonthChange = (option: any) => {
    if (option?.value) {
      setSelectedMonth(option.value);
    }
  };

  const isDataLoading = isLoading || yearsLoading;
  const hasError = error || yearsError;

  return (
    <>
      <section className="w-full flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 bg-white shadow-md rounded-lg">
          <div className="flex items-center justify-between p-4">
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
              {isDataLoading && (
                <p className="text-blue-600 text-xs mt-1">Loading...</p>
              )}
            </div>
            <div className="flex gap-4">
              <CustomSelect
                onChange={handleYearChange}
                value={availableYears.find((opt) => opt.value === selectedYear)}
                className="w-[200px] shadow"
                options={availableYears}
                placeholder={yearsLoading ? "Loading years..." : "Select a Year"}
                isDisabled={yearsLoading || isLoading}
              />
              <CustomSelect
                onChange={handleMonthChange}
                value={AllMonths.find((opt) => opt.value === selectedMonth)}
                className="w-[200px] shadow"
                options={AllMonths}
                placeholder="Select a Month"
                isDisabled={isLoading}
              />
            </div>
          </div>

          {/* Error Display */}
          {hasError && (
            <div className="mx-4 mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">
                {typeof hasError === 'string' ? hasError :
                  error ||
                  'Failed to load data. Please try again.'}
              </p>
            </div>
          )}
        </div>

        <div className="w-full">
          {isDataLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              <span className="ml-3 text-gray-600">Loading financial data...</span>
            </div>
          ) : (
            <FinancialTable
              monthData={monthData}
              yearData={yearData}
            />
          )}
        </div>

        {/* Data Status */}
        <div className="text-xs text-gray-500 text-center">
          {!isDataLoading && !hasError && (
            <p>
              Month records: {monthData.length} | YTD records: {yearData.length}
              {monthData.length === 0 && yearData.length === 0 &&
                " | No data available for selected period"}
            </p>
          )}
        </div>
      </section>
    </>
  )
}