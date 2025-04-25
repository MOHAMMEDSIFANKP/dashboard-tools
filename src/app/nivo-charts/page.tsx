"use client";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import React, { useEffect, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";

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

interface LineChartPoint {
  x: string;
  y: number;
}

interface BarChartDataPoint {
  period: string;
  revenue: number;
  expenses: number;
}

interface PieChartData {
  id: string;
  label: string;
  value: number;
}

interface DonutChartData {
  catAccountingView: string;
  revenue: number;
}

interface LineChartSeries {
  id: string;
  data: LineChartPoint[];
}

// Main component
export default function FinancialDashboard() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [years, setYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [lineChartData, setLineChartData] = useState<LineChartSeries[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [donutChartData, setDonutChartData] = useState<PieChartData[]>([]);

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

        // Process line chart data
        if (lineRes.success) {
          const lineData: LineChartSeries[] = [
            {
              id: "Revenue",
              data: lineRes?.data?.map((d: any) => ({
                x: d.period,
                y: Number(d.revenue),
              })) || [], // fallback to empty array if data is undefined
            },
            {
              id: "Gross Margin",
              data: lineRes?.data?.map((d: any) => ({
                x: d.period,
                y: Number(d.grossMargin),
              })) || [],
            },
            {
              id: "Net Profit",
              data: lineRes?.data?.map((d: any) => ({
                x: d.period,
                y: Number(d.netProfit),
              })) || [],
            },
          ];
          setLineChartData(lineData);
        }

        // Process bar chart data
        if (barRes.success) {
          setBarChartData(barRes.data as BarChartDataPoint[]);
        }

        // Process pie chart data
        const data = pieRes.data?.[0];
        if (pieRes.success && data) {
          const pieData: PieChartData[] = [
            { id: "Revenue", label: "Revenue", value: Math.round(Number(data.revenue)) },
            { id: "Gross Margin", label: "Gross Margin", value: Math.round(Number(data.grossMargin)) },
            { id: "Net Profit", label: "Net Profit", value: Math.round(Number(data.netProfit)) },
            { id: "Operating Expenses", label: "Operating Expenses", value: Math.round(Number(data.opEx)) }
          ];
          setPieChartData(pieData);
        }


        // Process donut chart data
        if (donutRes.success && Array.isArray(donutRes.data)) {
          const donutData: PieChartData[] = donutRes.data.map((d: DonutChartData) => ({
            id: d.catAccountingView,
            label: d.catAccountingView,
            value: Math.round(Number(d.revenue))
          }));
          setDonutChartData(donutData);
        }
        

        setError(null);
      } catch (err) {
        setError("Failed to load chart data.");
        console.error(err);
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
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard with Nivo Charts</h1>
      <FilterBar years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer title="Monthly Performance (Line)">
          <div style={{ height: "400px" }}>
            <ResponsiveLine
              data={lineChartData}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              xScale={{ type: "point" }}
              yScale={{
                type: "linear",
                min: "auto",
                max: "auto",
                stacked: false,
                reverse: false,
              }}
              axisBottom={{
                legend: "Period",
                legendOffset: 36,
                legendPosition: "middle",
              }}
              axisLeft={{
                legend: "Amount",
                legendOffset: -40,
                legendPosition: "middle",
              }}
              colors={{ scheme: "nivo" }}
              pointSize={10}
              pointColor={{ theme: "background" }}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              useMesh={true}
              legends={[
                {
                  anchor: "bottom-right",
                  direction: "column",
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: "left-to-right",
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: "circle",
                }
              ]}
            />
          </div>
        </ChartContainer>

        <ChartContainer title="Revenue vs Expenses (Bar)">
          <div style={{ height: "400px" }}>
            <ResponsiveBar
              data={barChartData.map((item) => ({
                period: item.period,
                revenue: Math.round(Number(item.revenue)),
                expenses: Math.round(Number(item.expenses)),
              }))}
              keys={["revenue", "expenses"]}
              indexBy="period"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              groupMode="grouped"
              colors={{ scheme: "paired" }}
              axisBottom={{
                legend: "Period",
                legendOffset: 36,
                legendPosition: "middle",
              }}
              axisLeft={{
                legend: "Amount",
                legendOffset: -40,
                legendPosition: "middle",
              }}
              legends={[
                {
                  dataFrom: "keys",
                  anchor: "bottom-right",
                  direction: "column",
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: "left-to-right",
                  itemOpacity: 0.85,
                  symbolSize: 20,
                }
              ]}
            />
          </div>
        </ChartContainer>

        <ChartContainer title="Financial Breakdown (Pie)">
          <div style={{ height: "400px" }}>
            <ResponsivePie
              data={pieChartData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0}
              padAngle={0.7}
              cornerRadius={3}
              colors={{ scheme: "category10" }}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: "color" }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
              legends={[
                {
                  anchor: "bottom",
                  direction: "row",
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: "#999",
                  itemDirection: "left-to-right",
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: "circle"
                }
              ]}
            />
          </div>
        </ChartContainer>

        <ChartContainer title="Category-wise Revenue (Donut)">
          <div style={{ height: "400px" }}>
            <ResponsivePie
              data={donutChartData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}  // This creates the donut effect
              padAngle={0.7}
              cornerRadius={3}
              colors={{ scheme: "nivo" }}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: "color" }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
              legends={[
                {
                  anchor: "bottom",
                  direction: "row",
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: "#999",
                  itemDirection: "left-to-right",
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: "circle"
                }
              ]}
            />
          </div>
        </ChartContainer>
      </div>
    </section>
  );
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div>{children}</div>
    </div>
  );
};

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