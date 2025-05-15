"use client";
import React, { useEffect, useState } from "react";
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryLegend,
  VictoryGroup,
  VictoryBar,
  VictoryAxis,
  VictoryPie,
  VictoryTooltip
} from "victory";
import { useDuckDBContext } from "../_providers/DuckDBContext";

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

const VictoryChartsPage = () => {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [years, setYears] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Chart data states
  const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartDataPoint | null>(null);
  const [donutChartData, setDonutChartData] = useState<DonutChartDataPoint[]>([]);

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
          setLineChartData(lineResult.data as LineChartDataPoint[]);
        }

        // Process bar chart data
        if (barResult.success && barResult.data) {
          setBarChartData(barResult.data as BarChartDataPoint[]);
        }

        // Process pie chart data
        if (pieResult.success && pieResult.data && pieResult.data[0]) {
          setPieChartData(pieResult.data[0] as PieChartDataPoint);
        }

        // Process donut chart data
        if (donutResult.success && donutResult.data) {
          setDonutChartData(donutResult.data as DonutChartDataPoint[]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [isDataLoaded, executeQuery, selectedYear]);

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading financial data...</div>
      </div>
    );
  }

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">
        Financial Dashboard Victory Charts
      </h1>

      <FilterBar
        years={years}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartContainer title="Revenue Trends">
          <LineChartComponent data={lineChartData} />
        </ChartContainer>

        <ChartContainer title="Revenue vs Expenses">
          <BarChartComponent data={barChartData} />
        </ChartContainer>

        <ChartContainer title="Financial Distribution">
          <PieChartComponent data={pieChartData} />
        </ChartContainer>

        <ChartContainer title="Revenue by Category">
          <DonutChartComponent data={donutChartData} />
        </ChartContainer>
      </div>
    </section>
  );
};

export default VictoryChartsPage;

// Chart container component
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="w-full h-[500px]">{children}</div>
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

const LineChartComponent = ({ data }: { data: LineChartDataPoint[] }) => {
  if (!data || data.length === 0) return <div>No data available</div>;
  
  return (
    <VictoryChart 
      theme={VictoryTheme.material} 
      domainPadding={20}
      height={300}>
      <VictoryAxis 
        tickFormat={(x) => x}
        style={{
          tickLabels: { fontSize: 8, padding: 5, angle: -45 }
        }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={(y) => `$${Math.round(y / 1000)}k`}
      />
      <VictoryLegend
        x={50}
        y={10}
        orientation="horizontal"
        gutter={20}
        style={{ labels: { fontSize: 8 } }}
        data={[
          { name: "Revenue", symbol: { fill: "#4bc0c0" } },
          { name: "Gross Margin", symbol: { fill: "#36a2eb" } },
          { name: "Net Profit", symbol: { fill: "#ff6384" } },
        ]}
      />
      <VictoryLine
        data={data}
        x="period"
        y="revenue"
        style={{ data: { stroke: "#4bc0c0", strokeWidth: 2 } }}
        labelComponent={<VictoryTooltip />}
      />
      <VictoryLine
        data={data}
        x="period"
        y="grossMargin"
        style={{ data: { stroke: "#36a2eb", strokeWidth: 2 } }}
        labelComponent={<VictoryTooltip />}
      />
      <VictoryLine
        data={data}
        x="period"
        y="netProfit"
        style={{ data: { stroke: "#ff6384", strokeWidth: 2 } }}
        labelComponent={<VictoryTooltip />}
      />
    </VictoryChart>
  );
};

const BarChartComponent = ({ data }: { data: BarChartDataPoint[] }) => {
  if (!data || data.length === 0) return <div>No data available</div>;
  
  return (
    <VictoryChart 
      theme={VictoryTheme.material} 
      domainPadding={20}
      height={300}
    >
      <VictoryAxis
        tickFormat={(x) => x}
        style={{
          tickLabels: { fontSize: 8, padding: 5, angle: -45 }
        }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={(y) => `$${Math.round(y / 1000)}k`}
      />
      <VictoryLegend
        x={50}
        y={10}
        orientation="horizontal"
        gutter={20}
        style={{ labels: { fontSize: 8 } }}
        data={[
          { name: "Revenue", symbol: { fill: "#4bc0c0" } },
          { name: "Expenses", symbol: { fill: "#ff6384" } }
        ]}
      />
      <VictoryGroup offset={20} colorScale={["#4bc0c0", "#ff6384"]}>
        <VictoryBar
          data={data}
          x="period"
          y="revenue"
          labels={({ datum }) => `$${Math.round(datum.revenue)}`}
          labelComponent={<VictoryTooltip dy={-10} style={{ fontSize: 8 }} />}
        />
        <VictoryBar
          data={data}
          x="period"
          y="expenses"
          labels={({ datum }) => `$${Math.round(datum.expenses)}`}
          labelComponent={<VictoryTooltip dy={-10} style={{ fontSize: 8 }} />}
        />
      </VictoryGroup>
    </VictoryChart>
  );
};

const PieChartComponent = ({ data }: { data: PieChartDataPoint | null }) => {
  if (!data) return <div>No data available</div>;
  
  const pieData = [
    { x: "Gross Margin", y: data.grossMargin },
    { x: "Operating Expenses", y: data.opEx },
    { x: "Net Profit", y: data.netProfit },
    { x: "Other", y: data.revenue - data.grossMargin - data.opEx - data.netProfit }
  ];

  return (
    <VictoryPie
      data={pieData}
      colorScale={["#4bc0c0", "#ff6384", "#36a2eb", "#ffce56"]}
      labelRadius={80}
      style={{ 
        labels: { fontSize: 8, fill: "#333" }
      }}
      labels={({ datum }) => `${datum.x}: $${Math.round(datum.y)}`}
      height={300}
    />
  );
};

const DonutChartComponent = ({ data }: { data: DonutChartDataPoint[] }) => {
  if (!data || data.length === 0) return <div>No data available</div>;
  
  // Limit to top 6 categories for better visibility
  const topCategories = data.slice(0, 6);
  
  return (
    <VictoryPie
      data={topCategories}
      x="catAccountingView"
      y="revenue"
      colorScale={[
        "#ffce56", "#4bc0c0", "#9966ff", 
        "#ff9f40", "#36a2eb", "#ff6384"
      ]}
      innerRadius={70}
      labelRadius={90}
      style={{ 
        labels: { fontSize: 8, fill: "#333" }
      }}
      labels={({ datum }) => `${datum.catAccountingView}: $${Math.round(datum.revenue)}`}
      height={300}
    />
  );
};