//src\app\echarts\EChartsPage.tsx
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
import { buildRequestBody } from "@/lib/services/buildWhereClause";
import { DashboardActionButtonComponent } from "@/components/ui/action-button";

import { ErrorAlert } from "@/components/ui/status-alerts";
import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from "@/lib/services/testCase2Api";
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from "@/lib/testCase2Transformer";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ChartContextMenu } from "@/components/charts/ChartContextMenu";
import { ChartContainerView } from "@/components/charts/ChartContainerView";

import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { EChartsCaptureChartScreenshot, formatCurrency } from "@/utils/utils";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { useChartComparisonDrawer } from "@/hooks/useChartComparisonDrawer";
import { ComparisonDrawer } from "@/components/drawer/ChartComparisonDrawer";


// Define TypeScript interfaces for chart data
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  onExportCSV?: () => void;
  onExportPNG?: () => void;
  isDrilled?: boolean;
  resetDrillDown?: () => void;
  isLoading: boolean;
  hasData: boolean;
  isCrossChartFiltered?: string;
  resetCrossChartFilter?: () => void;
  handleShareChart: (title: string, chartRef: React.RefObject<any>) => void;
  onComparisonOpen: (chartType: string) => void;
  chartType?: string;
}

interface LineChartDataPoint {
  period: string;
  fiscalYear: string;
  revenue: number;
  grossMargin: number;
  netProfit: number;
  [string: string]: any;
}

interface BarChartDataPoint {
  period: string;
  fiscalYear: string;
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
  const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartDataPoint[]>([]);
  const [donutChartData, setDonutChartData] = useState<DonutChartDataPoint[]>([]);
  const [drillDownData, setDrillDownData] = useState<any[]>([]);


  // Chart refs for PNG export
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const donutChartRef = useRef(null);

  // Drill down state
  const [drillDownState, setDrillDownState] = useState<{
    isDrilled: boolean;
    chartType: string | null;
    title: string;
  }>({
    isDrilled: false,
    chartType: null,
    title: '',
  });

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    category: string;
    value: any;
    chartType: string;
    dataType: string;
  } | null>(null);

  const fetchChartDataByTestCase = async () => {
    try {
      if (testCase === "test-case-1") {
        const res = await fetchAllChartData({ body: buildRequestBody(dimensions, 'all'), crossChartFilter: crossChartFilter, }).unwrap();
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

  // Fetch all chart data using APIs
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all chart data
      const result: any = await fetchChartDataByTestCase();

      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      setLineChartData(lineData);

      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      setBarChartData(barData);

      const pieData = result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [];
      setPieChartData(pieData);

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
  }, [dimensions, testCase, crossChartFilter]);

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  }

  // Handle drill down using API
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
    // setIsLoading(true);
    // setError(null);

    // try {
    //   const result: any = testCase === "test-case-1"
    //     ? await fetchDrillDownData({
    //       table_name: databaseName,
    //       chart_type: chartType,
    //       category: category,
    //       data_type: dataType,
    //       value: value
    //     }).unwrap()
    //     : transformTestCase2DrillDownData(await fetchTestCase2DrillDownData({
    //       productId: testCase2ProductId,
    //       chartType: chartType,
    //       category: category,
    //       dataType: dataType,
    //       value: value
    //     }).unwrap());

    //   if (result.success && result.data && result.data.length > 0) {
    //     const drillData = result.data;
    //     const title = result.title || `${dataType} Breakdown for ${category}`;

    //     setDrillDownData(drillData);
    //     setDrillDownState({
    //       isDrilled: true,
    //       chartType: chartType,
    //       title: title,
    //     });

    //   } else {
    //     setError("No data available for this selection");
    //   }
    // } catch (err: any) {
    //   setError(err?.data?.detail || err.message || "Failed to fetch drill-down data");
    //   console.error("Error in drill-down:", err);
    // } finally {
    //   setIsLoading(false);
    // }
    return
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

  const handleContextMenuFilter = useCallback(() => {
    if (contextMenu) {
      setCrossChartFilter(contextMenu.category);
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleContextMenuDrillDown = useCallback(() => {
    if (contextMenu) {
      handleDrillDown(contextMenu.chartType, contextMenu.category, contextMenu.value, contextMenu.dataType);
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
    setDrillDownData([]);
  }, []);

  const handleResetCrossChartFilter = useCallback(() => {
    setCrossChartFilter('');
  }, []);

  const handleShareChart = async (
    title: string,
    chartRef: React.RefObject<any>
  ) => {
    try {
      const imageData = await EChartsCaptureChartScreenshot(chartRef);
      handleOpenDrawer(title, imageData);
    } catch (error) {
      console.error('Failed to capture chart:', error);
      setError('Failed to capture chart for sharing');
    }
  };

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">
        Financial Dashboard ECharts
      </h1>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartContainer
          isLoading={isLoading}
          hasData={lineChartData.length > 0}
          title={drillDownState?.chartType === 'line' ? drillDownState?.title : "Revenue Trends with"}
          chartType="line"
          onComparisonOpen={handleComparisonOpenDrawer}
          onExportCSV={() => exportToCSV(drillDownState?.chartType === 'line' ? drillDownData : lineChartData)}
          onExportPNG={() => exportToPNG(lineChartRef)}
          isCrossChartFiltered={crossChartFilter}
          resetCrossChartFilter={handleResetCrossChartFilter}
          isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'line'}
          resetDrillDown={handleResetDrillDown}
          handleShareChart={handleShareChart}
        >
          <LineChartComponent
            data={drillDownState?.chartType === 'line' ? drillDownData : lineChartData}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'line'}
            onDrillDown={(period, value, dataType) => handleDrillDown('line', period, value, dataType)}
            chartRef={lineChartRef}
            setContextMenu={setContextMenu}
            crossChartFilter={!!crossChartFilter}
          />
        </ChartContainer>

        <ChartContainer
          isLoading={isLoading}
          hasData={barChartData.length > 0}
          title={drillDownState?.chartType === 'bar' ? drillDownState?.title : "Revenue vs Expenses"}
          chartType="bar"
          onComparisonOpen={handleComparisonOpenDrawer}
          onExportCSV={() => exportToCSV(drillDownState?.chartType === 'bar' ? drillDownData : barChartData)}
          isCrossChartFiltered={crossChartFilter}
          onExportPNG={() => exportToPNG(barChartRef)}
          isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'bar'}
          resetDrillDown={handleResetDrillDown}
          handleShareChart={handleShareChart}
        >
          <BarChartComponent
            data={drillDownState?.chartType === 'bar' ? drillDownData : barChartData}
            isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'bar'}
            onDrillDown={(period, value, dataType) => handleDrillDown('bar', period, value, dataType)}
            chartRef={barChartRef}
            crossChartFilter={!!crossChartFilter}
          />
        </ChartContainer>

        <ChartContainer
          isLoading={isLoading}
          hasData={pieChartData.length > 0}
          title="Financial Distribution"
          chartType="pie"
          onComparisonOpen={handleComparisonOpenDrawer}
          onExportCSV={() => exportToCSV(drillDownState?.chartType === 'pie' ? drillDownData : pieChartData)}
          onExportPNG={() => exportToPNG(pieChartRef)}
          isCrossChartFiltered={crossChartFilter}
          isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'pie'}
          resetDrillDown={handleResetDrillDown}
          handleShareChart={handleShareChart}
        >
          {drillDownState?.chartType === 'pie' ?
            (<LineDrillDownChartComponents drillDownData={drillDownData} title={drillDownState?.title} chartRef={pieChartRef} />)
            : (<PieChartComponent
              data={pieChartData}
              onDrillDown={(category, value) => handleDrillDown('pie', category, value, 'revenue')}
              chartRef={pieChartRef}
            />)}
        </ChartContainer>

        <ChartContainer
          isLoading={isLoading}
          hasData={donutChartData.length > 0}
          title="Revenue by Category"
          chartType="donut"
          onComparisonOpen={handleComparisonOpenDrawer}
          onExportCSV={() => exportToCSV(drillDownState?.chartType === 'donut' ? drillDownData : donutChartData)}
          onExportPNG={() => exportToPNG(donutChartRef)}
          isCrossChartFiltered={crossChartFilter}
          isDrilled={drillDownState.isDrilled && drillDownState.chartType === 'donut'}
          resetDrillDown={handleResetDrillDown}
          handleShareChart={handleShareChart}
        >
          {drillDownState?.chartType === 'donut' ?
            (<LineDrillDownChartComponents drillDownData={drillDownData} title={drillDownState?.title} chartRef={donutChartRef} />)
            : (<DonutChartComponent
              data={donutChartData}
              onDrillDown={(category, value) => handleDrillDown('donut', category, value, 'revenue')}
              chartRef={donutChartRef}
            />)}

        </ChartContainer>
      </div>

      {/* <p className="col-span-1 md:col-span-2 text-sm text-gray-500 text-center mt-4">
        <i>Click on any chart element to drill down into more detailed data</i>
      </p> */}
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
        chartLibrary='echarts'
        testCase={testCase}
      />}
    </section>
  );
};

export default EChartsPage;

// Chart container component
const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  onExportCSV,
  onExportPNG,
  isDrilled,
  resetDrillDown,
  hasData,
  isLoading,
  isCrossChartFiltered,
  resetCrossChartFilter,
  handleShareChart,
  onComparisonOpen,
  chartType
}) => {
  return (
    <ChartContainerView
      title={title}
      isDrilled={isDrilled}
      resetDrillDown={resetDrillDown}
      isLoading={isLoading}
      isCrossChartFiltered={isCrossChartFiltered}
      resetCrossChartFilter={resetCrossChartFilter}
      exportToCSV={onExportCSV}
      exportToPNG={onExportPNG}
      hasData={hasData}
      onComparisonOpen={() => onComparisonOpen(chartType || '')}
      onShareChart={() => {
        // Get the chartRef from the child component
        const childElement = React.Children.only(children) as React.ReactElement;
        //@ts-ignore
        const chartRef = childElement.props.chartRef;
        handleShareChart(title, chartRef);
      }}
      className="h-64"
    >
      {children}
    </ChartContainerView>
  );
};


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

// Drill Down Chart Component (using for pie and donut drill-downs)
const LineDrillDownChartComponents: React.FC<{
  drillDownData: any[];
  title: string;
  chartRef: React.RefObject<any>;

}> = ({ drillDownData, title, chartRef }) => {
  const option = {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        return `${params[0].axisValue}<br/>Value: ${formatCurrency(params[0].value)}`;
      }
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
        formatter: (value: number) => formatCurrency(value)
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

  return (
    <div className="mb-4">
      <ReactECharts
        option={option}
        ref={chartRef}
      />
    </div>
  );
};

const LineChartComponent = ({
  data,
  onDrillDown,
  isDrilled,
  chartRef,
  setContextMenu,
  crossChartFilter,
}: {
  data: LineChartDataPoint[],
  onDrillDown: (period: string, value: number, dataType: string) => void,
  isDrilled: boolean,
  chartRef: React.RefObject<any>,
  setContextMenu: React.Dispatch<React.SetStateAction<any>>;
  crossChartFilter?: boolean;
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  const xAxis = crossChartFilter || isDrilled ? 'period' : 'fiscalYear';

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        return `
      ${params[0].axisValue}<br/>
      ${params[0].seriesName}: ${params[0].value ? formatCurrency(params[0].value) : ""}<br/>
      ${params[1].seriesName}: ${params[1].value ? formatCurrency(params[1].value) : ""}<br/>
      ${params[2].seriesName}: ${params[2].value ? formatCurrency(params[2].value) : ""}
    `;
      }
    },

    legend: {
      data: ['Revenue', 'Gross Margin', 'Net Profit'],
      textStyle: { fontSize: 10 }
    },
    grid: {
      left: '6%',
      right: '0%',
      bottom: '4%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item[xAxis]),
      name: xAxis === 'period' ? 'Period' : 'Fiscal Year',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: 'Amount ($)',
      nameLocation: 'middle',
      nameGap: 55,
      axisLabel: {
        formatter: (value: number) => formatCurrency(value)
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: 'gray',
          width: 2,
        }
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
        data: data.map(item => item.grossMargin || item.grossmargin),
        itemStyle: { color: '#36a2eb' }
      },
      {
        name: 'Net Profit',
        type: 'line',
        smooth: true,
        data: data.map(item => item.netProfit || item.netprofit),
        itemStyle: { color: '#ff6384' }
      }
    ]
  };

  const onChartClick = (params: any) => {
    if (isDrilled) return;
    let { name, seriesName, value, event } = params;
    let dataType = 'revenue';
    if (seriesName === 'Gross Margin') dataType = 'grossMargin';
    if (seriesName === 'Net Profit') dataType = 'netProfit';
    if (crossChartFilter) {
      name = name.slice(0, 4)
    }
    setContextMenu({
      isOpen: true,
      position: { x: event?.event?.clientX, y: event?.event?.clientY },
      category: name,
      value: value,
      chartType: 'line',
      dataType: dataType
    });
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
  chartRef,
  crossChartFilter = false,
  isDrilled = false
}: {
  data: BarChartDataPoint[],
  onDrillDown: (period: string, value: number, dataType: string) => void,
  chartRef: React.RefObject<any>,
  crossChartFilter?: boolean,
  isDrilled?: boolean
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  const xAxis: "period" | "fiscalYear" = crossChartFilter || isDrilled ? 'period' : 'fiscalYear';

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        return `
      ${params[0].axisValue}<br/>
      ${params[0].seriesName}: ${params[0].value ? formatCurrency(params[0].value) : ""}<br/>
      ${params[1].seriesName}: ${params[1].value ? formatCurrency(params[1].value) : ""}
    `;
      }
    },
    legend: {
      data: ['Revenue', 'Expenses'],
      textStyle: { fontSize: 10 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '4%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      name: xAxis === 'period' ? 'Period' : 'Fiscal Year',
      nameLocation: 'middle',
      nameGap: 30,
      data: data.map(item => item[xAxis]),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: 'Amount ($)',
      nameLocation: 'middle',
      nameGap: 55,
      axisLabel: {
        formatter: (value: number) => formatCurrency(value)
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: 'gray',
          width: 2,
        }
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
    if (isDrilled) return;
    let { name, seriesName, value } = params;
    const dataType = seriesName === 'Revenue' ? 'revenue' : 'expenses';
    if (crossChartFilter) {
      name = name.slice(0, 4)
    }
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
      formatter: (params: any) => {
        return `
      ${params.name}<br/>
      Value: ${formatCurrency(params.value)}<br/>
      Percentage: ${params.percent}%
    `;
      }
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
      formatter: (params: any) => {
        return `
      ${params.name}<br/>
      Value: ${formatCurrency(params.value)}<br/>
      Percentage: ${params.percent}%
    `;
      }
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