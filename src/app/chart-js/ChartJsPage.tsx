"use client";
import React, { useState, useEffect, useRef, forwardRef } from "react";
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

// Interface for drill-down state
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
  dataType?: string;
}

interface ChartContainerProps {
  title: string;
  chartRef: React.RefObject<any>;
  data: any;
  onChartClick?: (event: any) => void;
  children: React.ReactNode;
  isDrilled?: boolean;
  onBack?: () => void;
}

const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ title, chartRef, data, onChartClick, children, isDrilled, onBack }, ref) => {
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
          <div className="flex gap-2 mb-4">
            <button onClick={handleDownloadImage} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              PNG
            </button>
            <button onClick={handleDownloadCSV} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              CSV
            </button>
          </div>
        </div>
        <div className="h-64">{children}</div>
      </div>
    );
  }
);

ChartContainer.displayName = "ChartContainer";

// Drill Down Chart Component
const DrillDownChart: React.FC<{
  drillDownState: DrillDownState;
  drillDownData: ChartData<'bar' | 'line' | 'pie' | 'doughnut'>;
  onBack: () => void;
}> = ({ drillDownState, drillDownData, onBack }) => {
  const drillChartRef = useRef<any>(null);

  const chartOptions: ChartOptions<'line' | 'bar' | 'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: "top" },
      title: {
        display: true,
        text: drillDownState.title
      }
    }
  };

  // Render appropriate chart type based on drill-down data
  const renderDrillDownChart = () => {
    switch (drillDownState.chartType) {
      case 'line':
         // @ts-ignore
        return <Line ref={drillChartRef} options={chartOptions} data={drillDownData} />;
      case 'bar':
         // @ts-ignore
        return <Bar ref={drillChartRef} options={chartOptions} data={drillDownData} />;
      case 'pie':
         // @ts-ignore
        return <Pie ref={drillChartRef} options={chartOptions} data={drillDownData} />;
      case 'donut':
         // @ts-ignore
        return <Doughnut ref={drillChartRef} options={{...chartOptions, cutout: '50%'}} data={drillDownData} />;
      default:
         // @ts-ignore
        return <Bar ref={drillChartRef} options={chartOptions} data={drillDownData} />;
    }
  };

  return (
    <div className="mb-4">
      <ChartContainer 
        title={drillDownState.title} 
        chartRef={drillChartRef} 
        data={drillDownData}
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
};

export default function ChartJsPage() {
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
  const [lineChartData, setLineChartData] = useState<ChartData<'line'> | null>(null);
  const [barChartData, setBarChartData] = useState<ChartData<'bar'> | null>(null);
  const [pieChartData, setPieChartData] = useState<ChartData<'pie'> | null>(null);
  const [donutChartData, setDonutChartData] = useState<ChartData<'doughnut'> | null>(null);

  // Raw data for CSV export
  const [rawChartData, setRawChartData] = useState<{
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

  // Drill down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });
  const [drillDownData, setDrillDownData] = useState<ChartData<'bar' | 'line' | 'pie' | 'doughnut'> | null>(null);

  const lineChartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);
  const pieChartRef = useRef<any>(null);
  const donutChartRef = useRef<any>(null);

  // Reset drill down state
  const resetDrillDown = () => {
    setDrillDown({
      active: false,
      chartType: "",
      category: "",
      title: ""
    });
    setDrillDownData(null);
  };

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  };


  // Fetch all chart data
  const fetchAllChartData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch line chart data
      const lineResult = await fetchLineChartData({
        body: buildRequestBody(dimensions,'line', 'period')
      }).unwrap();

      // Fetch bar chart data
      const barResult = await fetchBarChartData({
        body: buildRequestBody(dimensions,'bar', 'period')
      }).unwrap();

      // Fetch pie chart data
      const pieResult = await fetchPieChartData({
        body: buildRequestBody(dimensions,'pie', 'catfinancialview')
      }).unwrap();

      // Fetch donut chart data
      const donutResult = await fetchDonutChartData({
        body: buildRequestBody(dimensions,'donut', 'cataccountingview')
      }).unwrap();

      // Process line chart data
      const lineData = lineResult.success ? lineResult.data || [] : [];
      if (lineData.length > 0) {
        setLineChartData({
          labels: lineData.map((item: ChartDataPoint) => item.period || ''),
          datasets: [
            {
              label: "Revenue",
              data: lineData.map((item: ChartDataPoint) => item.revenue || 0),
              borderColor: "rgb(75, 192, 192)",
              backgroundColor: "rgba(75, 192, 192, 0.5)",
            },
            {
              label: "grossMargin",
              data: lineData.map((item: ChartDataPoint) => item.grossMargin || 0),
              borderColor: "rgb(53, 162, 235)",
              backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
            {
              label: "netProfit",
              data: lineData.map((item: ChartDataPoint) => item.netProfit || 0),
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.5)",
            }
          ]
        });
      }

      // Process bar chart data
      const barData = barResult.success ? barResult.data || [] : [];
      if (barData.length > 0) {
        setBarChartData({
          labels: barData.map((item: ChartDataPoint) => item.period || ''),
          datasets: [
            {
              label: "Revenue",
              data: barData.map((item: ChartDataPoint) => item.revenue || 0),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
            {
              label: "Expenses",
              data: barData.map((item: ChartDataPoint) => item.expenses || 0),
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            }
          ]
        });
      }

      // Process pie chart data
      const pieData = pieResult.success ? pieResult.data || [] : [];
      if (pieData.length > 0) {
        console.log("Pie Data:", pieData);
        setPieChartData({
          labels: pieData.map((item: ChartDataPoint) => item.catfinancialview),
          datasets: [{
            data: pieData.map((item: ChartDataPoint) => item.revenue || item.value || 0),
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
      const donutData = donutResult.success ? donutResult.data || [] : [];
      if (donutData.length > 0) {
        setDonutChartData({
          labels: donutData.map((item: ChartDataPoint) => item.cataccountingview),
          datasets: [{
            data: donutData.map((item: ChartDataPoint) => item.revenue || item.value || 0),
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

  // Generic drill down function using API
  const handleDrillDown = async (chartType: string, category: string, dataType: string, value?: any) => {
    setIsLoading(true);
    setError(null);
    console.log("Drill down triggered:", chartType, category, dataType, value);
    
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

        // Convert API response to Chart.js format
        let formattedData: ChartData<'bar' | 'line' | 'pie' | 'doughnut'>;
        let drillChartType: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';

        // Determine chart type and format data based on API response structure
        if (columns.includes('period')) {
          // Time series data - use line chart
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
          // Category data - use bar chart
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
          // Default to pie chart for other data
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

        // Set drill-down data and state
        setDrillDownData(formattedData);
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
  };

  // Handle drill down for line chart
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
      
      await handleDrillDown('line', period, dataType, value);
    } catch (error) {
      console.error("Error in line chart click handler:", error);
    }
  };

  // Handle drill down for bar chart
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

  // Handle drill down for pie chart
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

  // Handle drill down for donut chart
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
    fetchAllChartData();
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

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Chart.js</h1>
      
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
      
      {isLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p>Loading chart data...</p>
        </div>
      )}

      {drillDown.active && drillDownData ? (
        <DrillDownChart 
          drillDownState={drillDown} 
          drillDownData={drillDownData} 
          onBack={resetDrillDown} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lineChartData && (
            <ChartContainer title="Revenue Trends" chartRef={lineChartRef} data={rawChartData.line}>
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
            <ChartContainer title="Revenue vs Expenses" chartRef={barChartRef} data={rawChartData.bar}>
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
            <ChartContainer title="Financial Distribution" chartRef={pieChartRef} data={rawChartData.pie}>
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
            <ChartContainer title="Revenue by Category" chartRef={donutChartRef} data={rawChartData.donut}>
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
      )}
    </section>
  );
}