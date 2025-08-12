"use client";
import React, { useState, useEffect, useRef, forwardRef, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  ChartTypeRegistry,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import { GroupModal } from "@/components/GroupManagement";
import {
  useFetchChartDataMutation,
  databaseName,
  useFetchDrillDownDataMutation
} from "@/lib/services/usersApi";
// Types
import { BarChartData, Dimensions, DonutChartData, LineChartData, PieChartData } from "@/types/Schemas";
import { buildRequestBody } from "@/lib/services/buildWhereClause";
import { DashboardActionButtonComponent } from "@/components/ui/action-button";
import { ErrorAlert } from "@/components/ui/status-alerts";
import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from "@/lib/services/testCase2Api";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from "@/lib/testCase2Transformer";
import { ChartContextMenu } from "@/components/charts/ChartContextMenu";
import { ChartContainerView } from "@/components/charts/ChartContainerView";
import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { ChartJscaptureChartScreenshot, formatCurrency } from "@/utils/utils";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { ComparisonDrawer } from "@/components/drawer/ChartComparisonDrawer";
import { useChartComparisonDrawer } from "@/hooks/useChartComparisonDrawer";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const createEmptyChartData = <T extends keyof ChartTypeRegistry>(): ChartData<T> => ({
  labels: [],
  datasets: [],
});

interface ChartContainerProps {
  title: string;
  chartRef: React.RefObject<any>;
  data: any;
  children: React.ReactNode;
  isDrilled?: boolean;
  resetDrillDown?: () => void;
  isLoading: boolean;
  isCrossChartFiltered?: string;
  resetCrossChartFilter?: () => void;
  handleShareChart: (title: string, chartRef: React.RefObject<HTMLDivElement>) => void
  onComparisonOpen: (chartType: string) => void;
  chartType?: string;
}

const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ title, chartRef, data, children, isDrilled, resetDrillDown, isLoading, isCrossChartFiltered, resetCrossChartFilter, handleShareChart, onComparisonOpen, chartType }, ref) => {
    const hasData = data && data.length > 0;

    const handleDownloadImage = () => {
      if (chartRef.current) {
        const url = chartRef.current.toBase64Image();
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title.replace(/\s+/g, "_").toLowerCase()}.png`;
        link.click();
      }
    };

    const handleDownloadCSV = () => {
      if (!data || !data.length) return;

      // Extract headers
      const headers = Object.keys(data[0]);
      let csvContent = "data:text/csv;charset=utf-8,";

      // Add headers
      csvContent += headers.join(",") + "\n";

      // Add each row
      data.forEach((row: Record<string, any>) => {
        const values = headers.map(header => JSON.stringify(row[header] ?? ""));
        csvContent += values.join(",") + "\n";
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${title.replace(/\s+/g, "_").toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <>
        <ChartContainerView
          title={title}
          isDrilled={isDrilled}
          resetDrillDown={resetDrillDown}
          isLoading={isLoading}
          isCrossChartFiltered={isCrossChartFiltered}
          resetCrossChartFilter={resetCrossChartFilter}
          hasData={hasData}
          exportToPNG={handleDownloadImage}
          exportToCSV={handleDownloadCSV}
          children={children}
          chartRef={chartRef}
          onShareChart={() => handleShareChart(title, chartRef as React.RefObject<HTMLDivElement>)}
          onComparisonOpen={() => onComparisonOpen(chartType || '')}
          className="h-64"
        />
      </>
    );
  }
);

ChartContainer.displayName = "ChartContainer";


export default function ChartJsPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [drillDownState, setDrillDownState] = useState<{
    isDrilled: boolean;
    chartType: string | null;
    title: string;
  }>({
    isDrilled: false,
    chartType: null,
    title: ''
  });

  const [crossChartFilter, setCrossChartFilter] = useState<string>('');

  const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();
  // Comparison drawer state
  const { comparisonDrawer, handleComparisonOpenDrawer, handleComparisonCloseDrawer } = useChartComparisonDrawer()
  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

  // Test Case 1 API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation()
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();

  // Test Case 2 API Mutations
  const [FetchTestCase2AllChartData] = useFetchTestCase2ChartDataMutation();
  const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();

  const [lineChartData, setLineChartData] = useState<ChartData<'line'>>(createEmptyChartData<'line'>());
  const [barChartData, setBarChartData] = useState<ChartData<'bar'>>(createEmptyChartData<'bar'>());
  const [pieChartData, setPieChartData] = useState<ChartData<'pie'>>(createEmptyChartData<'pie'>());
  const [donutChartData, setDonutChartData] = useState<ChartData<'doughnut'>>(createEmptyChartData<'doughnut'>());
  const [drillDownChartData, setDrillDownChartData] = useState<ChartData<'bar' | 'line' | 'pie' | 'doughnut'>>(createEmptyChartData<any>());

  // Raw data for CSV export
  const [rawChartData, setRawChartData] = useState<{
    line: LineChartData[],
    bar: BarChartData[],
    pie: PieChartData[],
    donut: DonutChartData[],
    drillDown: any[];
  }>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: []
  });

  const lineChartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);
  const pieChartRef = useRef<any>(null);
  const donutChartRef = useRef<any>(null);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    category: string;
    value: any;
    chartType: string;
    dataType: string;
  } | null>(null);

  const handleCreateGroup = (datas: Dimensions) => {
    setDimensions(datas);
  };

  const fetchChartDataByTestCase = async () => {
    try {
      if (testCase === "test-case-1") {
        const res = await fetchAllChartData({ body: buildRequestBody(dimensions, 'all'), crossChartFilter: crossChartFilter }).unwrap();
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

  // Fetch all chart data
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result: any = await fetchChartDataByTestCase();
      const Xkey = crossChartFilter ? 'period' : 'fiscalYear';

      // Process line chart data
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      if (lineData.length > 0) {
        setLineChartData({
          labels: lineData.map((item: LineChartData) => item[Xkey] || ''),
          datasets: [
            {
              label: "Revenue",
              data: lineData.map((item: LineChartData) => item.revenue || 0),
              borderColor: "rgb(75, 192, 192)",
              backgroundColor: "rgba(75, 192, 192, 0.5)",
              hoverBorderColor: "rgb(54, 162, 235)",
              hoverBackgroundColor: "rgba(54, 162, 235, 0.8)",
              hoverBorderWidth: 3,
              pointHoverRadius: 4,
            },
            {
              label: "grossMargin",
              data: lineData.map((item: LineChartData) => item.grossMargin || 0),
              borderColor: "rgb(53, 162, 235)",
              backgroundColor: "rgba(53, 162, 235, 0.5)",
              hoverBorderColor: "rgb(37, 99, 235)", // Darker blue on hover
              hoverBackgroundColor: "rgba(37, 99, 235, 0.8)",
              hoverBorderWidth: 3,
              pointHoverRadius: 4,
            },
            {
              label: "netProfit",
              data: lineData.map((item: LineChartData) => item.netProfit || 0),
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.5)",
              hoverBorderColor: "rgb(220, 38, 127)", // Darker pink on hover
              hoverBackgroundColor: "rgba(220, 38, 127, 0.8)",
              hoverBorderWidth: 3,
              pointHoverRadius: 4,
            }
          ]
        });
      }

      // Process bar chart data
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      if (barData.length > 0) {
        setBarChartData({
          labels: barData.map((item: BarChartData) => item[Xkey] || ''),
          datasets: [
            {
              label: "Revenue",
              data: barData.map((item: BarChartData) => item.revenue || 0),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              hoverBackgroundColor: "rgba(54, 162, 235, 0.8)", // Darker on hover
              hoverBorderColor: "rgb(54, 162, 235)",
              hoverBorderWidth: 2,
            },
            {
              label: "Expenses",
              data: barData.map((item: BarChartData) => item.expenses || 0),
              backgroundColor: "rgba(255, 99, 132, 0.6)",
              hoverBackgroundColor: "rgba(220, 38, 127, 0.8)", // Darker on hover
              hoverBorderColor: "rgb(220, 38, 127)",
              hoverBorderWidth: 2,
            }
          ]
        });
      }

      // Process pie chart data
      const pieData = result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [];
      if (pieData.length > 0) {
        setPieChartData({
          labels: pieData.map((item: PieChartData) => item.catfinancialview),
          datasets: [{
            data: pieData.map((item: PieChartData) => item.revenue || 0),
            backgroundColor: [
              "rgba(75, 192, 192, 0.6)",
              "rgba(255, 99, 132, 0.6)",
              "rgba(53, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(153, 102, 255, 0.6)",
              "rgba(255, 159, 64, 0.6)",
            ],
            hoverBackgroundColor: [
              "rgba(54, 162, 235, 0.8)",
              "rgba(220, 38, 127, 0.8)",
              "rgba(37, 99, 235, 0.8)",
              "rgba(234, 179, 8, 0.8)",
              "rgba(124, 58, 237, 0.8)",
              "rgba(234, 88, 12, 0.8)",
            ],
            hoverBorderColor: "#fff",
            hoverBorderWidth: 10,
          }]
        });
      }

      // Process donut chart data
      const donutData = result?.charts?.donut?.success ? result?.charts?.donut?.data || [] : [];
      if (donutData.length > 0) {
        setDonutChartData({
          labels: donutData.map((item: DonutChartData) => item.cataccountingview),
          datasets: [{
            data: donutData.map((item: DonutChartData) => item.revenue || 0),
            backgroundColor: [
              "rgba(255, 206, 86, 0.6)",
              "rgba(75, 192, 192, 0.6)",
              "rgba(153, 102, 255, 0.6)",
              "rgba(255, 159, 64, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 99, 132, 0.6)",
            ],
            hoverBackgroundColor: [
              "rgba(234, 179, 8, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(124, 58, 237, 0.8)",
              "rgba(234, 88, 12, 0.8)",
              "rgba(37, 99, 235, 0.8)",
              "rgba(220, 38, 127, 0.8)",
            ],
            hoverBorderColor: "#fff",
            hoverBorderWidth: 10,
            borderWidth: 2,
          }]
        });
      }

      // Store raw data for CSV export
      setRawChartData({
        line: lineData,
        bar: barData,
        pie: pieData,
        donut: donutData,
        drillDown: [],
      });

    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch chart data");
      console.error("Error fetching chart data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrillDown = async (chartType: string, category: string, dataType: string, value?: any) => {
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

        let formattedData: ChartData<'bar' | 'line' | 'pie' | 'doughnut'>;

        if (chartType === 'line' || chartType === 'bar') {
          const labelKey = columns[0];
          formattedData = {
            labels: drillData.map((d: any) => d[labelKey]),
            datasets: [{
              label: columns[1],
              data: drillData.map((d: any) => d[columns[1]] || 0),
              backgroundColor: "rgba(75, 192, 192, 0.6)"
            }]
          };
        } else if (chartType === 'pie' || chartType === 'donut') {
          formattedData = {
            labels: drillData.map((d: any) => d.period),
            datasets: [{
              label: 'Value',
              data: drillData.map((d: any) => d.value || 0),
              borderColor: "rgb(75, 192, 192)",
              backgroundColor: "rgba(75, 192, 192, 0.5)"
            }]
          };
        } else {
          const labelKey = columns[0];
          formattedData = {
            labels: drillData.map((d: any) => d[labelKey]),
            datasets: [{
              data: drillData.map((d: any) => d.value || 0),
              backgroundColor: [
                "rgba(75, 192, 192, 0.6)",
                "rgba(255, 99, 132, 0.6)",
                "rgba(53, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
              ]
            }]
          };
        }

        setDrillDownChartData(formattedData);
        rawChartData.drillDown = drillData;
        setDrillDownState({
          isDrilled: true,
          chartType: chartType,
          title: title
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

  const handleLineChartClick = async (event: any) => {
    if (!lineChartRef.current) return;
    if (drillDownState.isDrilled && drillDownState.chartType === 'line') return;

    try {
      const points = lineChartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );

      if (points.length === 0) return;

      const clickedPoint = points[0];
      const { datasetIndex, index } = clickedPoint;
      const fiscalYear = crossChartFilter
        // @ts-ignore
        ? lineChartData?.labels?.[index]?.slice(0, 4)
        : (lineChartData?.labels?.[index] as string);
      const dataType = lineChartData?.datasets?.[datasetIndex]?.label?.toLowerCase() || '';
      const value = lineChartData?.datasets?.[datasetIndex]?.data?.[index];

      const nativeEvent = event.native || event;

      setContextMenu({
        isOpen: true,
        position: { x: nativeEvent.clientX, y: nativeEvent.clientY },
        category: fiscalYear,
        value: value,
        chartType: 'line',
        dataType: dataType
      });

    } catch (error) {
      console.error("Error in line chart click handler:", error);
    }
  };

  const handleBarChartClick = async (event: any) => {
    if (!barChartRef.current) return;
    if (drillDownState.isDrilled && drillDownState.chartType === 'bar') return;

    try {
      const points = barChartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );

      if (points.length === 0) return;

      const clickedPoint = points[0];
      const { datasetIndex, index } = clickedPoint;
      const fiscalYear = crossChartFilter
        // @ts-ignore
        ? barChartData?.labels?.[index].slice(0, 4)
        : (barChartData?.labels?.[index] as string);
      const dataType = barChartData?.datasets?.[datasetIndex]?.label?.toLowerCase() || '';
      const value = barChartData?.datasets?.[datasetIndex]?.data?.[index];

      await handleDrillDown('bar', fiscalYear, dataType, value);
    } catch (error) {
      console.error("Error in bar chart click handler:", error);
    }
  };

  const handlePieChartClick = async (event: any) => {
    if (!pieChartRef.current) return;
    if (drillDownState.isDrilled && drillDownState.chartType === 'pie') return;

    try {
      const points = pieChartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );

      if (points.length === 0) return;

      const clickedPoint = points[0];
      const { index } = clickedPoint;
      const category = pieChartData?.labels?.[index] as string;
      const value = pieChartData?.datasets?.[0]?.data?.[index];

      await handleDrillDown('pie', category, 'revenue', value);
    } catch (error) {
      console.error("Error in pie chart click handler:", error);
    }
  };

  const handleDonutChartClick = async (event: any) => {
    if (!donutChartRef.current) return;
    if (drillDownState.isDrilled && drillDownState.chartType === 'donut') return;

    try {
      const points = donutChartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );

      if (points.length === 0) return;

      const clickedPoint = points[0];
      const { index } = clickedPoint;
      const category = donutChartData?.labels?.[index] as string;
      const value = donutChartData?.datasets?.[0]?.data?.[index];

      await handleDrillDown('donut', category, 'revenue', value);
    } catch (error) {
      console.error("Error in donut chart click handler:", error);
    }
  };

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartDataHanlde();
  }, [dimensions, testCase, crossChartFilter]);

  const chartOptions: ChartOptions<'line' | 'bar' | 'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label || ""}: ${formatCurrency(context.raw)}`;
          },
        },
      },
      legend: { position: "top" },
      title: {
        display: true
      }
    },
    onHover: (event, activeElements) => {
      if (event.native?.target) {
        (event.native.target as HTMLCanvasElement).style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    },
    elements: {
      point: {
        hoverRadius: 4,
        hoverBorderWidth: 3
      },
      bar: {
        hoverBorderWidth: 2
      },
      arc: {
        hoverBorderWidth: 3
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => formatCurrency(value),
        },
      },
    },
  };

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
      title: ''
    });
    setDrillDownChartData(createEmptyChartData<any>());
  }, []);

  const handleResetCrossChartFilter = useCallback(() => {
    setCrossChartFilter('');
    handleResetDrillDown()
  }, []);

  const handleShareChart = async (
    title: string,
    chartRef: React.RefObject<HTMLDivElement>
  ) => {
    if (!chartRef.current) return;
    try {
      const imageData = await ChartJscaptureChartScreenshot(chartRef);
      handleOpenDrawer(title, imageData);
    } catch (error) {
      console.error('Failed to capture chart:', error);
      setError('Failed to capture chart for sharing');
    }
  };

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Chart.js</h1>

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={handleCloseModal}
        testCase={testCase}
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
          fetchAllChartDataHandle={fetchAllChartDataHanlde}
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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lineChartData && (
          <ChartContainer title={drillDownState?.chartType === 'line' ? drillDownState?.title : "Revenue Trends"}
            chartType="line"
            onComparisonOpen={handleComparisonOpenDrawer}
            isLoading={isLoading}
            chartRef={lineChartRef}
            data={drillDownState.chartType === 'line' ? rawChartData.drillDown : rawChartData.line}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'line'}
            resetDrillDown={handleResetDrillDown}
            isCrossChartFiltered={crossChartFilter}
            resetCrossChartFilter={handleResetCrossChartFilter}
            handleShareChart={handleShareChart}
          >
            <Line
              ref={lineChartRef}
              // @ts-ignore
              options={{
                ...chartOptions,
                // onClick: handleLineChartClick
              }}
              data={drillDownState.chartType === 'line' && drillDownChartData ? (drillDownChartData as ChartData<'line'>) : lineChartData}
            />
          </ChartContainer>
        )}

        {barChartData && (
          <ChartContainer
            title={drillDownState?.chartType === 'bar' ? drillDownState?.title : "Revenue vs Expenses"}
            chartType="bar"
            onComparisonOpen={handleComparisonOpenDrawer}
            isLoading={isLoading}
            chartRef={barChartRef}
            data={drillDownState.chartType === 'bar' ? rawChartData.drillDown : rawChartData.bar}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'bar'}
            resetDrillDown={handleResetDrillDown}
            isCrossChartFiltered={crossChartFilter}
            handleShareChart={handleShareChart}
          >
            <Bar
              ref={barChartRef}
              // @ts-ignore
              options={{
                ...chartOptions,
                // onClick: handleBarChartClick
              }}
              data={drillDownState.chartType === 'bar' && drillDownChartData ? (drillDownChartData as ChartData<'bar'>) : barChartData}
            />
          </ChartContainer>
        )}
        {pieChartData && (
          <ChartContainer
            title={drillDownState?.chartType === 'pie' ? drillDownState?.title : "Financial Distribution"}
            isLoading={isLoading}
            chartType="pie"
            onComparisonOpen={handleComparisonOpenDrawer}
            chartRef={pieChartRef}
            data={drillDownState.chartType === 'pie' ? rawChartData.drillDown : rawChartData.pie}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'pie'}
            resetDrillDown={handleResetDrillDown}
            handleShareChart={handleShareChart}
            isCrossChartFiltered={crossChartFilter}
          >
            {drillDownState.isDrilled && drillDownState.chartType === 'pie' ? (
              <Line
                ref={lineChartRef}
                //@ts-ignore
                options={{
                  ...chartOptions,
                }}
                data={
                  drillDownChartData && drillDownState.chartType === 'pie'
                    ? (drillDownChartData as ChartData<'line'>)
                    : createEmptyChartData<'line'>()
                }
              />
            ) : (
              <Pie
                ref={pieChartRef}
                options={{
                  ...chartOptions,
                  scales: undefined, 
                  // onClick: handlePieChartClick,
                }}
                data={pieChartData}
              />
            )}
          </ChartContainer>
        )}
        {donutChartData && (
          <ChartContainer
            title={drillDownState?.chartType === 'donut' ? drillDownState?.title : "Revenue by Category"}
            chartType="donut"
            onComparisonOpen={handleComparisonOpenDrawer}
            isLoading={isLoading}
            chartRef={donutChartRef}
            data={drillDownState.chartType === 'donut' ? rawChartData.drillDown : rawChartData.donut}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'donut'}
            resetDrillDown={handleResetDrillDown}
            handleShareChart={handleShareChart}
            isCrossChartFiltered={crossChartFilter}
          >
            {drillDownState.isDrilled && drillDownState.chartType === 'donut' ? (
              <Line
                ref={lineChartRef}
                //@ts-ignore
                options={{
                  ...chartOptions,
                }}
                data={
                  drillDownChartData && drillDownState.chartType === 'donut'
                    ? (drillDownChartData as ChartData<'line'>)
                    : createEmptyChartData<'line'>()
                }
              />
            ) : (
              <Doughnut
                ref={donutChartRef}
                options={{
                  ...chartOptions,
                  scales: undefined, 
                  cutout: "50%",
                  // onClick: handleDonutChartClick
                }}
                data={donutChartData}
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
      {comparisonDrawer.isOpen && <ComparisonDrawer
        isOpen={comparisonDrawer.isOpen}
        onClose={handleComparisonCloseDrawer}
        chartType={comparisonDrawer.chartType}
        chartLibrary='chart-js'
        testCase={testCase}
      />}
    </section>
  );
}