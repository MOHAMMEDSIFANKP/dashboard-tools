"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";

// Redux + API
import { RootState } from "@/store/store";
import {
  useFetchDrillDownDataMutation,
  databaseName,
  useFetchChartDataMutation,
} from "@/lib/services/usersApi";
import {
  testCase2ProductId,
  useFetchTestCase2ChartDataMutation,
  useFetchTestCase2DrillDownDataMutation,
} from "@/lib/services/testCase2Api";

// Utilities
import {
  buildRequestBody,
} from "@/lib/services/buildWhereClause";
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from "@/lib/testCase2Transformer";

// Types
import {
  BarChartData,
  Dimensions,
  DonutChartData,
  LineChartData,
  PieChartData,
} from "@/types/Schemas";

// UI Components
import { DashboardActionButtonComponent } from "@/components/ui/action-button";
import { ErrorAlert, LoadingAlert } from "@/components/ui/status-alerts";
import { GroupModal } from "@/components/GroupManagement";
import { ChartContextMenu } from "@/components/charts/ChartContextMenu";
import { ChartContainerView } from "@/components/charts/ChartContainerView";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { AGchartcaptureChartScreenshot, formatCurrency } from "@/utils/utils";
import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { ComparisonDrawer } from "@/components/drawer/ChartComparisonDrawer";
import { useChartComparisonDrawer } from "@/hooks/useChartComparisonDrawer";

// Common props for components
interface CommonProps {
  title: string;
  data?: any[];
  onDrillDown?: (type: string, category: string, value: any, dataType: string) => void;
}

// Main AG Charts Page Component
const AgChartsPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [crossChartFilter, setCrossChartFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrillDownLoading, setIsDrillDownLoading] = useState({
    line: false,
    bar: false,
    pie: false,
    donut: false
  });

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
    line: LineChartData[];
    bar: BarChartData[];
    pie: PieChartData[];
    donut: DonutChartData[];
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
    line: AgChartOptions | {},
    bar: AgChartOptions | {},
    pie: AgChartOptions | {},
    donut: AgChartOptions | {},
    drillDown: AgChartOptions | {},
    drillDownType: string | null
  }>({
    line: {},
    bar: {},
    pie: {},
    donut: {},
    drillDown: {},
    drillDownType: null,
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
      // Fetch all chart data
      const result: any = await fetchChartDataByTestCase();
      const Xkey = crossChartFilter ? 'period' : 'fiscalYear';
      // Process line chart data
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      const lineOpts = lineData.length ? {
        title: { text: "Revenue Trends Over Time" },
        subtitle: { text: "Showing financial metrics by Fiscal Year" },
        data: lineData,
        series: [
          {
            type: "line",
            xKey: Xkey,
            yKey: "revenue",
            yName: "Revenue",
            tooltip: { enabled: true },
            fill: '#3B82F6',
            stroke: '#3B82F6',
            strokeWidth: 2,
            highlightStyle: {
              item: {
                fill: '#1E40AF',
                stroke: '#1D4ED8',
                strokeWidth: 3,
                cursor: 'pointer'
              }
            },
            cursor: 'pointer',
          },
          {
            type: "line",
            xKey: Xkey,
            yKey: "grossMargin",
            yName: "Gross Margin",
            tooltip: { enabled: true },
            stroke: '#F59E0B',
            strokeWidth: 2,
            highlightStyle: {
              item: {
                fill: '#D97706',
                stroke: '#B45309',
                strokeWidth: 3,
                cursor: 'pointer'
              }
            },
            cursor: 'pointer',
          },
          {
            type: "line",
            xKey: Xkey,
            yKey: "netProfit",
            yName: "Net Profit",
            tooltip: { enabled: true },
            stroke: '#10B981',
            strokeWidth: 2,
            highlightStyle: {
              item: {
                fill: '#059669',
                stroke: '#047857',
                strokeWidth: 3,
                cursor: 'pointer'
              }
            },
            cursor: 'pointer',
          },
        ],
        axes: [
          { type: "category", position: "bottom", title: { text: Xkey === 'fiscalYear' ? 'Fiscal Year' : 'Period' } },
          {type: "number", position: "left", title: { text: "Amount ($)" }, label: { formatter: (params: any) => formatCurrency(params.value) }, line: { stroke: '#e0e0e0', width: 2}},
        ],
        listeners: {
          // @ts-ignore
          seriesNodeClick: (event) => {
            const { datum, yKey } = event;

            if (datum && datum.fiscalYear) {
              const nativeEvent = event.event;

              setContextMenu({
                isOpen: true,
                position: { x: nativeEvent.clientX, y: nativeEvent.clientY },
                category: datum.fiscalYear,
                value: datum[yKey],
                chartType: 'line',
                dataType: yKey
              });
            }
          },

        }
      } : null;

      // Process bar chart data
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      const barOpts = barData.length ? {
        title: { text: "Revenue vs Expenses" },
        subtitle: { text: "Showing financial metrics by Fiscal Year" },
        data: barData,
        series: [
          {
            type: "bar",
            xKey: Xkey,
            yKey: "revenue",
            yName: "Revenue",
            tooltip: { enabled: true },
          },
          {
            type: "bar",
            xKey: Xkey,
            yKey: "expenses",
            yName: "Expenses",
            tooltip: { enabled: true }
          },
        ],
        axes: [
          { type: 'category', position: 'bottom', title: { text: Xkey === 'fiscalYear' ? 'Fiscal Year' : 'Period' } },
          { type: 'number', position: 'left', title: { text: 'Amount ($)' }, label: { formatter: (params: any) => formatCurrency(params.value) }, line: { stroke: '#e0e0e0', width: 2} },
        ],
        // listeners: {
        //   // @ts-ignore
        //   seriesNodeClick: ({ datum, yKey }) => {
        //     if (datum && datum.fiscalYear) {
        //       handleDrillDown('bar', datum.fiscalYear, datum[yKey], yKey);
        //     }
        //   }
        // }
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
          // tooltip: { enabled: true },
          calloutLabel: { enabled: true },
          sectorLabelKey: 'catfinancialview',
          legendItemKey: 'amount',
          sectorLabel: { enabled: false },
          calloutLabelKey: "catfinancialview",
          tooltip: {
            renderer: (params: any) => {
              return `
              <div class="p-2 bg-white border border-gray-200 rounded shadow">
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3" style="background-color:${params.fill}"></div>
                  <div class="font-semibold">${params.datum['catfinancialview']}</div>
                </div>
                <div>Revenue: ${formatCurrency(params.datum['revenue'])}</div>
              </div>`;
            },
          },
          // listeners: {
          //   // @ts-ignore
          //   nodeClick: (event) => {
          //     const { datum } = event;
          //     if (datum) {
          //       handleDrillDown('pie', datum.catfinancialview, datum.revenue, 'revenue');
          //     }
          //   }
          // }
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
          // tooltip: { enabled: true },
          calloutLabel: { enabled: true },
          sectorLabelKey: 'cataccountingview',
          calloutLabelKey: "cataccountingview",
          tooltip: {
            renderer: (params: any) => {
              return `
              <div class="p-2 bg-white border border-gray-200 rounded shadow">
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3" style="background-color:${params.fill}"></div>
                  <div class="font-semibold">${params.datum['cataccountingview']}</div>
                </div>
                <div>Revenue: ${formatCurrency(params.datum['revenue'])}</div>
              </div>`;
            },
          },
          // listeners: {
          //   // @ts-ignore
          //   nodeClick: (event) => {
          //     const { datum } = event;
          //     if (datum) {
          //       handleDrillDown('donut', datum.cataccountingview, datum.revenue, 'revenue');
          //     }
          //   }
          // }
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
        drillDown: {},
        drillDownType: null
      });

    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch chart data");
      console.log("Error fetching chart data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drill down using API
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
    setIsDrillDownLoading(prev => ({ ...prev, [chartType]: true }));
    setError(null);
    // await new Promise(resolve => setTimeout(resolve, 1200));
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

        // Create chart options based on API response
        let options: AgChartOptions;
        const columns = result.columns || Object.keys(drillData[0]);

        // Determine chart type based on data structure
        if (chartType === 'line' || chartType === 'bar') {
          options = {
            title: { text: title },
            data: drillData,
            series: [{
              type: chartType === 'line' ? 'line' : 'bar',
              // @ts-ignore
              xKey: columns[0],
              yKey: columns[1],
              yName: columns[1],
              tooltip: { enabled: true }
            }],
            axes: [
              { type: 'category', position: 'bottom' },
              { type: 'number', position: 'left', title: { text: 'Value ($)' }, label: { formatter: (params) => formatCurrency(params.value) }, }
            ],
          };
        } else if (chartType === 'pie' || chartType === 'donut') {
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
              { type: 'number', position: 'left', title: { text: 'Value ($)' }, label: { formatter: (params) => formatCurrency(params.value) } }
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
          drillDown: options,
          drillDownType: chartType
        }));

      } else {
        setError("No data available for this selection");
      }
    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch drill-down data");
      console.error("Error in drill-down:", err);
    } finally {
      setIsDrillDownLoading(prev => ({ ...prev, [chartType]: false }));
    }
  };

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartDataHanlde();
  }, [dimensions, testCase, crossChartFilter]);

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
      handleDrillDown(contextMenu.chartType, contextMenu.category, contextMenu.value, contextMenu.dataType);
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleResetDrillDown = useCallback(() => {
    setChartOptions((prev) => ({
      ...prev,
      drillDown: {},
      drillDownType: null,
    }));
  }, []);

  const handleResetCrossChartFilter = useCallback(() => {
    setCrossChartFilter('');
  }, []);

  const handleShareChart = async (
    title: string,
    chartRef: React.RefObject<HTMLDivElement>
  ) => {
    if (!chartRef.current) return;
    try {
      const imageData = await AGchartcaptureChartScreenshot(chartRef);
      handleOpenDrawer(title, imageData);
    } catch (error) {
      console.error('Failed to capture chart:', error);
      setError('Failed to capture chart for sharing');
    }
  };

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Ag Charts</h1>

      {isGroupModalOpen && <GroupModal
        isOpen={isGroupModalOpen}
        onClose={handleCloseModal}
        testCase={testCase}
        // @ts-ignore
        onCreateGroup={handleCreateGroup}
      />}
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
        <ChartContainer title="Revenue Trends"
          chartType="line"
          onComparisonOpen={handleComparisonOpenDrawer}
          isLoading={isLoading || isDrillDownLoading?.line}
          isDrilled={chartOptions?.drillDownType === 'line'}
          resetDrillDown={handleResetDrillDown}
          data={chartOptions?.drillDownType === 'line' ? chartData?.drillDown : chartData.line}
          isCrossChartFiltered={crossChartFilter}
          resetCrossChartFilter={handleResetCrossChartFilter}
          handleShareChart={handleShareChart}
        >
          <AgCharts options={chartOptions?.drillDownType === 'line' ? chartOptions.drillDown : chartOptions.line || {}} />
        </ChartContainer>
        <ChartContainer title="Revenue vs Expenses"
          chartType="bar"
          onComparisonOpen={handleComparisonOpenDrawer}
          isLoading={isLoading || isDrillDownLoading?.bar}
          isDrilled={chartOptions?.drillDownType === 'bar'}
          resetDrillDown={handleResetDrillDown}
          isCrossChartFiltered={crossChartFilter}
          data={chartOptions?.drillDownType === 'bar' ? chartData?.drillDown : chartData.bar}
          handleShareChart={handleShareChart}
        >
          <AgCharts options={chartOptions?.drillDownType === 'bar' ? chartOptions.drillDown : chartOptions.bar || {}} />
        </ChartContainer>
        <ChartContainer title="Financial Distribution"
          chartType="pie"
          onComparisonOpen={handleComparisonOpenDrawer}
          isLoading={isLoading || isDrillDownLoading?.pie}
          isDrilled={chartOptions?.drillDownType === 'pie'}
          resetDrillDown={handleResetDrillDown}
          isCrossChartFiltered={crossChartFilter}
          data={chartOptions?.drillDownType === 'pie' ? chartData?.drillDown : chartData.pie}
          handleShareChart={handleShareChart}
        >
          <AgCharts options={chartOptions?.drillDownType === 'pie' ? chartOptions?.drillDown : chartOptions.pie || {}} />
        </ChartContainer>
        <ChartContainer title="Revenue by Category"
          chartType="donut"
          onComparisonOpen={handleComparisonOpenDrawer}
          isLoading={isLoading || isDrillDownLoading?.donut}
          isDrilled={chartOptions?.drillDownType === 'donut'}
          resetDrillDown={handleResetDrillDown}
          isCrossChartFiltered={crossChartFilter}
          data={chartOptions?.drillDownType === 'donut' ? chartData?.drillDown : chartData.donut}
          handleShareChart={handleShareChart}
        >
          <AgCharts options={chartOptions?.drillDownType === 'donut' ? chartOptions?.drillDown : chartOptions.donut || {}} />
        </ChartContainer>
        {/* <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
          <i>Click on any chart element to drill down into more detailed data</i>
        </p> */}
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
        chartLibrary='ag-charts'
        testCase={testCase}
      />}
    </section>
  );
};

// Chart container component
const ChartContainer: React.FC<CommonProps & {
  children: React.ReactNode;
  isDrilled?: boolean;
  resetDrillDown?: () => void;
  isLoading: boolean;
  isCrossChartFiltered?: string;
  resetCrossChartFilter?: () => void;
  handleShareChart: (title: string, chartRef: React.RefObject<HTMLDivElement>) => void;
  onComparisonOpen: (chartType: string) => void;
  chartType?: string;
}> = ({ title, children, data, isDrilled, resetDrillDown, isLoading, isCrossChartFiltered, resetCrossChartFilter, handleShareChart, onComparisonOpen, chartType }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const hasData = data && data.length > 0;

  // Export to CSV function
  const exportToCSV = () => {
    if (!hasData) return;

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
    if (!hasData) return;
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
    <ChartContainerView
      title={title}
      isDrilled={isDrilled}
      resetDrillDown={resetDrillDown}
      isLoading={isLoading}
      isCrossChartFiltered={isCrossChartFiltered}
      resetCrossChartFilter={resetCrossChartFilter}
      hasData={hasData}
      exportToPNG={exportToPNG}
      exportToCSV={exportToCSV}
      //@ts-ignore
      chartRef={chartRef}
      onShareChart={() => handleShareChart(title, chartRef as React.RefObject<HTMLDivElement>)}
      onComparisonOpen={() => onComparisonOpen(chartType || '')}
    >
      {children}
    </ChartContainerView>
  );
};

export default AgChartsPage;