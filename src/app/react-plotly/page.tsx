"use client";
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useDuckDBContext } from "../_providers/DuckDBContext";

// Interfaces
interface FilterBarProps {
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
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

interface PieChartData {
  grossMargin: number;
  opEx: number;
  netProfit: number;
  revenue: number;
}

interface DonutChartData {
  catAccountingView: string;
  revenue: number;
}

export default function ReactPlotly() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [years, setYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData | null>(null);
  const [donutChartData, setDonutChartData] = useState<DonutChartData[]>([]);

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
        const [lineRes, barRes, pieRes, donutRes] = await Promise.all([
          executeQuery(`
            SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit 
            FROM financial_data ${whereClause}
            GROUP BY period ORDER BY period
          `),
          executeQuery(`
            SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses 
            FROM financial_data ${whereClause}
            GROUP BY period ORDER BY period
          `),
          executeQuery(`
            SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as opEx, 
                   SUM(netProfit) as netProfit, SUM(revenue) as revenue 
            FROM financial_data ${whereClause}
          `),
          executeQuery(`
            SELECT catAccountingView, SUM(revenue) as revenue 
            FROM financial_data ${whereClause}
            GROUP BY catAccountingView ORDER BY revenue DESC
          `)
        ]);

        if (lineRes.success) setLineChartData(lineRes.data as LineChartDataPoint[]);
        if (barRes.success) setBarChartData(barRes.data as BarChartDataPoint[]);
        if (pieRes.success && pieRes.data) setPieChartData(pieRes.data[0] as PieChartData);
        if (donutRes.success) setDonutChartData(donutRes.data as DonutChartData[]);
    
        setError(null);
      } catch (err) {
        setError("Failed to load chart data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [isDataLoaded, selectedYear, executeQuery]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading financial data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard React Plotly</h1>
      <FilterBar years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer title="Monthly Performance (Line)">
          <Plot
            data={[
              {
                x: lineChartData.map((d) => d.period),
                y: lineChartData.map((d) => d.revenue),
                type: "scatter",
                mode: "lines+markers",
                name: "Revenue",
                line: { color: "blue" },
              },
              {
                x: lineChartData.map((d) => d.period),
                y: lineChartData.map((d) => d.grossMargin),
                type: "scatter",
                mode: "lines+markers",
                name: "Gross Margin",
                line: { color: "purple" },
              },
              {
                x: lineChartData.map((d) => d.period),
                y: lineChartData.map((d) => d.netProfit),
                type: "scatter",
                mode: "lines+markers",
                name: "Net Profit",
                line: { color: "green" },
              },
            ]}
            layout={{ title: "Monthly Performance" }}
            style={{ width: "100%", height: "100%" }}
          />
        </ChartContainer>

        <ChartContainer title="Revenue vs Expenses (Bar)">
          <Plot
            data={[
              {
                x: barChartData.map((d) => d.period),
                y: barChartData.map((d) => d.revenue),
                type: "bar",
                name: "Revenue",
                marker: { color: "teal" },
              },
              {
                x: barChartData.map((d) => d.period),
                y: barChartData.map((d) => d.expenses),
                type: "bar",
                name: "Expenses",
                marker: { color: "orange" },
              },
            ]}
            layout={{ title: "Revenue vs Operating Expenses", barmode: "group" }}
            style={{ width: "100%", height: "100%" }}
          />
        </ChartContainer>

        <ChartContainer title="Financial Breakdown (Pie)">
          <Plot
            data={[
              {
                values: [
                  pieChartData?.revenue || 0,
                  pieChartData?.grossMargin || 0,
                  pieChartData?.netProfit || 0,
                  pieChartData?.opEx || 0,
                ],
                labels: ["Revenue", "Gross Margin", "Net Profit", "Operating Expenses"],
                type: "pie",
              },
            ]}
            layout={{ title: "Financial Distribution" }}
            style={{ width: "100%", height: "100%" }}
          />
        </ChartContainer>

        <ChartContainer title="Category-wise Revenue (Donut)">
          <Plot
            data={[
              {
                values: donutChartData.map((d) => d.revenue),
                labels: donutChartData.map((d) => d.catAccountingView),
                type: "pie",
                hole: 0.5,
              },
            ]}
            layout={{ title: "Revenue by Category" }}
            style={{ width: "100%", height: "100%" }}
          />
        </ChartContainer>
      </div>
    </section>
  );
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="">{children}</div>
  </div>
);

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
