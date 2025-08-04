//src\app\react-plotly\ReactPlotlyPage.tsx
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
import { ActionButton, DashboardActionButtonComponent } from "@/components/ui/action-button";
import ReusableChartDrawer, { useChartDrawer } from "@/components/ChartDrawer";
import { ErrorAlert, LoadingAlert } from "@/components/ui/status-alerts";
import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from "@/lib/services/testCase2Api";
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from "@/lib/testCase2Transformer";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { ChartContextMenu } from "@/components/charts/ChartContextMenu";
import { ChartContainerView } from "@/components/charts/ChartContainerView";
import { PlotlyCaptureChartScreenshot } from "@/utils/utils";
import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { useChartComparisonDrawer } from "@/hooks/useChartComparisonDrawer";
import { ComparisonDrawer } from "@/components/drawer/ChartComparisonDrawer";

// Constants
const DEFAULT_CONFIGURATION = {
  responsive: true,
  displayModeBar: false,
  modeBarButtonsToRemove: ['editInChartStudio', 'zoom2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d'],
  scrollZoom: false,
  showTips: false
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
  resetDrillDown?: () => void;
  isCrossChartFiltered?: string;
  resetCrossChartFilter?: () => void;
  isLoading: boolean;
  onShareChart: () => void;
  onComparisonOpen: (chartType: string) => void;
  chartType?: string;
}

// Memoized Chart Container Component
const ChartContainer = React.memo(({
  title,
  children,
  onDownloadCSV,
  onDownloadImage,
  isDrilled,
  resetDrillDown,
  isCrossChartFiltered,
  resetCrossChartFilter,
  isLoading,
  onShareChart,
  onComparisonOpen,
  chartType
}: ChartContainerProps) => (
  <ChartContainerView
    title={title}
    isDrilled={isDrilled}
    resetDrillDown={resetDrillDown}
    isLoading={isLoading}
    isCrossChartFiltered={isCrossChartFiltered}
    resetCrossChartFilter={resetCrossChartFilter}
    exportToCSV={onDownloadCSV}
    exportToPNG={onDownloadImage}
    hasData={true}
    chartRef={undefined}
    children={children}
    onShareChart={onShareChart}
    onComparisonOpen={() => onComparisonOpen(chartType || '')}
    className="h-96"
  />

));

export default function ReactPlotlyPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [crossChartFilter, setCrossChartFilter] = useState<string>('');

  const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();
  // Comparison drawer state
  const { comparisonDrawer, handleComparisonOpenDrawer, handleComparisonCloseDrawer } = useChartComparisonDrawer()
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
    donut: ChartDataPoint[],
    drillDown: any[]
  }>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: []
  });

  // Drill down state
  const [drillDownState, setDrillDownState] = useState<{
    isDrilled: boolean;
    chartType: 'line' | 'bar' | 'pie' | 'donut' | null;
    title: string;
    data: any[];
    layout: any;
  }>({
    isDrilled: false,
    chartType: null,
    title: '',
    data: [],
    layout: {}
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

  const fetchChartDataByTestCase = async () => {
    try {
      if (testCase === "test-case-1") {
        const res = await fetchAllChartData({
          body: buildRequestBody(dimensions, 'all'),
          crossChartFilter: crossChartFilter,
        }).unwrap();
        if (!res?.success) throw new Error(res.message || "Error");

        return res;
      } else {
        const raw = await FetchTestCase2AllChartData({ body: buildRequestBody(dimensions, 'all'), crossChartFilter: crossChartFilter, productId: testCase2ProductId, excludeNullRevenue: false }).unwrap();
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
        donut: donutData,
        drillDown: []
      });

    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch chart data");
      console.error("Error fetching chart data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dimensions, testCase, crossChartFilter]);

  // Fetch data when dimensions change - using useEffect with proper dependencies
  useEffect(() => {
    fetchAllChartDataHandle();
  }, [fetchAllChartDataHandle, dimensions, testCase, crossChartFilter]);

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
      setCrossChartFilter(contextMenu.category);
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

  const handleResetDrillDown = useCallback(() => {
    setDrillDownState({
      isDrilled: false,
      chartType: null,
      title: '',
      data: [],
      layout: {}
    });
  }, []);


  const handleResetCrossChartFilter = useCallback(() => {
    setCrossChartFilter('');
  }, []);

  const handleShareChart = async (
    title: string,
    chartType: 'line' | 'bar' | 'pie' | 'donut'
  ) => {
    try {
      let plotRef;
      switch (chartType) {
        case 'line':
          plotRef = linePlotRef;
          break;
        case 'bar':
          plotRef = barPlotRef;
          break;
        case 'pie':
          plotRef = piePlotRef;
          break;
        case 'donut':
          plotRef = donutPlotRef;
          break;
        default:
          throw new Error('Invalid chart type');
      }

      if (!plotRef.current) {
        throw new Error('Chart reference not found');
      }

      const imageData = await PlotlyCaptureChartScreenshot(plotRef);
      handleOpenDrawer(title, imageData);
    } catch (error) {
      console.error('Failed to capture chart:', error);
      setError('Failed to capture chart for sharing');
    }
  };


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

        setChartData(prev => ({
          ...prev,
          drillDown: result.data
        }));
        setDrillDownState({
          isDrilled: true,
          chartType: chartType as any,
          title: title,
          data: formattedData,
          layout: {
            title: title,
            autosize: true,
            ...(chartType === 'bar' ? { barmode: 'group' } : {}),
            ...(chartType === 'line' ? { xaxis: { tickformat: 'digits' } } : {})
          }
        });
        // setDrillDownChartData(formattedData);
        // openDrawer({
        //   chartType: drillChartType,
        //   category,
        //   title,
        //   dataType
        // });
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
  const formatDrillDownData = useCallback((data: ChartDataPoint[], columns: string[], chartType: string) => {
    // Time series data - use line chart

    // Category data - use bar chart
    if (chartType === 'bar' || chartType === 'line') {
      const labelKey = columns[0];
      return [{
        x: data.map(d => d[labelKey]),
        y: data.map(d => d[columns[1]] || 0),
        type: chartType,
        name: columns[1],
        marker: { color: CHART_COLORS[0] }
      }];
    } else if (chartType === 'pie' || chartType === 'donut') {
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
    if (chartType === 'bar' && String(category).length > 4) {
      category = String(category).slice(0, 4)
    }

    let dataType = point.data?.name?.toLowerCase() || 'revenue';
    let value = point.value || point.y;
    await handleDrillDown(chartType, category, dataType, value);
  }, [handleDrillDown]);

  const handleLineChartClick = useCallback((data: any) => {
    if (drillDownState?.isDrilled && drillDownState?.chartType === 'line') {
      return;
    }
    if (data?.points?.[0]) {
      const nativeEvent = data.event;
      let clickedValue = data.points[0].x || data.points[0].label;
      if (typeof clickedValue === 'number') {
        clickedValue = String(clickedValue);
      }
      // If the value looks like a period (e.g., "201601"), extract just the year
      const category = /^\d{6}$/.test(clickedValue) ?
        clickedValue.slice(0, 4) :
        clickedValue;

      setContextMenu({
        isOpen: true,
        position: { x: nativeEvent.clientX, y: nativeEvent.clientY },
        category: category,
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
  }, [handleChartClick, drillDownState?.chartType === 'line']);

  const handleBarChartClick = useCallback((data: any) => {
    if (drillDownState?.isDrilled && drillDownState?.chartType === 'bar') {
      return;
    }
    if (data?.points?.[0]) {
      handleChartClick('bar', data.points[0]);
    }
  }, [handleChartClick, drillDownState?.chartType === 'bar']);

  const handlePieChartClick = useCallback((data: any) => {
    if (drillDownState?.isDrilled && drillDownState?.chartType === 'pie') {
      return;
    }
    if (data?.points?.[0]) {
      handleChartClick('pie', data.points[0]);
    }
  }, [handleChartClick, drillDownState?.chartType === 'pie']);

  const handleDonutChartClick = useCallback((data: any) => {
    if (drillDownState?.isDrilled && drillDownState?.chartType === 'donut') {
      return;
    }
    if (data?.points?.[0]) {
      handleChartClick('donut', data.points[0]);
    }
  }, [handleChartClick, drillDownState?.chartType === 'donut']);

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
  }, [isLoading, drillDownState?.isDrilled, handleLineChartClick, handleBarChartClick, handlePieChartClick, handleDonutChartClick]);

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
  const lineChartData = useMemo(() => {
    const xKey = crossChartFilter ? 'period' : 'fiscalYear';

    return [
      {
        x: chartData.line.map(d => d[xKey]),
        y: chartData.line.map(d => d.revenue),
        type: "scatter" as const,
        mode: "lines+markers" as const,
        name: "Revenue",
        line: {
          color: "#3B82F6",
          width: 2
        },
        marker: {
          size: 8,
          color: "#3B82F6",
          line: {
            color: '#1E40AF',
            width: 2
          }
        },
        // Hover effect - bigger markers and brighter colors
        selected: {
          marker: {
            size: 14,
            color: '#1D4ED8',
            line: {
              color: '#1E3A8A',
              width: 3
            }
          }
        },
        unselected: {
          marker: {
            opacity: 0.7
          }
        },
        hovertemplate: '<b>%{fullData.name}</b><br>' +
          'Year: %{x}<br>' +
          'Amount: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: "#1E40AF",
          bordercolor: "#1D4ED8",
          font: { color: "white", size: 12 }
        }
      },
      {
        x: chartData.line.map(d => d[xKey]),
        y: chartData.line.map(d => d.grossMargin),
        type: "scatter" as const,
        mode: "lines+markers" as const,
        name: "GrossMargin",
        line: {
          color: "#F59E0B",
          width: 2
        },
        marker: {
          size: 8,
          color: "#F59E0B",
          line: {
            color: '#D97706',
            width: 2
          }
        },
        // Hover effect - bigger markers and brighter colors
        selected: {
          marker: {
            size: 14,
            color: '#D97706',
            line: {
              color: '#B45309',
              width: 3
            }
          }
        },
        unselected: {
          marker: {
            opacity: 0.7
          }
        },
        hovertemplate: '<b>%{fullData.name}</b><br>' +
          'Year: %{x}<br>' +
          'Amount: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: "#D97706",
          bordercolor: "#B45309",
          font: { color: "white", size: 12 }
        }
      },
      {
        x: chartData.line.map(d => d[xKey]),
        y: chartData.line.map(d => d.netProfit),
        type: "scatter" as const,
        mode: "lines+markers" as const,
        name: "NetProfit",
        line: {
          color: "#10B981",
          width: 2
        },
        marker: {
          size: 8,
          color: "#10B981",
          line: {
            color: '#059669',
            width: 2
          }
        },
        // Hover effect - bigger markers and brighter colors
        selected: {
          marker: {
            size: 14,
            color: '#059669',
            line: {
              color: '#047857',
              width: 3
            }
          }
        },
        unselected: {
          marker: {
            opacity: 0.7
          }
        },
        hovertemplate: '<b>%{fullData.name}</b><br>' +
          'Year: %{x}<br>' +
          'Amount: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: "#059669",
          bordercolor: "#047857",
          font: { color: "white", size: 12 }
        }
      },
    ]
  }, [chartData.line, crossChartFilter]);


  const barChartData = useMemo(() => {
    const xKey = crossChartFilter ? 'period' : 'fiscalYear';
    return [
      {
        x: chartData.bar.map(d => d[xKey]),
        y: chartData.bar.map(d => d.revenue),
        type: "bar" as const,
        name: "Revenue",
        marker: {
          color: "teal",
          line: {
            color: 'darkcyan',
            width: 2
          }
        },
        hovertemplate: '<b>%{fullData.name}</b><br>' +
          'Year: %{x}<br>' +
          'Amount: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: "teal",
          bordercolor: "darkcyan",
          font: { color: "white", size: 12 }
        }
      },
      {
        x: chartData.bar.map(d => d[xKey]),
        y: chartData.bar.map(d => d.expenses),
        type: "bar" as const,
        name: "Expenses",
        marker: {
          color: "orange",
          line: {
            color: 'darkorange',
            width: 2
          }
        },
        hovertemplate: '<b>%{fullData.name}</b><br>' +
          'Year: %{x}<br>' +
          'Amount: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: "orange",
          bordercolor: "darkorange",
          font: { color: "white", size: 12 }
        }
      },
    ]
  }, [chartData.bar, crossChartFilter]);


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
        <DashboardActionButtonComponent
          isLoading={isLoading}
          handleResetGroup={handleResetGroup}
          handleOpenModal={handleOpenModal}
          fetchAllChartDataHandle={fetchAllChartDataHandle}
        />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chartData.line.length > 0 && (
          <ChartContainer
            title={drillDownState?.chartType === 'line' ? drillDownState?.title : "Revenue Trends"}
            chartType="line"
            onComparisonOpen={handleComparisonOpenDrawer}
            onDownloadCSV={() => handleDownloadCSV(drillDownState?.isDrilled && drillDownState?.chartType === 'line' ? chartData?.drillDown : chartData.line, drillDownState?.chartType === 'line' ? drillDownState?.title : "Revenue Trends")}
            onDownloadImage={() => handleDownloadImage(linePlotRef, drillDownState?.chartType === 'line' ? drillDownState?.title : "Revenue Trends")}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'line'}
            resetDrillDown={handleResetDrillDown}
            isCrossChartFiltered={crossChartFilter}
            resetCrossChartFilter={handleResetCrossChartFilter}
            isLoading={isLoading}
            onShareChart={() => handleShareChart(drillDownState?.chartType === 'line' ? drillDownState?.title : "Revenue Trends", 'line')}
          >
            <Plot
              key={`line-chart-${dimensions?.groupName || 'default'}`}
              ref={linePlotRef}
              data={drillDownState?.isDrilled && drillDownState?.chartType === 'line' ? drillDownState?.data : lineChartData}
              layout={{
                title: "Revenue Trends Over Time",
                autosize: true,
                xaxis: { tickformat: 'digits' },
                yaxis: { title: "Amount ($)" },
                hovermode: 'closest',
                hoverdistance: 50,
                // Enable selection mode for hover effects
                selectdirection: 'diagonal',
                dragmode: false
              }}
              style={{ width: "100%", height: "100%", cursor: "pointer" }}
              config={{
                ...DEFAULT_CONFIGURATION,
                // Enable hover animations
                // animate: true,
                // animation: {
                //   duration: 300,
                //   easing: 'ease-out'
                // }
              }}

            />
          </ChartContainer>
        )}

        {chartData.bar.length > 0 && (
          <ChartContainer
            title={drillDownState?.chartType === 'bar' ? drillDownState?.title : "Revenue vs Expenses"}
            chartType="bar"
            onComparisonOpen={handleComparisonOpenDrawer}
            onDownloadCSV={() => handleDownloadCSV(chartData.bar, "Revenue_vs_Expenses")}
            onDownloadImage={() => handleDownloadImage(barPlotRef, "Revenue_vs_Expenses")}
            isCrossChartFiltered={crossChartFilter}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'bar'}
            resetDrillDown={handleResetDrillDown}
            isLoading={isLoading}
            onShareChart={() => handleShareChart(drillDownState?.chartType === 'bar' ? drillDownState?.title : "Revenue vs Expenses", 'bar')}
          >
            <Plot
              key={`bar-chart-${dimensions?.groupName || 'default'}`}
              ref={barPlotRef}
              data={drillDownState?.isDrilled && drillDownState?.chartType === 'bar' ? drillDownState?.data : barChartData}
              layout={{
                title: "Revenue vs Operating Expenses",
                barmode: "group",
                autosize: true,
                xaxis: { tickformat: 'digits' },
                yaxis: { title: "Amount ($)" },
                hovermode: 'closest',
                hoverdistance: 50,
                // Bar hover effects
                bargap: 0.15,
                bargroupgap: 0.1
              }}
              style={{ width: "100%", height: "100%", cursor: "pointer" }}
              config={{
                ...DEFAULT_CONFIGURATION,
                // Enable hover animations
                animate: true,
                animation: {
                  duration: 200,
                  easing: 'ease-out'
                }
              }}
            />
          </ChartContainer>
        )}

        {chartData.pie.length > 0 && (
          <ChartContainer
            title={drillDownState?.chartType === 'pie' ? drillDownState?.title : "Financial Distribution"}
            chartType="pie"
            onComparisonOpen={handleComparisonOpenDrawer}
            onDownloadCSV={() => handleDownloadCSV(chartData.pie, "Financial_Distribution")}
            onDownloadImage={() => handleDownloadImage(piePlotRef, "Financial_Distribution")}
            isCrossChartFiltered={crossChartFilter}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'pie'}
            resetDrillDown={handleResetDrillDown}
            isLoading={isLoading}
            onShareChart={() => handleShareChart(drillDownState?.chartType === 'pie' ? drillDownState?.title : "Financial Distribution", 'pie')}
          >
            {drillDownState.isDrilled && drillDownState.chartType === 'pie' ? (
              <Plot
                ref={piePlotRef}
                data={drillDownState?.data}
                layout={{
                  title: "Revenue Trends Over Time",
                  autosize: true,
                  xaxis: { tickformat: 'digits' },
                  yaxis: { title: "Amount ($)" }
                }}
                style={{ width: "100%", height: "100%" }}
                config={DEFAULT_CONFIGURATION}
              />
            ) : (
              <Plot
                key={`pie-chart-${dimensions?.groupName || 'default'}`}
                ref={piePlotRef}
                data={[{
                  values: pieChartData.values,
                  type: "pie",
                  marker: {
                    colors: CHART_COLORS,
                    line: {
                      color: '#FFFFFF',
                      width: 2
                    }
                  },
                  labels: pieChartData.labels,
                  hovertemplate: '<b>%{label}</b><br>' +
                    'Value: $%{value:,.0f}<br>' +
                    'Percentage: %{percent}<br>' +
                    '<extra></extra>',
                  hoverlabel: {
                    bgcolor: "rgba(0,0,0,0.8)",
                    bordercolor: "white",
                    font: { color: "white", size: 12 }
                  },
                  pull: 0.05, // Slight pull effect on hover
                  textinfo: 'label+percent',
                  textposition: 'outside'
                }]}
                layout={{
                  title: "Financial Distribution",
                  autosize: true,
                  hovermode: 'closest'
                }}
                style={{ width: "100%", height: "100%", cursor: "pointer" }}
                config={DEFAULT_CONFIGURATION}

              />
            )}
          </ChartContainer>
        )}
        {chartData.donut.length > 0 && (
          <ChartContainer
            title={drillDownState?.chartType === 'donut' ? drillDownState?.title : "Revenue by Category"}
            chartType="donut"
            onComparisonOpen={handleComparisonOpenDrawer}
            onDownloadCSV={() => handleDownloadCSV(chartData.donut, "Revenue_by_Category")}
            onDownloadImage={() => handleDownloadImage(donutPlotRef, "Revenue_by_Category")}
            isCrossChartFiltered={crossChartFilter}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'donut'}
            resetDrillDown={handleResetDrillDown}
            isLoading={isLoading}
            onShareChart={() => handleShareChart(drillDownState?.chartType === 'donut' ? drillDownState?.title : "Revenue by Category", 'donut')}
          >
            {drillDownState.isDrilled && drillDownState.chartType === 'donut' ? (
              <Plot
                ref={donutPlotRef}
                data={drillDownState?.data}
                layout={{
                  title: "Revenue Trends Over Time",
                  autosize: true,
                  xaxis: { tickformat: 'digits' },
                  yaxis: { title: "Amount ($)" }
                }}
                style={{ width: "100%", height: "100%" }}
                config={DEFAULT_CONFIGURATION}
              />
            ) : (
              <Plot
                key={`donut-chart-${dimensions?.groupName || 'default'}`}
                ref={donutPlotRef}
                data={[{
                  values: chartData.donut.map(d => d.revenue || 0),
                  labels: chartData.donut.map((d: any) => d.cataccountingview || ''),
                  type: "pie",
                  hole: 0.5,
                  marker: {
                    colors: CHART_COLORS,
                    line: {
                      color: '#FFFFFF',
                      width: 2
                    }
                  },
                  hovertemplate: '<b>%{label}</b><br>' +
                    'Revenue: $%{value:,.0f}<br>' +
                    'Percentage: %{percent}<br>' +
                    '<extra></extra>',
                  hoverlabel: {
                    bgcolor: "rgba(0,0,0,0.8)",
                    bordercolor: "white",
                    font: { color: "white", size: 12 }
                  },
                  pull: 0.05,
                  textinfo: 'label+percent',
                  textposition: 'outside'
                }]}
                layout={{
                  title: "Revenue by Category",
                  autosize: true,
                  hovermode: 'closest'
                }}
                style={{ width: "100%", height: "100%", cursor: "pointer" }}
                config={DEFAULT_CONFIGURATION}
              />
            )}

          </ChartContainer>
        )}

        <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
          <i>Click on any chart element to drill down into more detailed data</i>
        </p>
      </div>
      <EmailShareDrawer
        isOpen={emailDrawer.isOpen}
        onClose={handleCloseDrawer}
        chartTitle={emailDrawer.chartTitle}
        chartImage={emailDrawer.chartImage}
      />
      <ComparisonDrawer
        isOpen={comparisonDrawer.isOpen}
        onClose={handleComparisonCloseDrawer}
        chartType={comparisonDrawer.chartType}
        chartLibrary="plotly"
        testCase={testCase}
      />
    </section>
  );
};