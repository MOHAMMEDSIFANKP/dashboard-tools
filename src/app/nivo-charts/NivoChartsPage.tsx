"use client";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import React, { useEffect, useState, useRef } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { GroupModal } from "../../components/GroupManagement";
import { buildWhereClause } from "@/lib/services/buildWhereClause";

// Types
import { Dimensions } from "@/types/Schemas";

// Core data types
interface ChartDataPoint {
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

export default function NivoChartsPage() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chart data states
  const [lineChartData, setLineChartData] = useState<LineChartSeries[]>([]);
  const [barChartData, setBarChartData] = useState<ChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<ChartDataPoint[]>([]);
  const [donutChartData, setDonutChartData] = useState<ChartDataPoint[]>([]);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  
  // Drill down states
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });
  
  const [drillDownData, setDrillDownData] = useState<ChartDataPoint[]>([]);

  // Export to CSV function - Generic utility
  const exportToCSV = (data: any[], filename: string = 'chart_data.csv') => {
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
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting data to CSV');
    }
  };

  // Chart-specific export functions
  const exportLineChartData = () => {
    const flatData = lineChartData.flatMap(series => 
      series.data.map(point => ({
        series: series.id,
        period: point.x,
        value: point.y
      }))
    );
    exportToCSV(flatData, 'monthly-performance-line-chart.csv');
  };

  const exportBarChartData = () => {
    exportToCSV(barChartData, 'revenue-vs-expenses-bar-chart.csv');
  };

  const exportPieChartData = () => {
    exportToCSV(pieChartData, 'financial-breakdown-pie-chart.csv');
  };

  const exportDonutChartData = () => {
    exportToCSV(donutChartData, 'category-revenue-donut-chart.csv');
  };

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
  }

  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);

      const whereClause = buildWhereClause(dimensions);

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
        if (lineRes.success && lineRes.data) {
          const lineData: LineChartSeries[] = [
            {
              id: "Revenue",
              data: lineRes.data.map((d: any) => ({
                x: d.period,
                y: Number(d.revenue),
              })) || [],
            },
            {
              id: "grossMargin",
              data: lineRes.data.map((d: any) => ({
                x: d.period,
                y: Number(d.grossMargin),
              })) || [],
            },
            {
              id: "netProfit",
              data: lineRes.data.map((d: any) => ({
                x: d.period,
                y: Number(d.netProfit),
              })) || [],
            },
          ];
          setLineChartData(lineData);
        }

        // Process bar chart data
        if (barRes.success && barRes.data) {
          setBarChartData(barRes.data);
        }

        // Process pie chart data
        const data = pieRes.data?.[0];
        if (pieRes.success && data) {
          const pieData = [
            { id: "Revenue", label: "Revenue", value: Math.round(Number(data.revenue)) },
            { id: "grossMargin", label: "Gross Margin", value: Math.round(Number(data.grossMargin)) },
            { id: "netProfit", label: "Net Profit", value: Math.round(Number(data.netProfit)) },
            { id: "operatingExpenses", label: "Operating Expenses", value: Math.round(Number(data.opEx)) }
          ];
          setPieChartData(pieData);
        }

        // Process donut chart data
        if (donutRes.success && Array.isArray(donutRes.data)) {
          const donutData = donutRes.data.map((d: any) => ({
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
  }, [dimensions, isDataLoaded, executeQuery]);

  // Handle drill down function
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: any) => {
    if (!isDataLoaded) return;
    setIsLoading(true);
    setError(null);

    try {
      let query = "";
      let title = "";

      switch (chartType) {
        case 'bar':
          if (dataType === 'revenue') {
            query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
                    FROM financial_data 
                    WHERE period = '${category}'
                    GROUP BY fiscalYear, catFinancialView
                    ORDER BY fiscalYear, value DESC`;
            title = `Revenue Breakdown for Period: ${category}`;
          } else if (dataType === 'expenses') {
            query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
                    FROM financial_data 
                    WHERE period = '${category}'
                    GROUP BY fiscalYear, catFinancialView
                    ORDER BY fiscalYear, value DESC`;
            title = `Expenses Breakdown for Period: ${category}`;
          }
          break;

        case 'line':
          query = `SELECT fiscalYear, catFinancialView, SUM(${dataType}) as value 
                  FROM financial_data 
                  WHERE period = '${category}'
                  GROUP BY fiscalYear, catFinancialView
                  ORDER BY value DESC`;
          title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
          break;

        case 'pie':
          if (dataType === 'id' || dataType === 'label') {
            query = `SELECT catFinancialView, SUM(${category}) as value 
                    FROM financial_data 
                    WHERE 1=1
                    GROUP BY catFinancialView
                    ORDER BY value DESC`;
            title = `${category} Breakdown by Financial Category`;
          }
          break;

        case 'donut':
          query = `SELECT fiscalYear, period, SUM(revenue) as value 
                  FROM financial_data 
                  WHERE catAccountingView = '${category}'
                  GROUP BY fiscalYear, period
                  ORDER BY fiscalYear, period`;
          title = `Revenue Breakdown for Category: ${category}`;
          break;
      }

      if (query) {
        const result = await executeQuery(query);
        if (result.success && result.data && result.data.length > 0) {
          setDrillDownData(result.data);
          setDrillDown({
            active: true,
            chartType,
            category,
            title
          });
        } else {
          setError("No data available for this selection");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error in drill-down:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render drill down visualization based on data structure
  const renderDrillDown = () => {
    const firstDataPoint = drillDownData[0];
    const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];

    if (dataKeys.includes('catFinancialView')) {
      return (
        <div style={{ height: "400px" }}>
          <ResponsiveBar
            data={drillDownData.map((item) => ({
              category: item.catFinancialView,
              value: Math.round(Number(item.value))
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
                y: Number(d.value),
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
      return (
        <div style={{ height: "400px" }}>
          <ResponsivePie
            data={drillDownData.map((item) => ({
              id: item[dataKeys[0]],
              label: item[dataKeys[0]],
              value: Math.round(Number(item.value || 0))
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

  if (isLoading) {
    return <div className="p-8 text-center">Loading financial data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
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
            {dimensions?.groupName && <p className="text-sm text-gray-500">Current Group Name: <span className="capitalize font-bold">{dimensions.groupName}</span></p>}
            <div>
              <button onClick={() => setDimensions(null)} className="shadow-xl border bg-red-400 p-2 rounded text-white">Reset Group</button>
              <button onClick={() => setIsGroupModalOpen(true)} className="shadow-xl border bg-blue-400 p-2 rounded text-white">Create Group</button>
            </div>
          </div>
        {error && <p className="text-red-500 mb-2">{error}</p>}
      {isLoading && <p className="text-gray-500 mb-2">Loading...</p>}
      
      {drillDown.active ? (
        <ChartContainer 
          title={drillDown.title} 
          isDrilled={true} 
          onBack={resetDrillDown}
          data={drillDownData}
          onExport={() => exportToCSV(drillDownData, `${drillDown.title.replace(/\s+/g, '_').toLowerCase()}.csv`)}
        >
          {renderDrillDown()}
        </ChartContainer>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartContainer 
            title="Monthly Performance (Line)" 
            onExport={exportLineChartData}
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
                onClick={(point) => {
                  if (point.data) {
                    handleDrillDown('line', point.data.x as string, point.data.y, point.serieId);
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
                  }
                ]}
              />
            </div>
          </ChartContainer>

          <ChartContainer 
            title="Revenue vs Expenses (Bar)"
            onExport={exportBarChartData}
          >
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
                  // @ts-ignore
                  tickFormat: (value) => value.toFixed(2), 
                  legendOffset: -40,
                  legendPosition: "middle",
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
                  }
                ]}
              />
            </div>
          </ChartContainer>

          <ChartContainer 
            title="Financial Breakdown (Pie)"
            onExport={exportPieChartData}
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
                  handleDrillDown('pie', data.id as string, data.value, 'id');
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
                    symbolShape: "circle"
                  }
                ]}
              />
            </div>
          </ChartContainer>

          <ChartContainer 
            title="Category-wise Revenue (Donut)"
            onExport={exportDonutChartData}
          >
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
                onClick={(data) => {
                  handleDrillDown('donut', data.label as string, data.value, 'label');
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
                    symbolShape: "circle"
                  }
                ]}
              />
            </div>
          </ChartContainer>
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

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, data, isDrilled, onBack, onExport }) => {
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
        {onExport && (
          <button
            onClick={onExport}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Export CSV
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};
