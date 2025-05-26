"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Plot from "react-plotly.js";
import { GroupModal } from "@/components/GroupManagement";
import { 
  useFetchLineChartDataMutation,
  useFetchBarChartDataMutation,
  useFetchPieChartDataMutation,
  useFetchDonutChartDataMutation,
  useFetchDrillDownDataMutation,
  databaseName
} from "@/lib/services/usersApi";
// Types
import { Dimensions } from "@/types/Schemas";
import { buildRequestBody } from "@/lib/services/buildWhereClause";

// Constants
const DEFAULT_CONFIGURATION = {
  responsive: true,
  displayModeBar: false,
  modeBarButtonsToRemove: ['editInChartStudio', 'zoom2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d']
};

const CHART_COLORS = [
  'rgb(75, 192, 192)',
  'rgb(255, 99, 132)',
  'rgb(53, 162, 235)',
  'rgb(255, 206, 86)',
  'rgb(153, 102, 255)',
  'rgb(255, 159, 64)'
];

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

// Interfaces
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  onDownloadCSV?: () => void;
  onDownloadImage?: () => void;
  isDrilled?: boolean;
  onBack?: () => void;
}

interface DrillDownState {
  active: boolean;
  chartType: 'line' | 'bar' | 'pie' | 'donut';
  category: string;
  title: string;
  dataType?: string;
}

// Memoized Chart Container Component
const ChartContainer = React.memo(({
  title,
  children,
  onDownloadCSV,
  onDownloadImage,
  isDrilled,
  onBack
}: ChartContainerProps) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex flex-row justify-between items-center">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {isDrilled && (
          <button
            onClick={onBack}
            className="ml-3 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm mb-4"
          >
            ↩ Back
          </button>
        )}
      </div>
      {(onDownloadCSV || onDownloadImage) && (
        <div className="flex gap-2 mb-4">
          {onDownloadImage && (
            <button onClick={onDownloadImage} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              PNG
            </button>
          )}
          {onDownloadCSV && (
            <button onClick={onDownloadCSV} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              CSV
            </button>
          )}
        </div>
      )}
    </div>
    <div className="min-h-64">{children}</div>
  </div>
));

// Drill Down Chart Component
const DrillDownChart = React.memo(({
  drillDownState,
  drillDownData,
  rawDrillData,
  onBack
}: {
  drillDownState: DrillDownState;
  drillDownData: any;
  rawDrillData: ChartDataPoint[];
  onBack: () => void;
}) => {
  const plotRef = useRef<any>(null);

  const handleDownloadImage = useCallback(() => {
    if (plotRef.current?.el) {
      // @ts-ignore
      Plotly.downloadImage(plotRef.current.el, {
        format: 'png',
        filename: `${drillDownState.title.replace(/\s+/g, "_").toLowerCase()}`
      });
    }
  }, [drillDownState.title]);

  const handleDownloadCSV = useCallback(() => {
    if (!rawDrillData || !rawDrillData.length) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = Object.keys(rawDrillData[0]).join(',');
    const rows = rawDrillData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const encodedUri = encodeURI(csvContent + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${drillDownState.title.replace(/\s+/g, "_").toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [rawDrillData, drillDownState.title]);

  const renderDrillDownChart = useCallback(() => {
    const commonProps = {
      ref: plotRef,
      data: drillDownData,
      style: { width: "100%", height: "100%" },
      config: DEFAULT_CONFIGURATION
    };

    switch (drillDownState.chartType) {
      case 'line':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true, xaxis: { tickformat: 'digits' }, }} />;
      case 'bar':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, barmode: 'group', autosize: true }} />;
      case 'pie':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true }} />;
      default:
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true }} />;
    }
  }, [drillDownData, drillDownState.chartType, drillDownState.title]);

  return (
    <div className="mb-4">
      <ChartContainer
        title={drillDownState.title}
        onDownloadCSV={handleDownloadCSV}
        onDownloadImage={handleDownloadImage}
        isDrilled={true}
        onBack={onBack}
      >
        {renderDrillDownChart()}
      </ChartContainer>
      <p className="mt-2 text-sm text-gray-500">
        <i>Click any data point for further drill-down, or use the back button to return</i>
      </p>
    </div>
  );
});

export default function ReactPlotlyPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  // API Mutations
  const [fetchLineChartData] = useFetchLineChartDataMutation();
  const [fetchBarChartData] = useFetchBarChartDataMutation();
  const [fetchPieChartData] = useFetchPieChartDataMutation();
  const [fetchDonutChartData] = useFetchDonutChartDataMutation();
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();

  // Chart data states
  const [chartData, setChartData] = useState<{
    line: ChartDataPoint[],
    bar: ChartDataPoint[],
    pie: ChartDataPoint[],
    donut: ChartDataPoint[]
  }>({
    line: [],
    bar: [],
    pie: [],
    donut: []
  });

  // Drill-down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "bar",
    category: "",
    title: ""
  });
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [rawDrillData, setRawDrillData] = useState<ChartDataPoint[]>([]);

  // Refs for chart components
  const linePlotRef = useRef<any>(null);
  const barPlotRef = useRef<any>(null);
  const piePlotRef = useRef<any>(null);
  const donutPlotRef = useRef<any>(null);

  // Reset drill down state
  const resetDrillDown = useCallback(() => {
    setDrillDown({
      active: false,
      chartType: "bar",
      category: "",
      title: ""
    });
    setDrillDownData(null);
    setRawDrillData([]);
  }, []);

  const handleCreateGroup = useCallback((datas: any) => {
    setDimensions(datas);
  }, []);

  // Fetch all chart data
  const fetchAllChartData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch line chart data
      const lineResult = await fetchLineChartData({
        body: buildRequestBody(dimensions, 'line', 'period')
      }).unwrap();

      // Fetch bar chart data
      const barResult = await fetchBarChartData({
        body: buildRequestBody(dimensions, 'bar', 'period')
      }).unwrap();

      // Fetch pie chart data
      const pieResult = await fetchPieChartData({
        body: buildRequestBody(dimensions, 'pie', 'catfinancialview')
      }).unwrap();

      // Fetch donut chart data
      const donutResult = await fetchDonutChartData({
        body: buildRequestBody(dimensions, 'donut', 'cataccountingview')
      }).unwrap();

      // Process and store chart data
      const lineData = lineResult.success ? lineResult.data || [] : [];
      const barData = barResult.success ? barResult.data || [] : [];
      const pieData = pieResult.success ? pieResult.data || [] : [];
      const donutData = donutResult.success ? donutResult.data || [] : [];

      setChartData({
        line: lineData,
        bar: barData,
        pie: pieData,
        donut: donutData
      });

    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch chart data");
      console.error("Error fetching chart data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [buildRequestBody, fetchLineChartData, fetchBarChartData, fetchPieChartData, fetchDonutChartData]);

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartData();
  }, [fetchAllChartData]);

  // Event handlers for chart clicks
  const handleChartClick = useCallback(async (chartType: string, point: any) => {
    if (!point) return;

    let category = point.x || point.label;
    let dataType = point.data?.name?.toLowerCase() || 'revenue' ;
    let value =  point.value;
    await handleDrillDown(chartType, category, dataType, value);
  }, []);

  const handleLineChartClick = useCallback((data: any) => {
    if (data?.points?.[0]) {
      handleChartClick('line', data.points[0]);
    }
  }, [handleChartClick]);

  const handleBarChartClick = useCallback((data: any) => {
    if (data?.points?.[0]) {
      handleChartClick('bar', data.points[0]);
    }
  }, [handleChartClick]);

  const handlePieChartClick = useCallback((data: any) => {
    if (data?.points?.[0]) {
      handleChartClick('pie', data.points[0]);
    }
  }, [handleChartClick]);

  const handleDonutChartClick = useCallback((data: any) => {
    if (data?.points?.[0]) {
      handleChartClick('donut', data.points[0]);
    }
  }, [handleChartClick]);

  // Attach event handlers after data loads
  useEffect(() => {
    if (isLoading || drillDown.active) return;

    const attachHandlers = () => {
      if (linePlotRef.current?.el) linePlotRef.current.el.on('plotly_click', handleLineChartClick);
      if (barPlotRef.current?.el) barPlotRef.current.el.on('plotly_click', handleBarChartClick);
      if (piePlotRef.current?.el) piePlotRef.current.el.on('plotly_click', handlePieChartClick);
      if (donutPlotRef.current?.el) donutPlotRef.current.el.on('plotly_click', handleDonutChartClick);
    };

    const timeoutId = setTimeout(attachHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [isLoading, drillDown.active, handleLineChartClick, handleBarChartClick, handlePieChartClick, handleDonutChartClick]);

  // Generic drill down function using API
  const handleDrillDown = useCallback(async (chartType: string, category: string, dataType: string, value?: any) => {
    setIsLoading(true);
    setError(null);
    console.log("Drill down triggered:", chartType, category, dataType, value);

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
        const columns = result.columns || Object.keys(drillData[0]);

        // Convert API response to Plotly format
        const formattedData = formatDrillDownData(drillData, columns);
        let drillChartType: 'line' | 'bar' | 'pie' = 'bar';

        // Determine chart type based on data structure
        if (columns.includes('period')) {
          drillChartType = 'line';
        } else if (columns.includes('catfinancialview') || columns.includes('cataccountingview')) {
          drillChartType = 'bar';
        } else {
          drillChartType = 'pie';
        }

        setDrillDownData(formattedData);
        setRawDrillData(drillData);
        setDrillDown({
          active: true,
          chartType: drillChartType,
          category,
          title,
          dataType
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
  }, [fetchDrillDownData]);

  // Format drill down data for Plotly
  const formatDrillDownData = useCallback((data: ChartDataPoint[], columns: string[]) => {
    // Time series data - use line chart
    if (columns.includes('period')) {
      if (data[0]?.fiscalYear) {
        const fiscalYears = Array.from(new Set(data.map(d => d.fiscalYear))).sort();
        const periods = Array.from(new Set(data.map(d => d.period))).sort();

        return fiscalYears.map((year, idx) => ({
          x: periods,
          y: periods.map(period => {
            const match = data.find(d => d.fiscalYear === year && d.period === period);
            return match ? match.value : 0;
          }),
          type: 'scatter',
          mode: 'lines+markers',
          name: `Year ${year}`,
          line: { color: CHART_COLORS[idx % CHART_COLORS.length] }
        }));
      }
      return [{
        x: data.map(d => d.period),
        y: data.map(d => d.value),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Value',
        line: { color: CHART_COLORS[0] }
      }];
    }
    // Category data - use bar chart
    else if (columns.includes('catfinancialview') || columns.includes('cataccountingview')) {
      if (data[0]?.fiscalYear) {
        const labelKey = columns.find(col => col.includes('cat')) || columns[0];
        const categories = Array.from(new Set(data.map(d => d[labelKey])));
        const fiscalYears = Array.from(new Set(data.map(d => d.fiscalYear)));

        return fiscalYears.map((year, idx) => ({
          x: categories,
          y: categories.map(cat => {
            const match = data.find(d => d.fiscalYear === year && d[labelKey] === cat);
            return match ? match.value : 0;
          }),
          type: 'bar',
          name: `Year ${year}`,
          marker: { color: CHART_COLORS[idx % CHART_COLORS.length] }
        }));
      }
      const labelKey = columns.find(col => col.includes('cat')) || columns[0];
      return [{
        x: data.map(d => d[labelKey]),
        y: data.map(d => d.value),
        type: 'bar',
        name: 'Value',
        marker: { color: CHART_COLORS[0] }
      }];
    }
    // Default to pie chart
    else {
      const labelKey = columns.find(key => key !== 'value') || columns[0];
      return [{
        values: data.map(d => d.value),
        labels: data.map(d => d[labelKey]),
        type: 'pie',
        marker: { colors: CHART_COLORS }
      }];
    }
  }, []);

  // Handle downloads
  const handleDownloadImage = useCallback((plotRef: React.RefObject<any>, title: string) => {
    if (plotRef.current?.el) {
      // @ts-ignore
      Plotly.downloadImage(plotRef.current.el, {
        format: 'png',
        filename: title.replace(/\s+/g, "_").toLowerCase()
      });
    }
  }, []);

  const handleDownloadCSV = useCallback((chartData: ChartDataPoint[], title: string) => {
    if (!chartData || !chartData.length) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = Object.keys(chartData[0]).join(',');
    const rows = chartData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const encodedUri = encodeURI(csvContent + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, "_").toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Calculate pie chart data from aggregated data
  const getPieChartData = useCallback(() => {
    if (!chartData.pie.length) return { values: [], labels: [] };
    
    // If API returns aggregated data, use it directly
    if (chartData.pie.length === 1 && chartData.pie[0].revenue) {
      const data = chartData.pie[0];
      return {
        values: [
          data.revenue || 0,
          data.grossMargin || 0,
          data.netProfit || 0,
          data.expenses || data.operatingExpenses || 0,
        ],
        labels: ["Revenue", "Gross Margin", "Net Profit", "Operating Expenses"]
      };
    }
    
    // Otherwise, use the data as category breakdown
    return {
      values: chartData.pie.map(d => d.revenue || d.value || 0),
      labels: chartData.pie.map(d => d.catFinancialView || d.label || '')
    };
  }, [chartData.pie]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading financial data...</div>;
  }
console.log(chartData.donut);

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - React Plotly</h1>

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
            onClick={fetchAllChartData} 
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

      {drillDown.active && drillDownData ? (
        <DrillDownChart
          drillDownState={drillDown}
          drillDownData={drillDownData}
          rawDrillData={rawDrillData}
          onBack={resetDrillDown}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartData.line.length > 0 && (
            <ChartContainer
              title="Revenue Trends"
              onDownloadCSV={() => handleDownloadCSV(chartData.line, "Revenue_Trends")}
              onDownloadImage={() => handleDownloadImage(linePlotRef, "Revenue_Trends")}
            >
              <Plot
                key={`line-chart-${dimensions?.groupName || 'default'}`}
                ref={linePlotRef}
                data={[
                  {
                    x: chartData.line.map(d => d.period),
                    y: chartData.line.map(d => d.revenue),
                    type: "scatter",
                    mode: "lines+markers",
                    name: "Revenue",
                    line: { color: "blue" },
                  },
                  {
                    x: chartData.line.map(d => d.period),
                    y: chartData.line.map(d => d.grossMargin),
                    type: "scatter",
                    mode: "lines+markers",
                    name: "grossMargin",
                    line: { color: "purple" },
                  },
                  {
                    x: chartData.line.map(d => d.period),
                    y: chartData.line.map(d => d.netProfit),
                    type: "scatter",
                    mode: "lines+markers",
                    name: "netProfit",
                    line: { color: "green" },
                  },
                ]}
                layout={{
                  title: "Revenue Trends Over Time",
                  autosize: true,
                  xaxis: { tickformat: 'digits' },
                  yaxis: { title: "Amount ($)" }
                }}
                style={{ width: "100%", height: "100%" }}
                config={DEFAULT_CONFIGURATION}
              />
            </ChartContainer>
          )}

          {chartData.bar.length > 0 && (
            <ChartContainer
              title="Revenue vs Expenses"
              onDownloadCSV={() => handleDownloadCSV(chartData.bar, "Revenue_vs_Expenses")}
              onDownloadImage={() => handleDownloadImage(barPlotRef, "Revenue_vs_Expenses")}
            >
              <Plot
                key={`bar-chart-${dimensions?.groupName || 'default'}`}
                ref={barPlotRef}
                data={[
                  {
                    x: chartData.bar.map(d => d.period),
                    y: chartData.bar.map(d => d.revenue),
                    type: "bar",
                    name: "Revenue",
                    marker: { color: "teal" },
                  },
                  {
                    x: chartData.bar.map(d => d.period),
                    y: chartData.bar.map(d => d.expenses),
                    type: "bar",
                    name: "Expenses",
                    marker: { color: "orange" },
                  },
                ]}
                layout={{
                  title: "Revenue vs Operating Expenses",
                  barmode: "group",
                  autosize: true,
                  xaxis: { tickformat: 'digits' },
                  yaxis: { title: "Amount ($)" }
                }}
                config={DEFAULT_CONFIGURATION}
              />
            </ChartContainer>
          )}

          {chartData.pie.length > 0 && (
            <ChartContainer
              title="Financial Distribution"
              onDownloadCSV={() => handleDownloadCSV(chartData.pie, "Financial_Distribution")}
              onDownloadImage={() => handleDownloadImage(piePlotRef, "Financial_Distribution")}
            >
              <Plot
                key={`pie-chart-${dimensions?.groupName || 'default'}`}
                ref={piePlotRef}
                data={[{
                  values: getPieChartData().values,
                  type: "pie",
                  marker: { colors: CHART_COLORS },
                  labels: chartData.pie.map((item: any) => item.catfinancialview || '')
                }]}                
                layout={{ 
                  title: "Financial Distribution",
                  autosize: true
                }}
                config={DEFAULT_CONFIGURATION}
              />
            </ChartContainer>
          )}

          {chartData.donut.length > 0 && (
            <ChartContainer
              title="Revenue by Category"
              onDownloadCSV={() => handleDownloadCSV(chartData.donut, "Revenue_by_Category")}
              onDownloadImage={() => handleDownloadImage(donutPlotRef, "Revenue_by_Category")}
            >
              <Plot
                key={`donut-chart-${dimensions?.groupName || 'default'}`}
                ref={donutPlotRef}
                data={[{
                  values: chartData.donut.map(d => d.revenue || ''),
                  labels: chartData.donut.map((d: any) => d.cataccountingview || ''),

                  type: "pie",
                  hole: 0.5,
                  marker: { colors: CHART_COLORS }
                }]}
                layout={{ 
                  title: "Revenue by Category",
                  autosize: true
                }}
                config={DEFAULT_CONFIGURATION}
              />
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