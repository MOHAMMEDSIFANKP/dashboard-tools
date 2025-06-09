"use client";
import React, { useState, useEffect, useRef } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { GroupModal } from "../../components/GroupManagement";
import {
  useFetchChartDataMutation,
  useFetchDrillDownDataMutation,
  databaseName
} from "@/lib/services/usersApi";
// Types
import { Dimensions } from "@/types/Schemas";
import { buildRequestBody, handleCrossChartFilteringFunc } from "@/lib/services/buildWhereClause";

// Core data types
interface ChartDataPoint {
  period?: string;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
  catAccountingView?: string;
  catFinancialView?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
}

interface LineChartPoint {
  x: string;
  y: number;
}

interface LineChartSeries {
  id: string;
  data: LineChartPoint[];
}

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  data?: any[];
  isDrilled?: boolean;
  onBack?: () => void;
  onExport?: () => void;
}

// Chart Container Component
const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  data,
  isDrilled,
  onBack,
  onExport
}) => {
  // Export to CSV function
  const exportToCSV = () => {
    if (!data || !data.length) {
      alert('No data available to export');
      return;
    }

    try {
      // Get all unique keys from all objects
      const allKeys = Array.from(
        new Set(data.flatMap(item => Object.keys(item)))
      );

      // Create headers
      const headers = allKeys.join(',');

      // Create CSV rows
      const csvRows = data.map(row => {
        return allKeys.map(key => {
          const value = row[key];
          // Handle special characters and quotes in CSV
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      });

      const csv = `${headers}\n${csvRows.join('\n')}`;

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting data to CSV');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          {isDrilled && onBack && (
            <button
              onClick={onBack}
              className="ml-3 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              ↩ Back
            </button>
          )}
        </div>
        <button
          onClick={onExport || exportToCSV}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Export CSV
        </button>
      </div>
      <div>{children}</div>
    </div>
  );
};

// Main Nivo Charts Page Component
export default function NivoChartsPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  // API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation()
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();

  // Chart data states
  const [lineChartData, setLineChartData] = useState<LineChartSeries[]>([]);
  const [barChartData, setBarChartData] = useState<ChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<ChartDataPoint[]>([]);
  const [donutChartData, setDonutChartData] = useState<ChartDataPoint[]>([]);

  // Raw data for export
  const [rawData, setRawData] = useState<{
    line: ChartDataPoint[],
    bar: ChartDataPoint[],
    pie: ChartDataPoint[],
    donut: ChartDataPoint[],
    drillDown: any[]
  }>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: []
  });

  // Drill down states
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });

  const [drillDownData, setDrillDownData] = useState<ChartDataPoint[]>([]);

  // Reset drill down
  const resetDrillDown = () => {
    setDrillDown({
      active: false,
      chartType: "",
      category: "",
      title: ""
    });
    setDrillDownData([]);
  };

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  };

  // Fetch all chart data using API
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all chart data in parallel
      const result = await fetchAllChartData({
        body: buildRequestBody(dimensions, 'all')
      }).unwrap();
      if (!result || !result.success) {
        throw new Error(result?.message || "Failed to fetch chart data");
      }

      // Process line chart data
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      if (lineData.length > 0) {
        const lineChartSeries: LineChartSeries[] = [
          {
            id: "Revenue",
            data: lineData.map((d: any) => ({
              x: d.period || d.x || '',
              y: Number(d.revenue) || 0,
            })),
          },
          {
            id: "grossMargin",
            data: lineData.map((d: any) => ({
              x: d.period || d.x || '',
              y: Number(d.grossMargin) || 0,
            })),
          },
          {
            id: "netProfit",
            data: lineData.map((d: any) => ({
              x: d.period || d.x || '',
              y: Number(d.netProfit) || 0,
            })),
          },
        ];
        setLineChartData(lineChartSeries);
      }

      // Process bar chart data
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      setBarChartData(barData);

      // Process pie chart data
      const pieData = result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [];
      if (pieData.length > 0) {
        // If the API returns aggregated data, use it directly
        // Otherwise, create the pie chart structure
        const formattedPieData = pieData.map((item: any, index: number) => ({
          id: item.catfinancialview || item.label || `Category ${index + 1}`,
          label: item.catfinancialview || item.label || `Category ${index + 1}`,
          value: Math.round(Number(item.revenue || item.value || 0))
        }));
        setPieChartData(formattedPieData);
      }

      // Process donut chart data
      const donutData = result?.charts?.donut?.success ? result?.charts?.donut?.data || [] : [];
      if (donutData.length > 0) {
        const formattedDonutData = donutData.map((item: any) => ({
          id: item.cataccountingview || item.catAccountingView || item.label || 'Unknown',
          label: item.cataccountingview || item.catAccountingView || item.label || 'Unknown',
          value: Math.round(Number(item.revenue || item.value || 0))
        }));
        setDonutChartData(formattedDonutData);
      }

      // Store raw data for export
      setRawData({
        line: lineData,
        bar: barData,
        pie: pieData,
        donut: donutData,
        drillDown: []
      });

      setError(null);
    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch chart data");
      console.error("Error fetching chart data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drill down using API
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchDrillDownData({
        table_name: databaseName,
        chart_type: chartType,
        category: category,
        data_type: dataType,
        value: value
      }).unwrap();

      if (result.success && result.data && result.data.length > 0) {
        const drillData = result.data;
        const title = result.title || `${dataType} Breakdown for ${category}`;

        setDrillDownData(drillData);
        setRawData(prev => ({
          ...prev,
          drillDown: drillData
        }));

        setDrillDown({
          active: true,
          chartType,
          category,
          title
        });
      } else {
        setError("No data available for this selection");
      }
    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch drill-down data");
      console.error("Error in drill-down:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render drill down visualization based on data structure
  const renderDrillDown = () => {
    if (!drillDownData.length) return null;

    const firstDataPoint = drillDownData[0];
    const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];

    if (dataKeys.includes('catfinancialview') || dataKeys.includes('catFinancialView')) {
      return (
        <div style={{ height: "400px" }}>
          <ResponsiveBar
            data={drillDownData.map((item) => ({
              category: item.catfinancialview || item.catFinancialView || 'Unknown',
              value: Math.round(Number(item.value || item.revenue || 0))
            }))}
            keys={['value']}
            indexBy="category"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            colors={{ scheme: "paired" }}
            axisBottom={{
              legend: "Category",
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              legend: "Value",
              legendOffset: -40,
              legendPosition: "middle",
            }}
          />
        </div>
      );
    } else if (dataKeys.includes('period')) {
      return (
        <div style={{ height: "400px" }}>
          <ResponsiveLine
            data={[{
              id: "Value",
              data: drillDownData.map((d) => ({
                x: d.period,
                y: Number(d.value || d.revenue || 0),
              }))
            }]}
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
              legend: "Value",
              legendOffset: -40,
              legendPosition: "middle",
            }}
            pointSize={10}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            useMesh={true}
          />
        </div>
      );
    } else {
      // Default to pie chart for other data structures
      const labelKey = dataKeys.find(key => key !== 'value' && key !== 'revenue') || dataKeys[0];
      return (
        <div style={{ height: "400px" }}>
          <ResponsivePie
            data={drillDownData.map((item) => ({
              id: item[labelKey] || 'Unknown',
              label: item[labelKey] || 'Unknown',
              value: Math.round(Number(item.value || item.revenue || 0))
            }))}
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
          />
        </div>
      );
    }
  };

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartDataHanlde();
  }, [dimensions]);

  if (isLoading && !lineChartData.length && !barChartData.length && !pieChartData.length && !donutChartData.length) {
    return <div className="p-8 text-center">Loading financial data...</div>;
  }

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard with Nivo Charts</h1>

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      <div className="flex flex-col mb-4">
        {dimensions?.groupName && (
          <p className="text-sm text-gray-500">
            Current Group Name: <span className="capitalize font-bold">{dimensions.groupName}</span>
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setDimensions(null)}
            className="shadow-xl border bg-red-400 p-2 rounded text-white hover:bg-red-500"
          >
            Reset Group
          </button>
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="shadow-xl border bg-blue-400 p-2 rounded text-white hover:bg-blue-500"
          >
            Create Group
          </button>
          <button
            onClick={fetchAllChartDataHanlde}
            className="shadow-xl border bg-green-400 p-2 rounded text-white hover:bg-green-500"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="flex justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <p onClick={() => setError('')} className="cursor-pointer">x</p>
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p>Loading chart data...</p>
        </div>
      )}

      {drillDown.active ? (
        <ChartContainer
          title={drillDown.title}
          isDrilled={true}
          onBack={resetDrillDown}
          data={rawData.drillDown}
        >
          {renderDrillDown()}
        </ChartContainer>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lineChartData.length > 0 && (
            <ChartContainer
              title="Revenue Trends Over Time with Cross Chart Filter"
              data={rawData.line}
            >
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
                  onClick={(point, event) => {
                    if (point.data) {
                      if (event.ctrlKey || event.metaKey) {
                        handleDrillDown('line', point.data.x as string, point.data.y, point.serieId as string);
                      } else {
                        // @ts-ignore
                        setDimensions(handleCrossChartFilteringFunc(point.data.x));
                      }
                    }
                  }}
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
                      toggleSerie: true,
                      // onClick: (datum) => alert(datum.label),

                    }
                  ]}
                />
              </div>
            </ChartContainer>
          )}

          {barChartData.length > 0 && (
            <ChartContainer
              title="Revenue vs Expenses"
              data={rawData.bar}
            >
              <div style={{ height: "400px" }}>
                <ResponsiveBar
                  data={barChartData.map((item) => ({
                    period: item.period || 'Unknown',
                    revenue: Math.round(Number(item.revenue || 0)),
                    expenses: Math.round(Number(item.expenses || 0)),
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
                    // legendPosition: "middle",
                  }}
                  axisLeft={{
                    legend: "Amount",
                    legendOffset: -40,
                    // legendPosition: "middle",
                  }}
                  onClick={(data) => {
                    // @ts-ignore
                    handleDrillDown('bar', data.data.period, data.data[data.id], data.id);
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
                      toggleSerie: true,
                    }
                  ]}
                />
              </div>
            </ChartContainer>
          )}

          {pieChartData.length > 0 && (
            <ChartContainer
              title="Financial Distribution"
              data={rawData.pie}
            >
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
                  onClick={(data) => {
                    handleDrillDown('pie', data.id as string, data.value, 'revenue');
                  }}
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
                      symbolShape: "circle",
                      toggleSerie: true,
                    }
                  ]}
                />
              </div>
            </ChartContainer>
          )}

          {donutChartData.length > 0 && (
            <ChartContainer
              title="Revenue by Category"
              data={rawData.donut}
            >
              <div style={{ height: "400px" }}>
                <ResponsivePie
                  data={donutChartData}
                  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.5}  // This creates the donut effect
                  padAngle={0.7}
                  cornerRadius={3}
                  colors={{ scheme: "nivo" }}
                  activeOuterRadiusOffset={8}
                  borderWidth={1}
                  borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: "color" }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                  onClick={(data) => {
                    handleDrillDown('donut', data.label as string, data.value, 'revenue');
                  }}
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
                      symbolShape: "circle",
                      toggleSerie: true,
                    }
                  ]}
                />
              </div>
            </ChartContainer>
          )}
        </div>
      )}

      {!drillDown.active && (
        <p className="mt-4 text-center text-sm text-gray-500">
          <i>Click on any chart element to drill down into more detailed data</i>
        </p>
      )}
    </section>
  );
}