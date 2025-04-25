"use client";
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import { useDuckDBContext } from "../_providers/DuckDBContext";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Define TypeScript interfaces for chart data
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

interface FilterBarProps {
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

interface LineChartDataPoint {
  period: string;
  revenue: number;
  grossMargin: number;
  netProfit: number;
}

interface BarChartDataPoint {
  period: string;
  revenue: number;
  expenses: number;
}

interface PieChartDataPoint {
  grossMargin: number;
  opEx: number;
  netProfit: number;
  revenue: number;
}

interface DonutChartDataPoint {
  catAccountingView: string;
  revenue: number;
}

// Chart container component
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="h-64">{children}</div>
  </div>
);

// Filter component
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

// Main dashboard component
export default function ChartJsPage() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [years, setYears] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Chart data states
  const [lineChartData, setLineChartData] = useState<ChartData<'line'> | null>(null);
  const [barChartData, setBarChartData] = useState<ChartData<'bar'> | null>(null);
  const [pieChartData, setPieChartData] = useState<ChartData<'pie'> | null>(null);
  const [donutChartData, setDonutChartData] = useState<ChartData<'doughnut'> | null>(null);

  // Fetch available years (small query)
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const fetchYears = async (): Promise<void> => {
      try {
        const result = await executeQuery("SELECT DISTINCT fiscalYear FROM financial_data ORDER BY fiscalYear");
        if (result.success && result.data) {
          setYears(result.data.map((row: { fiscalYear: string }) => row.fiscalYear));
        }
      } catch (err: unknown) {
        console.error("Failed to fetch years:", err);
      }
    };
    
    fetchYears();
  }, [isDataLoaded, executeQuery]);

  // Fetch chart data based on selected year
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const fetchChartData = async (): Promise<void> => {
      setIsLoading(true);
      try {
        // Build WHERE clause for year filter
        const whereClause = selectedYear !== "all" ? `WHERE fiscalYear = '${selectedYear}'` : "";
        
        // Line chart data - monthly performance trends
        const lineQuery = `
          SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit 
          FROM financial_data 
          ${whereClause}
          GROUP BY period 
          ORDER BY period
          
        `;
        
        // Bar chart data - revenue vs expenses
        const barQuery = `
          SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses
          FROM financial_data
          ${whereClause}
          GROUP BY period
          ORDER BY period
          
        `;
        
        // Pie chart data - financial distribution
        const pieQuery = `
          SELECT 
            SUM(grossMargin) as grossMargin,
            SUM(operatingExpenses) as opEx,
            SUM(netProfit) as netProfit,
            SUM(revenue) as revenue
          FROM financial_data
          ${whereClause}
        `;
        
        // Donut chart data - distribution by category
        const donutQuery = `
          SELECT catAccountingView, SUM(revenue) as revenue
          FROM financial_data
          ${whereClause}
          GROUP BY catAccountingView
          ORDER BY revenue DESC
          
        `;
        
        // Execute all queries in parallel
        const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
          executeQuery(lineQuery),
          executeQuery(barQuery),
          executeQuery(pieQuery),
          executeQuery(donutQuery)
        ]);
        
        // Process line chart data
        if (lineResult.success && lineResult.data) {
          const data = lineResult.data as LineChartDataPoint[];
          setLineChartData({
            labels: data.map(item => item.period),
            datasets: [
              {
                label: "Revenue",
                data: data.map(item => item.revenue),
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.5)",
              },
              {
                label: "Gross Margin",
                data: data.map(item => item.grossMargin),
                borderColor: "rgb(53, 162, 235)",
                backgroundColor: "rgba(53, 162, 235, 0.5)",
              },
              {
                label: "Net Profit",
                data: data.map(item => item.netProfit),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.5)",
              }
            ]
          });
        }
        
        // Process bar chart data
        if (barResult.success && barResult.data) {
          const data = barResult.data as BarChartDataPoint[];
          setBarChartData({
            labels: data.map(item => item.period),
            datasets: [
              {
                label: "Revenue",
                data: data.map(item => item.revenue),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
              },
              {
                label: "Expenses",
                data: data.map(item => item.expenses),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
              }
            ]
          });
        }
        
        // Process pie chart data
        if (pieResult.success && pieResult.data && pieResult.data[0]) {
          const data = pieResult.data[0] as PieChartDataPoint;
          setPieChartData({
            labels: ["Gross Margin", "Operating Expenses", "Net Profit", "Other"],
            datasets: [{
              data: [
                data.grossMargin,
                data.opEx,
                data.netProfit,
                data.revenue - data.grossMargin - data.opEx - data.netProfit
              ],
              backgroundColor: [
                "rgba(75, 192, 192, 0.6)",
                "rgba(255, 99, 132, 0.6)",
                "rgba(53, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
              ]
            }]
          });
        }
        
        // Process donut chart data
        if (donutResult.success && donutResult.data) {
          const data = donutResult.data as DonutChartDataPoint[];
          setDonutChartData({
            labels: data.map(item => item.catAccountingView),
            datasets: [{
              data: data.map(item => item.revenue),
              backgroundColor: [
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 99, 132, 0.6)",
              ]
            }]
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, [isDataLoaded, executeQuery, selectedYear]);

  const chartOptions: ChartOptions<'line' | 'bar' | 'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const }
    }
  };

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (isLoading && (!lineChartData || !barChartData)) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading financial data...</div>
      </div>
    );
  }

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">
        Financial Dashboard Chart Js
      </h1>

      <FilterBar 
        years={years}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {lineChartData && (
          <ChartContainer title="Revenue Trends">
            <Line options={chartOptions as ChartOptions<'line'>} data={lineChartData} />
          </ChartContainer>
        )}

        {barChartData && (
          <ChartContainer title="Revenue vs Expenses">
            <Bar options={chartOptions as ChartOptions<'bar'>} data={barChartData} />
          </ChartContainer>
        )}

        {pieChartData && (
          <ChartContainer title="Financial Distribution">
            <Pie options={chartOptions as ChartOptions<'pie'>} data={pieChartData} />
          </ChartContainer>
        )}

        {donutChartData && (
          <ChartContainer title="Revenue by Category">
            <Doughnut 
              options={{...chartOptions, cutout: "50%"} as ChartOptions<'doughnut'>} 
              data={donutChartData} 
            />
          </ChartContainer>
        )}
      </div>
    </section>
  );
}