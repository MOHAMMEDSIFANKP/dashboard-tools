"use client"

import { useCallback, useEffect, useState } from "react"
import FinancialTable from "./FinancialTable"
import type { FinancialData } from "@/types/Schemas"
import { CustomSelect } from "@/components/ui/inputs"
import {
  databaseName,
  useFetchAvailableYearsQuery,
  useLazyFetchFinancialDataQuery
} from "@/lib/services/usersApi"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { testCase2ProductId, useFetchTestCase2AvailableYearsQuery, useLazyFetchFinancialDataTestCase2Query } from "@/lib/services/testCase2Api"

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

  // Track if data has been fetched for current selection
  const [dataFetched, setDataFetched] = useState(false);
  const [lastFetchedYear, setLastFetchedYear] = useState<string>('');
  const [lastFetchedMonth, setLastFetchedMonth] = useState<string>('');

  // API hooks
  const result1 = useFetchAvailableYearsQuery(databaseName, {
    skip: testCase !== 'test-case-1'
  });
  const result2 = useFetchTestCase2AvailableYearsQuery(testCase2ProductId, {
    skip: testCase === 'test-case-1'
  });

  const {
    data: yearsData,
    error: yearsError,
    isLoading: yearsLoading
  } = testCase === 'test-case-1' ? result1 : result2;

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


  // Check if current selection has changed from last fetch
  const hasSelectionChanged = () => {
    return selectedYear !== lastFetchedYear || selectedMonth !== lastFetchedMonth;
  };

  // Fetch financial data
  const fetchData = useCallback(async () => {
    if (!selectedYear || !selectedMonth) {
      setError("Please select both year and month");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch current month and YTD data from API
      const result: any = testCase === 'test-case-1'
        ? await fetchFinancialData({
          tableName: databaseName,
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
          const transformedMonthData = monthData.map((item: any) => ({
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

        // Update tracking variables
        setLastFetchedYear(selectedYear);
        setLastFetchedMonth(selectedMonth);
        setDataFetched(true);

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
  }, [selectedYear, selectedMonth, fetchFinancialData, testCase, fetchFinancialDataTestCase2]);

  // Handle submit button click
  const handleSubmit = () => {
    fetchData();
  };
  useEffect(() => {
    if (selectedYear && selectedMonth && !dataFetched) {
      fetchData();
    }
  }, [selectedYear, selectedMonth, dataFetched, fetchData]);

  useEffect(() => {
    setDataFetched(false);
    setLastFetchedYear('');
    setLastFetchedMonth('');
    setMonthData([]);
    setYearData([]);
  }, [testCase]);


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
  const canSubmit = selectedYear && selectedMonth && !isLoading;
  const showChangeIndicator = hasSelectionChanged() && dataFetched;

  return (
    <>
      <section className="w-full flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 bg-white shadow-md rounded-lg">
          <div className="flex flex-col gap-4 p-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-bold text-xl text-gray-800">FINANCE P&L</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Select year and month to view financial data
                </p>
              </div>
            </div>

            {/* Filters and Submit Section */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Year</label>
                  <CustomSelect
                    onChange={handleYearChange}
                    value={availableYears.find((opt) => opt.value === selectedYear)}
                    className="w-full sm:w-[180px] shadow-sm"
                    options={availableYears}
                    placeholder={yearsLoading ? "Loading years..." : "Select Year"}
                    isDisabled={yearsLoading || isLoading}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Month</label>
                  <CustomSelect
                    onChange={handleMonthChange}
                    value={AllMonths.find((opt) => opt.value === selectedMonth)}
                    className="w-full sm:w-[180px] shadow-sm"
                    options={AllMonths}
                    placeholder="Select Month"
                    isDisabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-transparent">Action</label>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm min-w-[120px] ${canSubmit
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading
                    </div>
                  ) : (
                    'Get Data'
                  )}
                </button>
              </div>
            </div>

            {/* Status Information */}
            <div className="flex flex-col gap-2">
              {/* Current Selection Display */}
              {dataFetched && !hasError && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">
                      Data loaded for: {AllMonths[parseInt(lastFetchedMonth, 10) - 1]?.label} {lastFetchedYear}
                    </span>
                  </div>
                  {showChangeIndicator && (
                    <div className="flex items-center gap-1 text-orange-700 bg-orange-50 px-3 py-1 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Selection changed - click "Get Data" to update</span>
                    </div>
                  )}
                </div>
              )}

              {/* Loading Indicator */}
              {isDataLoading && (
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading financial data...</span>
                </div>
              )}
            </div>

            {/* Error Display */}
            {hasError && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm mt-1">
                  {typeof hasError === 'string' ? hasError :
                    error ||
                    'Failed to load data. Please try again.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Table */}
        <div className="w-full">
          {dataFetched && !isDataLoading && !hasError ? (
            <FinancialTable
              monthData={monthData}
              yearData={yearData}
            />
          ) : !dataFetched && !isDataLoading && !hasError ? (
            <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-200 p-12">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Displayed</h3>
                <p className="text-gray-600 mb-4">Select a year and month, then click "Get Data" to view financial information.</p>
                <div className="text-sm text-gray-500">
                  Current selection: {selectedYear ? `${selectedYear}` : 'No year'} / {selectedMonth ? AllMonths[parseInt(selectedMonth, 10) - 1]?.label : 'No month'}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Data Status Footer */}
        {dataFetched && !isDataLoading && !hasError && (
          <div className="text-xs text-gray-500 text-center py-2">
            <p>
              Month records: {monthData.length} | YTD records: {yearData.length}
              {monthData.length === 0 && yearData.length === 0 &&
                " | No data available for selected period"}
            </p>
          </div>
        )}
      </section>
    </>
  )
}