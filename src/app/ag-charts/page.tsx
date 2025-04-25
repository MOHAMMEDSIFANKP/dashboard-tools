"use client";
import React, { useState, useEffect } from "react";
import { AgCharts } from "ag-charts-react";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { AgChartOptions } from "ag-charts-community";

// Chart container type
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

// Filter bar props
interface FilterBarProps {
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

// Chart data types
interface BarChartDataPoint {
  period: string;
  revenue: number;
  expenses: number;
}

interface LineChartDataPoint {
  period: string;
  revenue: number;
  grossMargin: number;
  netProfit: number;
}

interface PieChartData {
  revenue: number;
  grossMargin: number;
  netProfit: number;
  opEx: number;
}

interface DonutChartData {
  catAccountingView: string;
  revenue: number;
}


// Chart container reusable component
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <div>{children}</div>
  </div>
);

// Filter bar component
const FilterBar: React.FC<FilterBarProps> = ({ years, selectedYear, onYearChange }) => (
  <div className="mb-6">
    <label className="mr-2 font-medium">Year:</label>
    <select
      value={selectedYear}
      onChange={(e) => onYearChange(e.target.value)}
      className="border border-gray-300 rounded px-3 py-2"
    >
      <option value="all">All Years</option>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  </div>
);

const AgChartsPage: React.FC = () => {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [years, setYears] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [barChartOptions, setBarChartOptions] = useState<AgChartOptions | null>(null);
  const [lineChartOptions, setLineChartOptions] = useState<AgChartOptions | null>(null);
  const [pieChartOptions, setPieChartOptions] = useState<AgChartOptions | null>(null);
  const [donutChartOptions, setDonutChartOptions] = useState<AgChartOptions | null>(null);

  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchYears = async () => {
      try {
        const result = await executeQuery("SELECT DISTINCT fiscalYear FROM financial_data ORDER BY fiscalYear");
        if (result.success && result.data) {
          setYears(result.data.map((row: { fiscalYear: string }) => row.fiscalYear));
        }
      } catch (err) {
        console.error("Failed to fetch years:", err);
      }
    };

    fetchYears();
  }, [isDataLoaded, executeQuery]);

  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchChartData = async () => {
      setIsLoading(true);
      const whereClause = selectedYear !== "all" ? `WHERE fiscalYear = '${selectedYear}'` : "";

      try {
        const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
          executeQuery(`SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as opEx, SUM(netProfit) as netProfit, SUM(revenue) as revenue FROM financial_data ${whereClause}`),
          executeQuery(`SELECT catAccountingView, SUM(revenue) as revenue FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC`)
        ]);

        if (lineResult.success && lineResult.data) {
          const lineData = lineResult.data as LineChartDataPoint[];
          setLineChartOptions({
            title: { text: "Profit & Loss Accounts" },
            subtitle: { text: "Showing numbers in $" },
            data: lineData,
            series: [
              { type: "line", xKey: "period", yKey: "revenue", yName: "Revenue" },
              { type: "line", xKey: "period", yKey: "grossMargin", yName: "Gross Margin" },
              { type: "line", xKey: "period", yKey: "netProfit", yName: "Net Profit" },
            ]
          });
        }

        if (barResult.success && barResult.data) {
          const barData = barResult.data as BarChartDataPoint[];
          setBarChartOptions({
            title: { text: "Revenue vs Expenses" },
            data: barData,
            series: [
              { type: "bar", xKey: "period", yKey: "revenue", yName: "Revenue" },
              { type: "bar", xKey: "period", yKey: "expenses", yName: "Expenses" },
            ]
          });
        }

        if (pieResult.success && pieResult.data?.length) {
          const pieData = pieResult.data[0] as PieChartData;
          const transformedPie = Object.entries(pieData).map(([key, value]) => ({ label: key, value }));
          setPieChartOptions({
            title: { text: "Financial Distribution" },
            data: transformedPie,
            // @ts-ignore
            series: [{ type: "pie" as any, angleKey: "value", labelKey: "label" }]
          });
        }

        if (donutResult.success && donutResult.data) {
          const donutData = donutResult.data as DonutChartData[];
          setDonutChartOptions({
            title: { text: "Revenue by Category" },
            data: donutData,
            // @ts-ignore
            series: [{ type: "donut", angleKey: "revenue", labelKey: "catAccountingView" }]
          });
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedYear, isDataLoaded, executeQuery]);

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Ag Charts</h1>
      <FilterBar years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} />
      {error && <p className="text-red-500">{error}</p>}
      {isLoading && <p className="text-gray-500">Loading...</p>}
      <div className="grid grid-cols-2 gap-4">
      {lineChartOptions && (
          <ChartContainer title="Line Series">
            <AgCharts options={lineChartOptions} />
          </ChartContainer>
        )}
        {barChartOptions && (
          <ChartContainer title="Bar Series">
            <AgCharts options={barChartOptions} />
          </ChartContainer>
        )}
        {pieChartOptions && (
          <ChartContainer title="Pie Series">
            <AgCharts options={pieChartOptions} />
          </ChartContainer>
        )}
        {donutChartOptions && (
          <ChartContainer title="Donut Series">
            <AgCharts options={donutChartOptions} />
          </ChartContainer>
        )}
      </div>
    </section>
  );
};

export default AgChartsPage;