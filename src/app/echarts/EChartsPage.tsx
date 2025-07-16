"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { GroupModal } from "../../components/GroupManagement";
import {
  useFetchChartDataMutation,
  useFetchDrillDownDataMutation,
  databaseName
} from "@/lib/services/usersApi";
// Types
import { Dimensions } from "@/types/Schemas";
import { buildRequestBody, handleCrossChartFilteringFunc } from "@/lib/services/buildWhereClause";
import { ActionButton } from "@/components/ui/action-button";
import { ChartSkelten } from "@/components/ui/ChartSkelten";

import { useChartDrawer } from "@/components/ChartDrawer";
import ReusableChartDrawer from "@/components/ChartDrawer";
import { ErrorAlert } from "@/components/ui/status-alerts";
import DashboardInfoCard from "@/components/DashboardInfoCard";
import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from "@/lib/services/testCase2Api";
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from "@/lib/testCase2Transformer";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";


// Define TypeScript interfaces for chart data
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  onExportCSV?: () => void;
  onExportPNG?: () => void;
  isDrilled?: boolean;
  onBack?: () => void;
  isLoading?: boolean;
  hasData?: number;
}

interface LineChartDataPoint {
  period: string;
  revenue: number;
  grossMargin: number;
  netProfit: number;
}

interface BarChartDataPoint {
  period: string;
  revenue: number;
  expenses: number;
}

interface PieChartDataPoint {
  catfinancialview: string;
  revenue: number;
}

interface DonutChartDataPoint {
  cataccountingview: string;
  revenue: number;
}

// Drill-down state interface
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
  dataType: string;
}

const EChartsPage = () => {
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
  const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartDataPoint[]>([]);
  const [donutChartData, setDonutChartData] = useState<DonutChartDataPoint[]>([]);
  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<string>('');

  // Chart refs for PNG export
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const drillDownChartRef = useRef(null);

  // Drill down state
  const { drillDownState, openDrawer, closeDrawer, isOpen } = useChartDrawer();

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

  // Fetch all chart data using APIs
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all chart data
      const result: any = await fetchChartDataByTestCase();

      // Process line chart data
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      setLineChartData(lineData);

      // Process bar chart data - transform to include expenses
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      const transformedBarData = barData.map((item: any) => ({
        period: item.period,
        revenue: item.revenue,
        expenses: item.expenses
      }));
      setBarChartData(transformedBarData);

      // Process pie chart data - use actual API data instead of dummy
      const pieData = result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [];
      setPieChartData(pieData);

      // Process donut chart data
      const donutData = result?.charts?.donut?.success ? result?.charts?.donut?.data || [] : [];

      setDonutChartData(donutData);

    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch chart data");
      console.error("Error fetching chart data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartDataHanlde();
  }, [dimensions, testCase]);

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  }

  // Handle drill down using API
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
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

        setDrillDownData(drillData);
        openDrawer({
          chartType,
          category,
          title,
          dataType
        });
        setSelectedChartType(chartType);

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

  // Export to CSV function
  const exportToCSV = (data: any[]) => {
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

  // if (error) {
  //   return (
  //     <div className="flex justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
  //       <p>{error}</p>
  //       <p onClick={() => setError('')} className="cursor-pointer">x</p>
  //     </div>
  //   );
  // }

  // Event handlers
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

  const dashboardInfoDatas = {
    apiEndpoints: [
      { testCase: "test-case-1", method: "POST", apiName: "api/dashboard/all-charts?table_name=sample_1m", api: "https://testcase.mohammedsifankp.online/api/dashboard/all-charts?table_name=sample_1m", description: "Fetch all chart data for the dashboard" },
      { testCase: "test-case-1", method: "POST", apiName: "api/dashboard/drill-down?table_name=sample_1m&chart_type=bar&category=201907&data_type=revenue&value=4299212962.550013", api: "https://testcase.mohammedsifankp.online/api/dashboard/drill-down?table_name=sample_1m&chart_type=bar&category=201907&data_type=revenue&value=4299212962.550013", description: "Fetch Drill Down datas" },
      { testCase: "test-case-1", method: "GET", apiName: "api/dashboard/tables/sample_1m/dimensions", api: "https://testcase.mohammedsifankp.online/api/dashboard/tables/sample_1m/dimensions", description: "Fetch dimensions for the dashboard" },

      { testCase: "test-case-2", method: "POST", apiName: "api/dashboard/all-charts?product_id=sample_100k_product_v1&exclude_null_revenue=false", api: "https://testcase2.mohammedsifankp.online/api/dashboard/all-charts?product_id=sample_100k_product_v1&exclude_null_revenue=false", description: "Fetch all chart data for the dashboard" },
      { testCase: "test-case-2", method: "POST", apiName: "api/dashboard/drill-down?product_id=sample_100k_product_v1&chart_type=line&category=202010&data_type=revenue&drill_down_level=detailed&include_reference_context=true&exclude_null_revenue=false", api: "https://testcase2.mohammedsifankp.online/api/dashboard/drill-down?product_id=sample_100k_product_v1&chart_type=line&category=202010&data_type=revenue&drill_down_level=detailed&include_reference_context=true&exclude_null_revenue=false", description: "Fetch Drill Down datas" },
      { testCase: "test-case-2", method: "GET", apiName: "api/dashboard/tables/sample_100k_product_v1/dimensions?include_reference_tables=true", api: "https://testcase2.mohammedsifankp.online/api/dashboard/tables/sample_100k_product_v1/dimensions?include_reference_tables=false", description: "Fetch dimensions for the dashboard" },
    ],
    availableFeatures: [
      { feature: "Drill Down", supported: true },
      { feature: "Cross-Chart Filtering (Need Manual setup)", supported: false },
      { feature: "Interactive Charts", supported: true },
      { feature: "Legend Toggle", supported: true },
      { feature: "Export Options (PNG) - (CSV Need Manual setup)", supported: true },
      { feature: "Real-time Data Support (Need Manual setup)", supported: false },
      { feature: "Custom Options", supported: true },
      { feature: "TypeScript Support", supported: true },
      { feature: "Open Source", supported: true },
      { feature: "Drag and Drop (Need Custom Code not default)", supported: false },
    ],
     dataRecords: {
      "test-case-1": "1,000,000 Records",
      "test-case-2": "Records"
    }
  }

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">
        Financial Dashboard ECharts
      </h1>

      <DashboardInfoCard
        apiEndpoints={dashboardInfoDatas?.apiEndpoints}
        availableFeatures={dashboardInfoDatas?.availableFeatures}
        dataRecords={dashboardInfoDatas?.dataRecords}
      />

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
        onBack={closeDrawer}
        isLoading={isLoading}
        showBackButton={true}
        showCloseButton={true}
      >
        {drillDownData.length > 0 && (
          <DrillDownChart
            drillDownState={drillDownState}
            drillDownData={drillDownData}
            onBack={closeDrawer}
            chartRef={drillDownChartRef}
            selectedChartType={selectedChartType}
          />
        )}
      </ReusableChartDrawer>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartContainer
          isLoading={isLoading}
          hasData={lineChartData.length}
          title="Revenue Trends with ( Click: Cross Chart Filter | Ctrl+Click: Drill Down )"
          onExportCSV={() => exportToCSV(lineChartData)}
          onExportPNG={() => exportToPNG(lineChartRef)}
        >
          <LineChartComponent
            data={lineChartData}
            onDrillDown={(period, value, dataType) => handleDrillDown('line', period, value, dataType)}
            chartRef={lineChartRef}
            setDimensions={setDimensions}
          />
        </ChartContainer>

        <ChartContainer
          isLoading={isLoading}
          hasData={barChartData.length}
          title="Revenue vs Expenses"
          onExportCSV={() => exportToCSV(barChartData)}
          onExportPNG={() => exportToPNG(barChartRef)}
        >
          <BarChartComponent
            data={barChartData}
            onDrillDown={(period, value, dataType) => handleDrillDown('bar', period, value, dataType)}
            chartRef={barChartRef}
          />
        </ChartContainer>

        <ChartContainer
          isLoading={isLoading}
          hasData={pieChartData.length}
          title="Financial Distribution"
          onExportCSV={() => exportToCSV(pieChartData)}
          onExportPNG={() => exportToPNG(pieChartRef)}
        >
          <PieChartComponent
            data={pieChartData}
            onDrillDown={(category, value) => handleDrillDown('pie', category, value, 'revenue')}
            chartRef={pieChartRef}
          />
        </ChartContainer>

        <ChartContainer
          isLoading={isLoading}
          hasData={donutChartData.length}
          title="Revenue by Category"
          onExportCSV={() => exportToCSV(donutChartData)}
          onExportPNG={() => exportToPNG(donutChartRef)}
        >
          <DonutChartComponent
            data={donutChartData}
            onDrillDown={(category, value) => handleDrillDown('donut', category, value, 'revenue')}
            chartRef={donutChartRef}
          />
        </ChartContainer>
      </div>

      <p className="col-span-1 md:col-span-2 text-sm text-gray-500 text-center mt-4">
        <i>Click on any chart element to drill down into more detailed data</i>
      </p>
    </section>
  );
};

export default EChartsPage;

// Chart container component
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, onExportCSV, onExportPNG, isDrilled, onBack, hasData, isLoading }) => (

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
            {onExportPNG && <button
              onClick={onExportPNG}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              PNG
            </button>}
            {onExportCSV && <button
              onClick={onExportCSV}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              CSV
            </button>}
          </div>
        </div>
        <div className="h-64">{children}</div>
      </>
    ) : (
      <ChartSkelten />
    )}
  </div>
);

const exportToPNG = (chartRef: any) => {
  if (!chartRef || !chartRef.current || !chartRef.current.getEchartsInstance) return;

  try {
    const echartInstance = chartRef.current.getEchartsInstance();
    const dataURL = echartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    });

    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export chart:", err);
    alert("Could not export chart as PNG. Please try again.");
  }
};

// Drill Down Chart Component
const DrillDownChart: React.FC<{
  drillDownState: any;
  drillDownData: any[];
  onBack: () => void;
  chartRef: React.RefObject<any>;
  selectedChartType?: string;
}> = ({ drillDownState, drillDownData, onBack, chartRef, selectedChartType }) => {
  const { title } = drillDownState;

  // Determine chart type based on data structure
  const firstDataPoint = drillDownData[0];
  const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];

  let option: any = {};

  if (selectedChartType === 'line' || selectedChartType === 'bar') {
    // Bar chart for financial view breakdown
    const categoryKey = dataKeys.includes('catfinancialview') ? 'catfinancialview' : 'catFinancialView';
    option = {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}: ${c}'
      },
      xAxis: {
        type: 'category',
        data: drillDownData.map(item => item[categoryKey]),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '${value}'
        }
      },
      series: [
        {
          type: 'bar',
          data: drillDownData.map(item => item.value),
          itemStyle: { color: '#4bc0c0' }
        }
      ]
    };
  } else if (dataKeys.includes('period')) {
    // Line chart for period data
    option = {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: ${c}'
      },
      xAxis: {
        type: 'category',
        data: drillDownData.map(item => item.period),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '${value}'
        }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: drillDownData.map(item => item.value),
          itemStyle: { color: '#36a2eb' }
        }
      ]
    };
  } else {
    // Pie chart for other breakdowns
    const labelKey = dataKeys.find(key => key !== 'value') || dataKeys[0];
    option = {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ${c} ({d}%)'
      },
      series: [
        {
          type: 'pie',
          radius: '70%',
          data: drillDownData.map(item => ({
            name: item[labelKey],
            value: item.value
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            fontSize: 10
          }
        }
      ]
    };
  }

  return (
    <div className="mb-4">
      <ReactECharts
        option={option}
        style={{ height: '400px', width: '100%' }} // Set explicit height
        ref={chartRef}
      />

    </div>
  );
};

const LineChartComponent = ({
  data,
  onDrillDown,
  chartRef,
  setDimensions,
}: {
  data: LineChartDataPoint[],
  onDrillDown: (period: string, value: number, dataType: string) => void,
  chartRef: React.RefObject<any>,
  setDimensions: React.Dispatch<React.SetStateAction<any>>;
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a0}: ${c0}<br/>{a1}: ${c1}<br/>{a2}: ${c2}'
    },
    legend: {
      data: ['Revenue', 'Gross Margin', 'Net Profit'],
      textStyle: { fontSize: 10 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.period),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '${value}'
      }
    },
    series: [
      {
        name: 'Revenue',
        type: 'line',
        smooth: true,
        data: data.map(item => item.revenue),
        itemStyle: { color: '#4bc0c0' }
      },
      {
        name: 'Gross Margin',
        type: 'line',
        smooth: true,
        data: data.map(item => item.grossMargin),
        itemStyle: { color: '#36a2eb' }
      },
      {
        name: 'Net Profit',
        type: 'line',
        smooth: true,
        data: data.map(item => item.netProfit),
        itemStyle: { color: '#ff6384' }
      }
    ]
  };

  const onChartClick = (params: any) => {
    const { name, seriesName, value, event } = params;

    let dataType = 'revenue';
    if (seriesName === 'Gross Margin') dataType = 'grossMargin';
    if (seriesName === 'Net Profit') dataType = 'netProfit';
    if (event?.event?.ctrlKey || event?.event?.metaKey) {
      onDrillDown(name, value, dataType);
    } else {
      // @ts-ignore
      setDimensions(handleCrossChartFilteringFunc(name));
    }

  };

  const onEvents = {
    'click': onChartClick,
  };

  return <ReactECharts
    option={option}
    style={{ height: '100%' }}
    onEvents={onEvents}
    ref={chartRef}
  />;
};

const BarChartComponent = ({
  data,
  onDrillDown,
  chartRef
}: {
  data: BarChartDataPoint[],
  onDrillDown: (period: string, value: number, dataType: string) => void,
  chartRef: React.RefObject<any>
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>{a0}: ${c0}<br/>{a1}: ${c1}'
    },
    legend: {
      data: ['Revenue', 'Expenses'],
      textStyle: { fontSize: 10 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.period),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '${value}'
      }
    },
    series: [
      {
        name: 'Revenue',
        type: 'bar',
        data: data.map(item => item.revenue),
        itemStyle: { color: '#4bc0c0' }
      },
      {
        name: 'Expenses',
        type: 'bar',
        data: data.map(item => item.expenses),
        itemStyle: { color: '#ff6384' }
      }
    ]
  };

  const onChartClick = (params: any) => {
    const { name, seriesName, value } = params;
    const dataType = seriesName === 'Revenue' ? 'revenue' : 'expenses';
    onDrillDown(name, value, dataType);
  };

  const onEvents = {
    'click': onChartClick
  };

  return <ReactECharts
    option={option}
    style={{ height: '100%' }}
    onEvents={onEvents}
    ref={chartRef}
  />;
};

const PieChartComponent = ({
  data,
  onDrillDown,
  chartRef
}: {
  data: PieChartDataPoint[],
  onDrillDown: (category: string, value: number) => void,
  chartRef: React.RefObject<any>
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ${c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 'bottom',
      textStyle: { fontSize: 10 }
    },
    series: [
      {
        name: 'Financial Distribution',
        type: 'pie',
        radius: '70%',
        data: data.map(item => ({
          name: item.catfinancialview,
          value: item.revenue
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          fontSize: 10
        },
        color: ['#4bc0c0', '#ff6384', '#36a2eb', '#ffce56', '#9966ff', '#ff9f40']
      }
    ]
  };

  const onChartClick = (params: any) => {
    const { name, value } = params.data;
    onDrillDown(name, value);
  };

  const onEvents = {
    'click': onChartClick
  };

  return <ReactECharts
    option={option}
    style={{ height: '100%' }}
    onEvents={onEvents}
    ref={chartRef}
  />;
};

const DonutChartComponent = ({
  data,
  onDrillDown,
  chartRef
}: {
  data: DonutChartDataPoint[],
  onDrillDown: (category: string, value: number) => void,
  chartRef: React.RefObject<any>
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  // Limit to top 6 categories for better visibility
  const topCategories = data.slice(0, 6);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ${c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 'bottom',
      textStyle: { fontSize: 9 }
    },
    series: [
      {
        name: 'Revenue by Category',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          fontSize: 9
        },
        data: topCategories.map(item => ({
          name: item.cataccountingview,
          value: item.revenue
        })),
        color: [
          '#ffce56', '#4bc0c0', '#9966ff',
          '#ff9f40', '#36a2eb', '#ff6384'
        ]
      }
    ]
  };

  const onChartClick = (params: any) => {
    const { name, value } = params.data;
    onDrillDown(name, value);
  };

  const onEvents = {
    'click': onChartClick
  };

  return <ReactECharts
    option={option}
    style={{ height: '100%' }}
    onEvents={onEvents}
    ref={chartRef}
  />;
};