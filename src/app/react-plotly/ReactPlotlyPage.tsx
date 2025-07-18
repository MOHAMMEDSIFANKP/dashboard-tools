"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Plot from "react-plotly.js";
import { GroupModal } from "@/components/GroupManagement";
import {
  useFetchChartDataMutation,
  useFetchDrillDownDataMutation,
  databaseName
} from "@/lib/services/usersApi";
// Types
import { Dimensions } from "@/types/Schemas";
import { buildRequestBody, handleCrossChartFilteringFunc } from "@/lib/services/buildWhereClause";
import { ActionButton } from "@/components/ui/action-button";
import ReusableChartDrawer, { useChartDrawer } from "@/components/ChartDrawer";
import { ErrorAlert, LoadingAlert } from "@/components/ui/status-alerts";
import DashboardInfoCard from "@/components/DashboardInfoCard";
import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from "@/lib/services/testCase2Api";
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from "@/lib/testCase2Transformer";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { ChartContextMenu } from "@/components/charts/ChartContextMenu";

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
  catfinancialview?: string;
  cataccountingview?: string;
  label?: string;
  value?: number;
  fiscalYear?: string | number;
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
    <div className="h-96">{children}</div>
  </div>
));

export default function ReactPlotlyPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

  // Test Case 1 API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation();
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();

  // Test Case 2 API Mutations
  const [FetchTestCase2AllChartData] = useFetchTestCase2ChartDataMutation();
  const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();


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

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    category: string;
    value: any;
    chartType: string;
    dataType: string;
  } | null>(null);

  // Refs for chart components
  const linePlotRef = useRef<any>(null);
  const barPlotRef = useRef<any>(null);
  const piePlotRef = useRef<any>(null);
  const donutPlotRef = useRef<any>(null);

  // Drill-down state
  const { drillDownState, openDrawer, closeDrawer, isOpen } = useChartDrawer();
  const [drillDownChartData, setDrillDownChartData] = useState<any>(null);

  // Memoized request body to prevent unnecessary API calls
  const requestBody = useMemo(() => buildRequestBody(dimensions, 'all'), [dimensions]);

  const fetchChartDataByTestCase = async () => {
    try {
      if (testCase === "test-case-1") {
        const res = await fetchAllChartData({ body: buildRequestBody(dimensions, 'all') }).unwrap();
        if (!res?.success) throw new Error(res.message || "Error");
        return res;
      } else {
        const raw = await FetchTestCase2AllChartData({ body: buildRequestBody(dimensions, 'all'), productId: testCase2ProductId, excludeNullRevenue: false }).unwrap();
        const transformed = transformTestCase2ToCommonFormat(raw);
        if (!transformed?.success) throw new Error(transformed.message || "Error");
        return transformed;
      }
    } catch (error) {
      console.log(error, 'Error fetching chart data');

    }
  }


  // Fetch all chart data using single API call
  const fetchAllChartDataHandle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all chart data
      const result: any = await fetchChartDataByTestCase();

      // Process and store chart data from single API response
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      const pieData = result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [];
      const donutData = result?.charts?.donut?.success ? result?.charts?.donut?.data || [] : [];

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
  }, [requestBody, fetchAllChartData]);

  // Fetch data when dimensions change - using useEffect with proper dependencies
  useEffect(() => {
    fetchAllChartDataHandle();
  }, [fetchAllChartDataHandle, testCase, dimensions]);

  // Event handlers
  const handleCreateGroup = useCallback((data: Dimensions): void => {
    setDimensions(data);
  }, []);

  const handleResetGroup = useCallback((): void => {
    setDimensions(null);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setIsGroupModalOpen(false);
  }, []);

  const handleOpenModal = useCallback((): void => {
    setIsGroupModalOpen(true);
  }, []);

  const handleDismissError = useCallback((): void => {
    setError(null);
  }, []);

  const handleContextMenuFilter = useCallback(() => {
    if (contextMenu) {
      // @ts-ignore
      setDimensions(handleCrossChartFilteringFunc(String(contextMenu.category)))
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleContextMenuDrillDown = useCallback(() => {
    if (contextMenu) {
      handleDrillDown(contextMenu.chartType, contextMenu.category, contextMenu.dataType, contextMenu.value);
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);


  // Generic drill down function using API
  const handleDrillDown = useCallback(async (chartType: string, category: string, dataType: string, value?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const result: any = testCase === "test-case-1"
        ? await fetchDrillDownData({
          table_name: databaseName,
          chart_type: chartType,
          category: category,
          data_type: dataType,
          value: value
        }).unwrap()
        : transformTestCase2DrillDownData(await fetchTestCase2DrillDownData({
          productId: testCase2ProductId,
          chartType: chartType,
          category: category,
          dataType: dataType,
          value: value
        }).unwrap());

      if (result.success && result.data && result.data.length > 0) {
        const drillData = result.data;
        const title = result.title || `${dataType} Breakdown for ${category}`;
        const columns = result.columns || Object.keys(drillData[0]);

        // Convert API response to Plotly format
        const formattedData = formatDrillDownData(drillData, columns, chartType);
        let drillChartType: 'line' | 'bar' | 'pie' = 'bar';

        // Determine chart type based on data structure

        if (chartType === 'line' || chartType === 'bar') {
          drillChartType = 'bar';
        } else if (columns.includes('period')) {
          drillChartType = 'line';
        } else {
          drillChartType = 'pie';
        }

        setDrillDownChartData(formattedData);
        openDrawer({
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
  }, [fetchDrillDownData, openDrawer]);

  // Format drill down data for Plotly
  const formatDrillDownData = useCallback((data: ChartDataPoint[], columns: string[], chartType: string) => {
    // Time series data - use line chart

    // Category data - use bar chart
    if (chartType === 'bar' || chartType === 'line') {
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
    } else if (columns.includes('period')) {
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

  // Event handlers for chart clicks - memoized with proper dependencies
  const handleChartClick = useCallback(async (chartType: string, point: any) => {
    if (!point) return;

    let category = point.x || point.label;
    let dataType = point.data?.name?.toLowerCase() || 'revenue';
    let value = point.value || point.y;
    await handleDrillDown(chartType, category, dataType, value);
  }, [handleDrillDown]);

  const handleLineChartClick = useCallback((data: any) => {
    if (data?.points?.[0]) {
      const nativeEvent = data.event;
     
      setContextMenu({
        isOpen: true,
        position: { x: nativeEvent.clientX, y: nativeEvent.clientY },
        category: data.points[0].x || data.points[0].label,
        value: Number(data.points[0].value || data.points[0].y),
        chartType: 'line',
        dataType: data.points[0].data?.name?.toLowerCase() || 'revenue'
      });
      // // @ts-ignore   
      // if (data.event?.ctrlKey || data.event?.metaKey) {
      //   handleChartClick('line', data.points[0]);
      // } else {
      //   // @ts-ignore
      //   setDimensions(handleCrossChartFilteringFunc(String(data.points[0].x)));
      // }
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

  // Attach event handlers only once when component mounts and data is available
  useEffect(() => {
    if (isLoading) return;

    const attachHandlers = () => {
      // Remove existing listeners first to prevent duplicates
      if (linePlotRef.current?.el) {
        linePlotRef.current.el.removeAllListeners('plotly_click');
        linePlotRef.current.el.on('plotly_click', handleLineChartClick);
      }
      if (barPlotRef.current?.el) {
        barPlotRef.current.el.removeAllListeners('plotly_click');
        barPlotRef.current.el.on('plotly_click', handleBarChartClick);
      }
      if (piePlotRef.current?.el) {
        piePlotRef.current.el.removeAllListeners('plotly_click');
        piePlotRef.current.el.on('plotly_click', handlePieChartClick);
      }
      if (donutPlotRef.current?.el) {
        donutPlotRef.current.el.removeAllListeners('plotly_click');
        donutPlotRef.current.el.on('plotly_click', handleDonutChartClick);
      }
    };

    const timeoutId = setTimeout(attachHandlers, 100);

    return () => {
      clearTimeout(timeoutId);
      // Clean up event listeners on unmount
      // if (linePlotRef.current?.el) linePlotRef.current.el.removeAllListeners('plotly_click');
      //   if (barPlotRef.current?.el) barPlotRef.current.el.removeAllListeners('plotly_click');
      //   if (piePlotRef.current?.el) piePlotRef.current.el.removeAllListeners('plotly_click');
      //   if (donutPlotRef.current?.el) donutPlotRef.current.el.removeAllListeners('plotly_click');
    };
  }, [isLoading, handleLineChartClick, handleBarChartClick, handlePieChartClick, handleDonutChartClick]);

  // Memoized drill down chart rendering
  const renderDrillDownChart = useMemo(() => {
    if (!drillDownChartData || !drillDownState) return null;

    const commonProps = {
      data: drillDownChartData,
      style: { width: "100%", height: "100%" },
      config: DEFAULT_CONFIGURATION
    };

    switch (drillDownState.chartType) {
      case 'line':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true, xaxis: { tickformat: 'digits' } }} />;
      case 'bar':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, barmode: 'group', autosize: true }} />;
      case 'pie':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true }} />;
      case 'donut':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true }} />;
      default:
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true }} />;
    }
  }, [drillDownChartData, drillDownState]);

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

  // Memoized pie chart data calculation
  const pieChartData = useMemo(() => {
    if (!chartData.pie.length) return { values: [], labels: [] };

    return {
      values: chartData.pie.map(d => d.revenue || d.value || 0),
      labels: chartData.pie.map(d => d.catfinancialview || d.catFinancialView || d.label || '')
    };
  }, [chartData.pie]);

  // Memoized chart data for better performance
  const lineChartData = useMemo(() => [
    {
      x: chartData.line.map(d => d.period),
      y: chartData.line.map(d => d.revenue),
      type: "scatter" as const,
      mode: "lines+markers" as const,
      name: "Revenue",
      line: { color: "blue" },
    },
    {
      x: chartData.line.map(d => d.period),
      y: chartData.line.map(d => d.grossMargin),
      type: "scatter" as const,
      mode: "lines+markers" as const,
      name: "grossMargin",
      line: { color: "purple" },
    },
    {
      x: chartData.line.map(d => d.period),
      y: chartData.line.map(d => d.netProfit),
      type: "scatter" as const,
      mode: "lines+markers" as const,
      name: "netProfit",
      line: { color: "green" },
    },
  ], [chartData.line]);

  const barChartData = useMemo(() => [
    {
      x: chartData.bar.map(d => d.period),
      y: chartData.bar.map(d => d.revenue),
      type: "bar" as const,
      name: "Revenue",
      marker: { color: "teal" },
    },
    {
      x: chartData.bar.map(d => d.period),
      y: chartData.bar.map(d => d.expenses),
      type: "bar" as const,
      name: "Expenses",
      marker: { color: "orange" },
    },
  ], [chartData.bar]);

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - React Plotly</h1>

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={handleCloseModal}
        // @ts-ignore
        onCreateGroup={handleCreateGroup}
      />
      <div className="flex flex-col mb-4">
        {dimensions?.groupName && (
          <p className="text-sm text-gray-500">
            Current Group Name: <span className="capitalize font-bold">{dimensions.groupName}</span>
          </p>
        )}
        <div className="flex gap-2">
          <ActionButton
            onClick={handleResetGroup}
            className="bg-red-400 hover:bg-red-500"
            disabled={isLoading}
          >
            Reset Group
          </ActionButton>

          <ActionButton
            onClick={handleOpenModal}
            className="bg-blue-400 hover:bg-blue-500"
            disabled={isLoading}
          >
            Create Group
          </ActionButton>

          <ActionButton
            onClick={fetchAllChartDataHandle}
            className="bg-green-400 hover:bg-green-500"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </ActionButton>
        </div>
      </div>

      <ChartContextMenu
        isOpen={contextMenu?.isOpen || false}
        position={contextMenu?.position || { x: 0, y: 0 }}
        onClose={handleContextMenuClose}
        onFilter={handleContextMenuFilter}
        onDrillDown={handleContextMenuDrillDown}
        category={contextMenu?.category || ''}
        value={contextMenu?.value || ''}
      />

      {error && (<ErrorAlert message={error} onDismiss={handleDismissError} />)}

      {isLoading && <LoadingAlert />}

      <ReusableChartDrawer
        isOpen={isOpen}
        drillDownState={drillDownState}
        onBack={() => {
          closeDrawer();
          setDrillDownChartData(null);
        }}
        isLoading={isLoading}
        showBackButton={true}
        showCloseButton={true}
      >
        {renderDrillDownChart}
      </ReusableChartDrawer>

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
              data={lineChartData}
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
              data={barChartData}
              layout={{
                title: "Revenue vs Operating Expenses",
                barmode: "group",
                autosize: true,
                xaxis: { tickformat: 'digits' },
                yaxis: { title: "Amount ($)" }
              }}
              style={{ width: "100%", height: "100%" }}
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
                values: pieChartData.values,
                type: "pie",
                marker: { colors: CHART_COLORS },
                labels: pieChartData.labels
              }]}
              layout={{
                title: "Financial Distribution",
                autosize: true
              }}
              style={{ width: "100%", height: "100%" }}
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
                values: chartData.donut.map(d => d.revenue || 0),
                labels: chartData.donut.map((d: any) => d.cataccountingview || ''),
                type: "pie",
                hole: 0.5,
                marker: { colors: CHART_COLORS }
              }]}
              layout={{
                title: "Revenue by Category",
                autosize: true
              }}
              style={{ width: "100%", height: "100%" }}
              config={DEFAULT_CONFIGURATION}
            />
          </ChartContainer>
        )}

        <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
          <i>Click on any chart element to drill down into more detailed data</i>
        </p>
      </div>
    </section>
  );
};