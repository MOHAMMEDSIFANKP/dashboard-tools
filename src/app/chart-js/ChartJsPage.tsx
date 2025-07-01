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
import { buildRequestBody, handleCrossChartFilteringFunc } from "@/lib/services/buildWhereClause";
import { ActionButton } from "@/components/ui/action-button";
import ReusableChartDrawer, { useChartDrawer } from "@/components/ChartDrawer";
import { ChartSkelten } from "@/components/ui/ChartSkelten";
import { ErrorAlert } from "@/components/ui/status-alerts";

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

interface ChartContainerProps {
  title: string;
  chartRef: React.RefObject<any>;
  data: any;
  children: React.ReactNode;
  isDrilled?: boolean;
  onBack?: () => void;
  isLoading?: boolean;
}

const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ title, chartRef, data, children, isDrilled, onBack, isLoading }, ref) => {

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
      if (!data) return;
      let csvContent = "data:text/csv;charset=utf-8,";
      const labels = data.labels;
      const datasets = data.datasets;

      if (labels && datasets) {
        csvContent += ["Label", ...labels].join(",") + "\n";

        datasets.forEach((dataset: any) => {
          csvContent += [dataset.label, ...dataset.data].join(",") + "\n";
        });
      }

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
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
          </div>
          {hasData ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">

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
                    onClick={handleDownloadImage}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    PNG
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    CSV
                  </button>
                </div>
              </div>
              <div className="h-64" ref={chartRef}>
                {children}
              </div>
            </>
          ) : (
            <ChartSkelten />
          )}
        </div>
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

  // API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation()
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();

  // Chart data states
  const emptyChartData = { labels: [], datasets: [] };

  const [lineChartData, setLineChartData] = useState<ChartData<'line'>>(emptyChartData);
  const [barChartData, setBarChartData] = useState<ChartData<'bar'>>(emptyChartData);
  const [pieChartData, setPieChartData] = useState<ChartData<'pie'>>(emptyChartData);
  const [donutChartData, setDonutChartData] = useState<ChartData<'doughnut'>>(emptyChartData);

  // Raw data for CSV export
  const [rawChartData, setRawChartData] = useState<{
    line: LineChartData[],
    bar: BarChartData[],
    pie: PieChartData[],
    donut: DonutChartData[]
  }>({
    line: [],
    bar: [],
    pie: [],
    donut: []
  });

  const { drillDownState, openDrawer, closeDrawer, isOpen } = useChartDrawer();
  const [drillDownChartData, setDrillDownChartData] = useState<ChartData<'bar' | 'line' | 'pie' | 'doughnut'> | null>(null);

  const lineChartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);
  const pieChartRef = useRef<any>(null);
  const donutChartRef = useRef<any>(null);

  const handleCreateGroup = (datas: Dimensions) => {
    setDimensions(datas);
  };

  // Fetch all chart data
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAllChartData({
        body: buildRequestBody(dimensions, 'all')
      }).unwrap();

      if (!result || !result.success) {
        throw new Error(result?.message || "Failed to fetch chart data");
      }

      // Process line chart data
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      if (lineData.length > 0) {
        setLineChartData({
          labels: lineData.map((item: LineChartData) => item.period || ''),
          datasets: [
            {
              label: "Revenue",
              data: lineData.map((item: LineChartData) => item.revenue || 0),
              borderColor: "rgb(75, 192, 192)",
              backgroundColor: "rgba(75, 192, 192, 0.5)",
            },
            {
              label: "grossMargin",
              data: lineData.map((item: LineChartData) => item.grossMargin || 0),
              borderColor: "rgb(53, 162, 235)",
              backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
            {
              label: "netProfit",
              data: lineData.map((item: LineChartData) => item.netProfit || 0),
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.5)",
            }
          ]
        });
      }

      // Process bar chart data
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      if (barData.length > 0) {
        setBarChartData({
          labels: barData.map((item: BarChartData) => item.period || ''),
          datasets: [
            {
              label: "Revenue",
              data: barData.map((item: BarChartData) => item.revenue || 0),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
            {
              label: "Expenses",
              data: barData.map((item: BarChartData) => item.expenses || 0),
              backgroundColor: "rgba(255, 99, 132, 0.6)",
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
            ]
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
            ]
          }]
        });
      }

      // Store raw data for CSV export
      setRawChartData({
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
  };

  const renderDrillDownChart = () => {
    if (!drillDownChartData) return null;

    const chartOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" as const },
        title: {
          display: true,
          text: drillDownState.title
        }
      }
    };

    switch (drillDownState.chartType) {
      case 'line':
        // @ts-ignore
        return <Line options={chartOptions} data={drillDownChartData} />;
      case 'bar':
        // @ts-ignore
        return <Bar options={chartOptions} data={drillDownChartData} />;
      case 'pie':
        // @ts-ignore
        return <Pie options={chartOptions} data={drillDownChartData} />;
      case 'doughnut':
        // @ts-ignore
        return <Doughnut options={{ ...chartOptions, cutout: '50%' }} data={drillDownChartData} />;
      default:
        // @ts-ignore
        return <Bar options={chartOptions} data={drillDownChartData} />;
    }
  };

  const handleDrillDown = async (chartType: string, category: string, dataType: string, value?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchDrillDownData({
        table_name: databaseName,
        chart_type: chartType,
        category: category,
        data_type: dataType,
        value: value || category
      }).unwrap();

      if (result.success && result.data && result.data.length > 0) {
        const drillData = result.data;
        const title = result.title || `${dataType} Breakdown for ${category}`;
        const columns = result.columns || Object.keys(drillData[0]);

        let formattedData: ChartData<'bar' | 'line' | 'pie' | 'doughnut'>;
        let drillChartType: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';

        if (columns.includes('period')) {
          drillChartType = 'line';
          formattedData = {
            labels: drillData.map((d: any) => d.period),
            datasets: [{
              label: 'Value',
              data: drillData.map((d: any) => d.value || 0),
              borderColor: "rgb(75, 192, 192)",
              backgroundColor: "rgba(75, 192, 192, 0.5)"
            }]
          };
        } else if (columns.includes('catfinancialview') || columns.includes('cataccountingview')) {
          drillChartType = 'bar';
          // @ts-ignore
          const labelKey = columns.find(col => col.includes('cat')) || columns[0];
          formattedData = {
            labels: drillData.map((d: any) => d[labelKey]),
            datasets: [{
              label: 'Value',
              data: drillData.map((d: any) => d.value || 0),
              backgroundColor: "rgba(75, 192, 192, 0.6)"
            }]
          };
        } else {
          drillChartType = 'pie';
          // @ts-ignore
          const labelKey = columns.find(key => key !== 'value') || columns[0];
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
  };

  const handleLineChartClick = async (event: any) => {
    if (!lineChartRef.current) return;

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
      const period = lineChartData?.labels?.[index] as string;
      const dataType = lineChartData?.datasets?.[datasetIndex]?.label?.toLowerCase() || '';
      const value = lineChartData?.datasets?.[datasetIndex]?.data?.[index];

      const nativeEvent = event.native || event;

      if (nativeEvent?.ctrlKey || nativeEvent?.metaKey) {
        await handleDrillDown('line', period, dataType, value);
      } else {
        // @ts-ignore
        setDimensions(handleCrossChartFilteringFunc(period));
      }
    } catch (error) {
      console.error("Error in line chart click handler:", error);
    }
  };

  const handleBarChartClick = async (event: any) => {
    if (!barChartRef.current) return;

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
      const period = barChartData?.labels?.[index] as string;
      const dataType = barChartData?.datasets?.[datasetIndex]?.label?.toLowerCase() || '';
      const value = barChartData?.datasets?.[datasetIndex]?.data?.[index];

      await handleDrillDown('bar', period, dataType, value);
    } catch (error) {
      console.error("Error in bar chart click handler:", error);
    }
  };

  const handlePieChartClick = async (event: any) => {
    if (!pieChartRef.current) return;

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
  }, [dimensions]);

  const chartOptions: ChartOptions<'line' | 'bar' | 'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true
      }
    }
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

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Chart.js</h1>

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
            onClick={fetchAllChartDataHanlde}
            className="bg-green-400 hover:bg-green-500"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </ActionButton>
        </div>
      </div>

      {error && (<ErrorAlert message={error} onDismiss={handleDismissError} />)}

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
        {renderDrillDownChart()}
      </ReusableChartDrawer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lineChartData && (
          <ChartContainer title="Revenue Trends with Cross Chart Filter" isLoading={isLoading} chartRef={lineChartRef} data={rawChartData.line}>
            <Line
              ref={lineChartRef}
              // @ts-ignore
              options={{
                ...chartOptions,
                onClick: handleLineChartClick
              }}
              data={lineChartData}
            />
          </ChartContainer>
        )}

        {barChartData && (
          <ChartContainer title="Revenue vs Expenses" isLoading={isLoading} chartRef={barChartRef} data={rawChartData.bar}>
            <Bar
              ref={barChartRef}
              // @ts-ignore
              options={{
                ...chartOptions,
                onClick: handleBarChartClick
              }}
              data={barChartData}
            />
          </ChartContainer>
        )}
        {pieChartData && (
          <ChartContainer title="Financial Distribution" isLoading={isLoading} chartRef={pieChartRef} data={rawChartData.pie}>
            <Pie
              ref={pieChartRef}
              options={{
                ...chartOptions,
                onClick: handlePieChartClick
              }}
              data={pieChartData}
            />
          </ChartContainer>
        )}
        {donutChartData && (
          <ChartContainer title="Revenue by Category" isLoading={isLoading} chartRef={donutChartRef} data={rawChartData.donut}>
            <Doughnut
              ref={donutChartRef}
              options={{
                ...chartOptions,
                cutout: "50%",
                onClick: handleDonutChartClick
              }}
              data={donutChartData}
            />
          </ChartContainer>
        )}
        <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
          <i>Click on any chart element to drill down into more detailed data</i>
        </p>
      </div>
    </section>
  );
}