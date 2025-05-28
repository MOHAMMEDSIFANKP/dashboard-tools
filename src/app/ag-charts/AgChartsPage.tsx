"use client";
import React, { useState, useEffect, useRef } from "react";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";
import { GroupModal } from "../../components/GroupManagement";
import { 
  useFetchDrillDownDataMutation,
  databaseName,
  useFetchChartDataMutation
} from "@/lib/services/usersApi";
// Types
import { Dimensions } from "@/types/Schemas";
import { buildRequestBody } from "@/lib/services/buildWhereClause";

// Core data types
interface ChartDataPoint {
  period?: string;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
  catAccountingView?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

// Common props for components
interface CommonProps {
  title: string;
  data?: any[];
  onDrillDown?: (type: string, category: string, value: any, dataType: string) => void;
}

// Drill-down state interface
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
}

// Chart container component
const ChartContainer: React.FC<CommonProps & {
  children: React.ReactNode;
  isDrilled?: boolean;
  onBack?: () => void;
}> = ({ title, children, data, isDrilled, onBack }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  // Export to CSV function
  const exportToCSV = () => {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chart_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PNG export function
  const exportToPNG = () => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    const canvas = chartElement.querySelector('canvas');

    if (canvas) {
      try {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Failed to export chart:", err);
        alert("Could not export chart as PNG. Please try again.");
      }
    } else {
      alert("Chart is not ready for export. Please try again.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          {isDrilled && (
            <button
              onClick={onBack}
              className="ml-3 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              ↩ Back
            </button>
          )}
        </div>
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
      </div>
      <div ref={chartRef}>
        {children}
      </div>
    </div>
  );
};

// Separated Drill Down Component
const DrillDownChart: React.FC<{
  drillDownState: DrillDownState;
  drillDownData: any[];
  drillDownOptions: AgChartOptions | null;
  onBack: () => void;
}> = ({ drillDownState, drillDownData, drillDownOptions, onBack }) => {
  return (
    <div className="mb-4">
      <ChartContainer
        title={drillDownState.title}
        data={drillDownData}
        onBack={onBack}
        isDrilled={true}
      >
        {drillDownOptions && <AgCharts options={drillDownOptions} />}
      </ChartContainer>
      <p className="mt-2 text-sm text-gray-500">
        <i>Click any data point for further drill-down, or use the back button to return</i>
      </p>
    </div>
  );
};

// Main AG Charts Page Component
const AgChartsPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  
  // API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation();
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();
  
  // Drill down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });

  // Chart data states
  const [chartData, setChartData] = useState<{
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

  // Chart options states
  const [chartOptions, setChartOptions] = useState<{
    line: AgChartOptions | null,
    bar: AgChartOptions | null,
    pie: AgChartOptions | null,
    donut: AgChartOptions | null,
    drillDown: AgChartOptions | null
  }>({
    line: null,
    bar: null,
    pie: null,
    donut: null,
    drillDown: null
  });

  // Reset drill down
  const resetDrillDown = () => {
    setDrillDown({
      active: false,
      chartType: "",
      category: "",
      title: ""
    });
  };

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  };

  // Fetch all chart data
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all chart data
      const result = await fetchAllChartData({
        body: buildRequestBody(dimensions, 'all')
      }).unwrap();
      if (!result || !result.success) {
        throw new Error(result?.message || "Failed to fetch chart data");
      }
      // Process line chart data
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      const lineOpts = lineData.length ? {
        title: { text: "Revenue Trends Over Time" },
        subtitle: { text: "Showing financial metrics by period" },
        data: lineData,
        series: [
          {
            type: "line",
            xKey: "period",
            yKey: "revenue",
            yName: "Revenue",
            tooltip: { enabled: true },
          },
          {
            type: "line",
            xKey: "period",
            yKey: "grossMargin",
            yName: "Gross Margin",
            tooltip: { enabled: true },
          },
          {
            type: "line",
            xKey: "period",
            yKey: "netProfit",
            yName: "Net Profit",
            tooltip: { enabled: true },
          },
        ],
        axes: [
          { type: "category", position: "bottom", title: { text: "Period" } },
          { type: "number", position: "left", title: { text: "Amount ($)" } },
        ],
        listeners: {
          // @ts-ignore
          seriesNodeClick: ({ datum, yKey }) => {
            if (datum && datum.period) {
              handleDrillDown("line", datum.period, datum[yKey], yKey);
            }
          },
        }
      } : null;

      // Process bar chart data
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      const barOpts = barData.length ? {
        title: { text: "Revenue vs Expenses" },
        data: barData,
        series: [
          {
            type: "bar",
            xKey: "period",
            yKey: "revenue",
            yName: "Revenue",
            tooltip: { enabled: true }
          },
          {
            type: "bar",
            xKey: "period",
            yKey: "expenses",
            yName: "Expenses",
            tooltip: { enabled: true }
          },
        ],
        axes: [
          { type: 'category', position: 'bottom', title: { text: 'Period' } },
          { type: 'number', position: 'left', title: { text: 'Amount ($)' } }
        ],
        listeners: {
          // @ts-ignore
          seriesNodeClick: ({ datum, yKey }) => {
            if (datum && datum.period) {
              handleDrillDown('bar', datum.period, datum[yKey], yKey);
            }
          }
        }
      } : null;

      // Process pie chart data
      const pieData = result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [];
      const pieOpts = pieData.length ? {
        title: { text: "Financial Distribution" },
        data: pieData,
        series: [{
          type: "pie",
          angleKey: "revenue",
          labelKey: "catfinancialview",
          tooltip: { enabled: true },
          calloutLabel: { enabled: true },
          sectorLabelKey: 'catfinancialview',
          listeners: {
            // @ts-ignore
            nodeClick: (event) => {
              const { datum } = event;
              if (datum) {
                handleDrillDown('pie', datum.catfinancialview, datum.revenue, 'revenue');
              }
            }
          }
        }],
      } : null;

      // Process donut chart data
      const donutData = result?.charts?.donut?.success ? result?.charts?.donut?.data || [] : [];
      const donutOpts = donutData.length ? {
        title: { text: "Revenue by Category" },
        data: donutData,
        series: [{
          type: "donut",
          angleKey: "revenue",
          labelKey: "cataccountingview",
          tooltip: { enabled: true },
          calloutLabel: { enabled: true },
          sectorLabelKey: 'cataccountingview',
          listeners: {
            // @ts-ignore
            nodeClick: (event) => {
              const { datum } = event;
              if (datum) {
                handleDrillDown('donut', datum.cataccountingview, datum.revenue, 'revenue');
              }
            }
          }
        }],
      } : null;

      // Update all chart data and options
      setChartData({
        line: lineData,
        bar: barData,
        pie: pieData,
        donut: donutData,
        drillDown: []
      });

      setChartOptions({
        line: lineOpts as any,
        bar: barOpts as any,
        pie: pieOpts as any,
        donut: donutOpts as any,
        drillDown: null
      });

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
    // console.log("Drill down triggered:", chartType, category, value, dataType);
    // console.log("Drill down data:", chartData, chartOptions);

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

        // Create chart options based on API response
        let options: AgChartOptions;
        const columns = result.columns || Object.keys(drillData[0]);
        
        // Determine chart type based on data structure
        if (columns.includes('catfinancialview') || columns.includes('cataccountingview')) {
          options = {
            title: { text: title },
            data: drillData,
            series: [{
              type: 'bar',
              // @ts-ignore
              xKey: columns.find(col => col.includes('cat')) || columns[0],
              yKey: 'value',
              yName: 'Value',
              tooltip: { enabled: true }
            }],
            axes: [
              { type: 'category', position: 'bottom' },
              { type: 'number', position: 'left', title: { text: 'Value ($)' } }
            ],
          };
        } else if (columns.includes('period')) {
          options = {
            title: { text: title },
            data: drillData,
            series: [{
              type: 'line',
              xKey: 'period',
              yKey: 'value',
              yName: 'Value',
              tooltip: { enabled: true }
            }],
            axes: [
              { type: 'category', position: 'bottom', title: { text: 'Period' } },
              { type: 'number', position: 'left', title: { text: 'Value ($)' } }
            ],
          };
        } else {
          // @ts-ignore
          const labelKey = columns.find(key => key !== 'value') || columns[0];
          options = {
            title: { text: title },
            data: drillData,
            series: [{
              // @ts-ignore
              type: 'pie',
              angleKey: 'value',
              labelKey: labelKey,
              tooltip: { enabled: true },
              calloutLabel: { enabled: true }
            }],
          };
        }

        setChartData(prev => ({
          ...prev,
          drillDown: drillData
        }));

        setChartOptions(prev => ({
          ...prev,
          drillDown: options
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

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartDataHanlde();
  }, [dimensions]);

  // Initial data fetch
  // useEffect(() => {
  //   fetchAllChartData();
  // }, []);

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Ag Charts</h1>
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
          <p onClick={()=>setError('')} className="cursor-pointer">x</p>
        </div>
      )}
      
      {isLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p>Loading chart data...</p>
        </div>
      )}

      {drillDown.active ? (
        <DrillDownChart
          drillDownState={drillDown}
          drillDownData={chartData.drillDown}
          drillDownOptions={chartOptions.drillDown}
          onBack={resetDrillDown}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartOptions.line && (
            <ChartContainer title="Revenue Trends" data={chartData.line}>
              <AgCharts options={chartOptions.line} />
            </ChartContainer>
          )}
          {chartOptions.bar && (
            <ChartContainer title="Revenue vs Expenses" data={chartData.bar}>
              <AgCharts options={chartOptions.bar} />
            </ChartContainer>
          )}
          {chartOptions.pie && (
            <ChartContainer title="Financial Distribution" data={chartData.pie}>
              <AgCharts options={chartOptions.pie} />
            </ChartContainer>
          )}
          {chartOptions.donut && (
            <ChartContainer title="Revenue by Category" data={chartData.donut}>
              <AgCharts options={chartOptions.donut} />
            </ChartContainer>
          )}
          <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
            <i>Click on any chart element to drill down into more detailed data</i>
          </p>
        </div>
      )}
    </section>
  );
};

export default AgChartsPage;