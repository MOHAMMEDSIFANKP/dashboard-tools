"use client";
import React, { useState, useEffect, useRef } from "react";
import { AgCharts } from "ag-charts-react";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { AgChartOptions } from "ag-charts-community";

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
  label: string;
  value: number;
}

interface DonutChartData {
  catAccountingView: string;
  revenue: number;
}

// Chart container props
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  data?: any[];
}

// Export buttons component with fixed export functionality
const ExportButtons: React.FC<{ chartRef: React.RefObject<any>, data?: any[] }> = ({ chartRef, data }) => {
  // Export to CSV function (unchanged as it doesn't rely on AG Charts API)
  const exportToCSV = () => {
    if (!data || !data.length) return;
    
    // Convert chart data to CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chart_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fixed PNG export using canvas
  const exportToPNG = () => {
    const chartElement = chartRef.current;
    if (!chartElement) return;
    
    // Find the canvas element within the chart component
    const canvas = chartElement.querySelector('canvas');
    if (canvas) {
      // Create an image from the canvas
      const image = canvas.toDataURL('image/png');
      
      // Trigger download
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex space-x-2">
      <button 
        onClick={exportToPNG}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
      >
        PNG
      </button>
      <button 
        onClick={exportToCSV}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
      >
        CSV
      </button>
    </div>
  );
};

// Chart container component
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <ExportButtons chartRef={chartRef} data={data} />
      </div>
      <div ref={chartRef}>
        {children}
      </div>
    </div>
  );
};

// Filter bar props
interface FilterBarProps {
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

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

  // Data states
  const [lineData, setLineData] = useState<LineChartDataPoint[]>([]);
  const [barData, setBarData] = useState<BarChartDataPoint[]>([]);
  const [pieData, setPieData] = useState<PieChartData[]>([]);
  const [donutData, setDonutData] = useState<DonutChartData[]>([]);

  // Chart options
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
          const data = lineResult.data as LineChartDataPoint[];
          setLineData(data);
          setLineChartOptions({
            title: { text: "Profit & Loss Accounts" },
            subtitle: { text: "Showing numbers in $" },
            data: data,
            series: [
              { type: "line", xKey: "period", yKey: "revenue", yName: "Revenue" },
              { type: "line", xKey: "period", yKey: "grossMargin", yName: "Gross Margin" },
              { type: "line", xKey: "period", yKey: "netProfit", yName: "Net Profit" },
            ],
            
          });
        }

        if (barResult.success && barResult.data) {
          const data = barResult.data as BarChartDataPoint[];
          setBarData(data);
          setBarChartOptions({
            title: { text: "Revenue vs Expenses" },
            data: data,
            series: [
              { type: "bar", xKey: "period", yKey: "revenue", yName: "Revenue" },
              { type: "bar", xKey: "period", yKey: "expenses", yName: "Expenses" },
            ],
          
          });
        }

        if (pieResult.success && pieResult.data?.length) {
          const pieData = pieResult.data[0] as any;
          const transformed = Object.entries(pieData)
            .map(([key, value]) => ({ label: key, value: value as number }));
          setPieData(transformed);
          setPieChartOptions({
            title: { text: "Financial Distribution" },
            data: transformed,
            // @ts-ignore
            series: [{ type: "pie", angleKey: "value", labelKey: "label" }],
           
          });
        }

        if (donutResult.success && donutResult.data) {
          const data = donutResult.data as DonutChartData[];
          setDonutData(data);
          setDonutChartOptions({
            title: { text: "Revenue by Category" },
            data: data,
            // @ts-ignore
            series: [{ type: "donut", angleKey: "revenue", labelKey: "catAccountingView" }],
           
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
          <ChartContainer title="Line Series" data={lineData}>
            <AgCharts options={lineChartOptions} />
          </ChartContainer>
        )}
        {barChartOptions && (
          <ChartContainer title="Bar Series" data={barData}>
            <AgCharts options={barChartOptions} />
          </ChartContainer>
        )}
        {pieChartOptions && (
          <ChartContainer title="Pie Series" data={pieData}>
            <AgCharts options={pieChartOptions} />
          </ChartContainer>
        )}
        {donutChartOptions && (
          <ChartContainer title="Donut Series" data={donutData}>
            <AgCharts options={donutChartOptions} />
          </ChartContainer>
        )}
      </div>
    </section>
  );
};

export default AgChartsPage;