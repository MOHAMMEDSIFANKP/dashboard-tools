"use client";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryLegend,
  VictoryGroup,
  VictoryBar,
  VictoryAxis,
  VictoryPie,
  VictoryTooltip,
  VictoryScatter,
  EventPropTypeInterface,
  VictoryLegendTTargetType,
  StringOrNumberOrCallback
} from "victory";
import { GroupModal } from "../../components/GroupManagement";
import {
  useFetchChartDataMutation,
  useFetchDrillDownDataMutation,
  databaseName
} from "@/lib/services/usersApi";
import { Dimensions } from "@/types/Schemas";
import { buildRequestBody } from "@/lib/services/buildWhereClause";
import { DashboardActionButtonComponent } from "@/components/ui/action-button";
import { ErrorAlert } from "@/components/ui/status-alerts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from "@/lib/services/testCase2Api";
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from "@/lib/testCase2Transformer";
import { ChartContextMenu } from "@/components/charts/ChartContextMenu";
import { ChartContainerView } from "@/components/charts/ChartContainerView";
import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { VictoryCaptureChartScreenshot } from "@/utils/utils";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";


// Core data types
interface ChartDataPoint {
  period?: string;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
  catAccountingView?: string;
  catfinancialview?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

// Chart data interface
interface ChartData {
  line: ChartDataPoint[];
  bar: ChartDataPoint[];
  pie: ChartDataPoint[];
  donut: ChartDataPoint[];
  drillDown: any[];
}

// Update the VictoryLegendProps interface to use the imported type
interface VictoryLegendProps {
  x?: number;
  y?: number;
  orientation?: "horizontal" | "vertical";
  gutter?: number;
  style?: {
    labels?: {
      fontSize?: number;
      cursor?: string;
    };
    data?: {
      cursor?: string;
    };
  };
  data: LegendDataItem[];
  events?: {
    target: VictoryLegendTTargetType;
    eventHandlers: {
      onClick: (event: any, props: { datum: any }) => any;
    };
  }[];
  height?: number;
  itemsPerRow?: number;
}

interface VisibleLineSeries {
  revenue: boolean;
  grossMargin: boolean;
  netProfit: boolean;
}

interface VisibleSeries {
  revenue: boolean;
  expenses: boolean;
}

// Chart Container with Export functionality
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  resetDrillDown?: () => void;
  isDrilled?: boolean;
  data?: any[];
  isLoading: boolean;
  isCrossChartFiltered?: string;
  resetCrossChartFilter?: () => void;
  handleShareChart: (title: string, chartRef: React.RefObject<HTMLDivElement>) => void;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, resetDrillDown, isDrilled, data, isLoading, isCrossChartFiltered, resetCrossChartFilter, handleShareChart }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const hasData = data && data.length > 0;

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
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PNG export function
  const exportToPNG = () => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    const svg = chartElement.querySelector('svg');

    if (svg) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();

        const svgRect = svg.getBoundingClientRect();
        canvas.width = svgRect.width;
        canvas.height = svgRect.height;

        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const DOMURL = window.URL || window.webkitURL || window;
        const url = DOMURL.createObjectURL(svgBlob);

        img.onload = function () {
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);

            const imgURI = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');

            const link = document.createElement('a');
            link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.png`;
            link.href = imgURI;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };

        img.src = url;
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
      isLoading={isLoading}
      isDrilled={isDrilled}
      resetDrillDown={resetDrillDown}
      exportToPNG={exportToPNG}
      exportToCSV={exportToCSV}
      // @ts-ignore
      chartRef={chartRef}
      hasData={hasData}
      isCrossChartFiltered={isCrossChartFiltered}
      resetCrossChartFilter={resetCrossChartFilter}
      onShareChart={() => handleShareChart(title, chartRef as React.RefObject<HTMLDivElement>)}
      className="w-full"
    >
      {children}
    </ChartContainerView>
  );
};

// Main Component
const VictoryChartsPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [crossChartFilter, setCrossChartFilter] = useState<string>('');

  const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();
  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

  // Test Case 1 API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation()
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();

  // Test Case 2 API Mutations
  const [FetchTestCase2AllChartData] = useFetchTestCase2ChartDataMutation();
  const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();

  // Chart data state
  const [chartData, setChartData] = useState<ChartData>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: [],
  });

  const [drillDownState, setDrillDownState] = useState<{
    isDrilled: boolean;
    chartType: string | null;
    title: string;
  }>({
    isDrilled: false,
    chartType: null,
    title: ''
  });

  // Drill down state
  // const { drillDownState, openDrawer, closeDrawer, isOpen } = useChartDrawer();

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    category: string;
    value: any;
    chartType: string;
    dataType: string;
  } | null>(null);

  const handleCreateGroup = (datas: any) => {
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

  // Fetch all chart data using API
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch line chart data
      const result: any = await fetchChartDataByTestCase();

      // Process and set chart data
      setChartData({
        line: result?.charts?.line?.success ? result?.charts?.line?.data || [] : [],
        bar: result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [],
        pie: result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [],
        donut: result?.charts?.donut?.success ? result?.charts?.donut?.data || [] : [],
        drillDown: []
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

        setChartData(prev => ({
          ...prev,
          drillDown: drillData,
        }));

        setDrillDownState({
          isDrilled: true,
          chartType: chartType,
          title: title
        });


        // openDrawer({
        //   chartType,
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
  };

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartDataHanlde();
  }, [dimensions, testCase, crossChartFilter]);
  // Handle reset group and modal actions
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
    setChartData(prev => ({
      ...prev,
      drillDown: [],
    }));
  }, []);


  const handleResetCrossChartFilter = useCallback(() => {
    setCrossChartFilter('');
    handleResetDrillDown();
  }, []);

  const handleShareChart = async (
    title: string,
    chartContainerRef: React.RefObject<HTMLDivElement>
  ) => {
    try {
      const imageData = await VictoryCaptureChartScreenshot(chartContainerRef);
      handleOpenDrawer(title, imageData);
    } catch (error) {
      console.error('Failed to capture chart:', error);
      setError('Failed to capture chart for sharing');
    }
  };

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard - Victory Charts</h1>

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
      
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChartContainer
            isLoading={isLoading}
            title={drillDownState?.chartType === 'line' ? drillDownState?.title : "Revenue Trends"}
            isDrilled={drillDownState?.isDrilled && drillDownState?.chartType === 'line'}
            resetDrillDown={handleResetDrillDown}
            data={drillDownState.chartType === 'line' ? chartData?.drillDown : chartData.line}
            isCrossChartFiltered={crossChartFilter}
            resetCrossChartFilter={handleResetCrossChartFilter}
            handleShareChart={handleShareChart}
          >
            <LineChart
              data={drillDownState.chartType === 'line' ? normalizeSpecificKeys(chartData.drillDown) : chartData.line}
              setContextMenu={setContextMenu}
              onDrillDown={handleDrillDown}
              isDrilled={drillDownState?.isDrilled && drillDownState?.chartType === 'line'}
              isCrossChartFiltered={!!crossChartFilter}
            />
          </ChartContainer>

          <ChartContainer
            isLoading={isLoading}
            title={drillDownState?.chartType === 'bar' ? drillDownState?.title : "Revenue vs Expenses"}
            isDrilled={drillDownState?.isDrilled && drillDownState?.chartType === 'bar'}
            resetDrillDown={handleResetDrillDown}
            data={drillDownState.chartType === 'bar' ? chartData?.drillDown : chartData.bar}
            isCrossChartFiltered={crossChartFilter}
            handleShareChart={handleShareChart}
          >
            <BarChart
              data={drillDownState.chartType === 'bar' ? chartData.drillDown : chartData.bar}
              onDrillDown={handleDrillDown}
              isDrilled={drillDownState?.isDrilled && drillDownState?.chartType === 'bar'}
              isCrossChartFiltered={!!crossChartFilter}
            />
          </ChartContainer>

          <ChartContainer
            isLoading={isLoading}
            title={drillDownState?.chartType === 'pie' ? drillDownState?.title : "Financial Distribution"}
            isDrilled={drillDownState?.isDrilled && drillDownState?.chartType === 'pie'}
            resetDrillDown={handleResetDrillDown}
            data={drillDownState?.chartType === 'pie' ? chartData?.drillDown : chartData.pie}
            isCrossChartFiltered={crossChartFilter}
            handleShareChart={handleShareChart}
          >
            {drillDownState.chartType === 'pie' ? (
              <LineChartDrillDown
                data={chartData.drillDown}
              />
            ) : (
              <PieChart data={chartData.pie} onDrillDown={handleDrillDown} />
            )}
          </ChartContainer>

          <ChartContainer
            isLoading={isLoading}
            title={drillDownState?.chartType === 'donut' ? drillDownState?.title : "Revenue by Category"}
            isDrilled={drillDownState?.isDrilled && drillDownState?.chartType === 'donut'}
            resetDrillDown={handleResetDrillDown}
            data={drillDownState?.chartType === 'pie' ? chartData?.drillDown : chartData.donut}
            isCrossChartFiltered={crossChartFilter}
            handleShareChart={handleShareChart}
          >
            {drillDownState.chartType === 'donut' ? (
              <LineChartDrillDown
                data={chartData.drillDown}
              />
            ) : (
              <DonutChart data={chartData.donut} onDrillDown={handleDrillDown} />
            )}
          </ChartContainer>
        </div>
        <p className="mt-4 text-sm text-gray-500 text-center">
          <i>Click on any chart element to drill down into more detailed data</i>
        </p>
      </>
      <EmailShareDrawer
        isOpen={emailDrawer.isOpen}
        onClose={handleCloseDrawer}
        chartTitle={emailDrawer.chartTitle}
        chartImage={emailDrawer.chartImage}
      />
    </section>
  );
};

// Individual Chart Components
interface LineSeriesConfig {
  key: keyof Pick<ChartDataPoint, 'revenue' | 'grossMargin' | 'netProfit'>;
  name: string;
  color: string;
}

interface LegendDataItem {
  name: string;
  symbol: {
    fill: string;
    opacity: number;
  };
}

interface EventHandlerProps {
  datum: any;
  data: ChartDataPoint[];
  index: number;
}

interface LineChartProps {
  data: ChartDataPoint[];
  onDrillDown: (chartType: string, category: string, value: any, dataType: string) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<any>>;
  isDrilled?: boolean;
  isCrossChartFiltered?: boolean;
}

function normalizeSpecificKeys(data: any[]): any[] {
  return data.map(item => {
    const newItem: any = {};

    for (const key in item) {
      if (!Object.prototype.hasOwnProperty.call(item, key)) continue;

      let newKey = key;

      // Custom renaming rules
      if (key === 'grossmargin') newKey = 'grossMargin';
      else if (key === 'netprofit') newKey = 'netProfit';
      newItem[newKey] = item[key];
    }

    return newItem;
  });
}

const LineChart: React.FC<LineChartProps> = ({ data, setContextMenu, onDrillDown, isDrilled, isCrossChartFiltered }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  const [visibleSeries, setVisibleSeries] = useState<VisibleLineSeries>({
    revenue: false,
    grossMargin: false,
    netProfit: false,
  });
  useEffect(() => {
    if (data.length > 0) {
      setVisibleSeries({
        revenue: data[0]?.revenue != null,
        grossMargin: data[0]?.grossMargin != null || data[0]?.grossmargin != null,
        netProfit: data[0]?.netProfit != null || data[0]?.netprofit != null,

      });
    }
  }, [data]);

  const series = useMemo<LineSeriesConfig[]>(() => [
    { key: 'revenue', name: 'Revenue', color: '#4bc0c0' },
    { key: 'grossMargin', name: 'Gross Margin', color: '#36a2eb' },
    { key: 'netProfit', name: 'Net Profit', color: '#ff6384' }
  ], []);

  const legendData = useMemo<LegendDataItem[]>(() =>
    series.map(s => ({
      name: s.name,
      symbol: {
        fill: visibleSeries[s.key] ? s.color : '#cccccc',
        opacity: visibleSeries[s.key] ? 1 : 0.5
      }
    })), [visibleSeries, series]);

  const legendEvents = useMemo(() => [{
    target: "data",
    eventHandlers: {
      onClick: (_e: any, { datum }: { datum: any }) => {
        const name = datum.name.toLowerCase().replace(' ', '');
        let mappedKey: keyof VisibleLineSeries;

        switch (name) {
          case 'grossmargin':
            mappedKey = 'grossMargin';
            break;
          case 'netprofit':
            mappedKey = 'netProfit';
            break;
          case 'revenue':
            mappedKey = 'revenue';
            break;
          default:
            return null;
        }

        setVisibleSeries(prev => ({
          ...prev,
          [mappedKey]: !prev[mappedKey]
        }));
        return null;
      }
    }
  }] as EventPropTypeInterface<VictoryLegendTTargetType, StringOrNumberOrCallback>[], []);

  const createScatterEvents = useCallback((type: keyof Pick<ChartDataPoint, 'revenue' | 'grossMargin' | 'netProfit'>) => [{
    target: "data" as const,
    eventHandlers: {
      onMouseOver: () => {
        return [
          {
            target: "data",
            mutation: () => ({ style: { fill: "#1E40AF", cursor: "pointer" } })
          }
        ];
      },
      onMouseOut: () => {
        return [
          {
            target: "data",
            mutation: () => ({ style: { fill: series.find(s => s.key === type)?.color } })
          }
        ];
      },

      onClick: (event: any, { data: chartData, index }: EventHandlerProps) => {
        const clickedPoint = chartData[index];
        if (!clickedPoint?.period && !clickedPoint?.fiscalYear) return;

        const value = clickedPoint[type];
        const category = clickedPoint.fiscalYear;

        setContextMenu({
          isOpen: true,
          position: { x: event.clientX, y: event.clientY },
          category: category,
          value: value,
          chartType: 'line',
          dataType: type
        });

        // if (event.ctrlKey || event.metaKey) {
        //   onDrillDown('line', period, value, type);
        // } else {
        //   // @ts-ignore
        //   setDimensions(handleCrossChartFilteringFunc(String(period)));
        // }

        return null;

      }
    }
  }], [onDrillDown]);

  const tooltipStyle = useMemo(() => ({
    cornerRadius: 5,
    flyoutStyle: {
      fill: "white",
      stroke: "#d4d4d4",
      strokeWidth: 1,
    }
  }), []);

  const xAxix = isDrilled || isCrossChartFiltered ? "period" : "fiscalYear";

  return (
    <VictoryChart theme={VictoryTheme.clean} domainPadding={20} height={350} width={800}>
      <VictoryAxis
        tickFormat={(x: any) => x}
        style={{ tickLabels: { fontSize: 10, angle: -65 } }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={(y: number) => `$${Math.round(y / 1000)}k`}
      />

      <VictoryLegend
        x={50} y={10} orientation="horizontal" gutter={20}
        style={{
          labels: { fontSize: 12, cursor: "pointer" },
          data: { cursor: "pointer" }
        }}
        data={legendData}
        events={legendEvents}
      />

      {/* Lines */}
      {series.map(s => visibleSeries[s.key] && (
        <VictoryLine
          key={`line-${s.key}`}
          data={data}
          x={xAxix}
          y={s.key}
          style={{ data: { stroke: s.color, strokeWidth: 2 } }}
        />
      ))}

      {/* Scatter points for interaction */}
      {series.map(s => visibleSeries[s.key] && (
        <VictoryScatter
          key={`scatter-${s.key}`}
          data={data}
          x={xAxix}
          y={s.key}
          size={4}
          style={{ data: { fill: s.color } }}
          labels={({ datum }: { datum: ChartDataPoint }) => {
            const value = Number(datum[s.key]);
            return `${s.name}: $${Math.round((value || 0) / 1000)}k`;
          }}
          labelComponent={<VictoryTooltip {...tooltipStyle} />}
          events={createScatterEvents(s.key)}
        />
      ))}
    </VictoryChart>
  );
};

interface SeriesConfig {
  key: keyof Pick<ChartDataPoint, 'revenue' | 'expenses'>;
  name: string;
  color: string;
}

interface BarChartProps {
  data: ChartDataPoint[];
  onDrillDown: (chartType: string, category: string, value: any, dataType: string) => void;
  isDrilled?: boolean;
  isCrossChartFiltered?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ data, onDrillDown, isDrilled, isCrossChartFiltered }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
    revenue: false,
    expenses: false,
  });

  useEffect(() => {
    if (data.length > 0) {
      setVisibleSeries({
        revenue: data[0]?.revenue != null,
        expenses: data[0]?.expenses != null,
      });
    }
  }, [data]);

  const series = useMemo<SeriesConfig[]>(() => [
    { key: 'revenue', name: 'Revenue', color: '#4bc0c0' },
    { key: 'expenses', name: 'Expenses', color: '#ff6384' }
  ], []);

  const legendData = useMemo<LegendDataItem[]>(() =>
    series.map(s => ({
      name: s.name,
      symbol: {
        fill: visibleSeries[s.key] ? s.color : '#cccccc',
        opacity: visibleSeries[s.key] ? 1 : 0.5
      }
    })), [visibleSeries, series]);

  const legendEvents = useMemo(() => [{
    target: "data" as const,
    eventHandlers: {
      onClick: (_e: any, { datum }: EventHandlerProps) => {
        const seriesKey = datum.name.toLowerCase() as keyof VisibleSeries;
        setVisibleSeries(prev => ({
          ...prev,
          [seriesKey]: !prev[seriesKey]
        }));
        return null;
      }
    }
  }], []);

  const createBarEvents = useCallback((type: keyof Pick<ChartDataPoint, 'revenue' | 'expenses'>) => [{
    target: "data" as const,
    eventHandlers: {
      onMouseOver: () => {
        return [
          {
            target: "data",
            mutation: () => ({
              style: {
                fill: "#1E40AF",
                cursor: "pointer",
                fillOpacity: 0.8
              }
            })
          }
        ];
      },
      onMouseOut: () => {
        return [
          {
            target: "data",
            mutation: () => ({
              style: {
                fill: series.find(s => s.key === type)?.color,
                cursor: "pointer",
                fillOpacity: 1
              }
            })
          }
        ];
      },
      onClick: (_e: any, { datum }: EventHandlerProps) => {
        if (!isDrilled) {
          onDrillDown('bar', datum.fiscalYear, datum[type], type);
        }
      }
    }
  }], [onDrillDown]);

  const xAxix = isDrilled || isCrossChartFiltered ? "period" : "fiscalYear";

  return (
    <VictoryChart theme={VictoryTheme.clean} domainPadding={10} height={350} width={800}>
      <VictoryAxis
        tickFormat={(x: any) => x}
        style={{ tickLabels: { fontSize: 10, angle: -45 } }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={(y: number) => `$${Math.round(y / 1000)}k`}
      />

      <VictoryLegend
        x={50} y={10} orientation="horizontal" gutter={20}
        style={{
          labels: { fontSize: 12, cursor: "pointer" },
          data: { cursor: "pointer" }
        }}
        data={legendData}
        events={legendEvents}
      />

      <VictoryGroup offset={20}>
        {series.map(s => visibleSeries[s.key] && (
          <VictoryBar
            key={s.key}
            labelComponent={<VictoryTooltip />}
            data={data}
            x={xAxix}
            y={s.key}
            style={{ data: { fill: s.color } }}
            events={createBarEvents(s.key)}
          />
        ))}
      </VictoryGroup>
    </VictoryChart>
  );
};

const PieChart: React.FC<{
  data: ChartDataPoint[];
  onDrillDown: (chartType: string, category: string, value: any, dataType: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  const colorScale = ["#4bc0c0", "#ff6384", "#36a2eb", "#ffce56", "#9966ff", "#ff9f40"];

  // State to track visible categories
  const [visibleCategories, setVisibleCategories] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    data.forEach(item => {
      if (item.catfinancialview) {
        initial[item.catfinancialview] = true;
      }
    });
    return initial;
  });

  // Filter data based on visible categories
  const filteredData = useMemo(() =>
    data.filter(item => item.catfinancialview && visibleCategories[item.catfinancialview]),
    [data, visibleCategories]
  );

  // Create legend data
  const legendData = useMemo<LegendDataItem[]>(() =>
    data.map((item, index) => ({
      name: item.catfinancialview || '',
      symbol: {
        fill: item.catfinancialview && visibleCategories[item.catfinancialview]
          ? colorScale[index % colorScale.length]
          : '#cccccc',
        opacity: item.catfinancialview && visibleCategories[item.catfinancialview] ? 1 : 0.5
      }
    })), [data, visibleCategories, colorScale]);

  // Legend click events
  const legendEvents = useMemo(() => [{
    target: "data" as const,
    eventHandlers: {
      onClick: (_e: any, { datum }: EventHandlerProps) => {
        setVisibleCategories(prev => ({
          ...prev,
          [datum.name]: !prev[datum.name]
        }));
        return null;
      }
    }
  }], []);

  return (
    <div style={{ position: 'relative' }}>
      <VictoryLegend
        x={50} y={10} orientation="horizontal" gutter={15}
        style={{
          labels: { fontSize: 11, cursor: "pointer" },
          data: { cursor: "pointer" }
        }}
        height={50}
        data={legendData}
        events={legendEvents}
        itemsPerRow={3}
      />
      <VictoryPie
        data={filteredData}
        x="catfinancialview"
        y="revenue"
        animate={{ duration: 1000 }}
        colorScale={colorScale}
        labelRadius={80}
        style={{ labels: { fontSize: 10, fill: "#333" }, data: { cursor: "pointer" } }}
        labels={({ datum }) => `${datum.catfinancialview}: $${Math.round(datum.revenue / 1000)}k`}
        labelComponent={<VictoryTooltip />}
        radius={100}
        theme={VictoryTheme.clean}
        height={350}
        padding={{ top: 80, bottom: 50, left: 50, right: 50 }}
        events={[{
          target: "data",
          eventHandlers: {
            onClick: (event, datum) => {
              onDrillDown('pie', datum.datum.catfinancialview, datum.datum.revenue, 'revenue');
            }
          }
        }]}
      />
    </div>
  );
};

const DonutChart: React.FC<{
  data: ChartDataPoint[];
  onDrillDown: (chartType: string, category: string, value: any, dataType: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  // Take top 6 categories for better visibility
  const topCategories = data.slice(0, 6);
  const colorScale = ["#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#36a2eb", "#ff6384"];

  // State to track visible categories
  const [visibleCategories, setVisibleCategories] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    topCategories.forEach(item => {
      initial[item.cataccountingview] = true;
    });
    return initial;
  });

  // Filter data based on visible categories
  const filteredData = useMemo(() =>
    topCategories.filter(item => visibleCategories[item.cataccountingview]),
    [topCategories, visibleCategories]
  );

  // Create legend data
  const legendData = useMemo<LegendDataItem[]>(() =>
    topCategories.map((item, index) => ({
      name: item.cataccountingview,
      symbol: {
        fill: visibleCategories[item.cataccountingview] ? colorScale[index % colorScale.length] : '#cccccc',
        opacity: visibleCategories[item.cataccountingview] ? 1 : 0.5
      }
    })), [topCategories, visibleCategories, colorScale]);

  // Legend click events
  const legendEvents = useMemo(() => [{
    target: ["data", "labels"] as const,
    eventHandlers: {
      onClick: (_e: any, { datum }: EventHandlerProps) => {
        setVisibleCategories(prev => ({
          ...prev,
          [datum.name]: !prev[datum.name]
        }));
        return null;
      }
    }
  }], []);

  return (
    <div style={{ position: 'relative' }}>
      <VictoryLegend
        x={50} y={10} orientation="horizontal" gutter={15}
        height={50}
        style={{
          labels: { fontSize: 11, cursor: "pointer" },
          data: { cursor: "pointer" }
        }}
        data={legendData}
        events={[{
          target: "data" as VictoryLegendTTargetType,
          eventHandlers: {
            onClick: (_e: any, { datum }: EventHandlerProps) => {
              setVisibleCategories(prev => ({
                ...prev,
                [datum.name]: !prev[datum.name]
              }));
              return null;
            }
          }
        }]}
        itemsPerRow={3}
      />
      <VictoryPie
        data={filteredData}
        x="cataccountingview"
        y="revenue"
        colorScale={colorScale}
        innerRadius={70}
        labelRadius={90}
        style={{
          labels: { fontSize: 12, cursor: "pointer" },
          data: { cursor: "pointer" }
        }}
        labels={({ datum }) => `${datum.cataccountingview}: $${Math.round(datum.revenue / 1000)}k`}
        labelComponent={<VictoryTooltip />}
        theme={VictoryTheme.clean}
        height={350}
        padding={{ top: 80, bottom: 50, left: 50, right: 50 }}
        events={[{
          target: "data",
          eventHandlers: {
            onClick: (event, datum) => {
              onDrillDown('donut', datum.datum.cataccountingview, datum.datum.revenue, 'revenue');
            },
          }
        }]}
      />
    </div>
  );
};


interface LineDrillDownChartProps {
  data: ChartDataPoint[];
}

const LineChartDrillDown: React.FC<LineDrillDownChartProps> = ({ data }) => {
  if (!data?.length) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  return (
    <VictoryChart theme={VictoryTheme.clean} domainPadding={20} height={350} width={800}>
      <VictoryAxis
        tickFormat={(x: string) => x}
        style={{ tickLabels: { fontSize: 10, angle: -65 } }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={(y: number) => `$${Math.round(y / 1000)}k`}
      />
      <VictoryLegend
        x={50}
        y={10}
        orientation="horizontal"
        gutter={20}
        style={{
          labels: { fontSize: 12, cursor: 'pointer' },
          data: { cursor: 'pointer' },
        }}
        data={[
          {
            name: 'Value',
            symbol: {
              fill: '#4bc0c0',
              opacity: 1,
            },
          },
        ]}
      />
      <VictoryLine
        data={data}
        x="period"
        y="value"
        style={{ data: { stroke: '#4bc0c0', strokeWidth: 2 } }}
      />
      <VictoryScatter
        data={data}
        x="period"
        y="value"
        size={4}
        style={{ data: { fill: '#4bc0c0' } }}
        labels={({ datum }) => `Value: $${Math.round(datum.value / 1000)}k`}
        labelComponent={
          <VictoryTooltip
            cornerRadius={5}
            flyoutStyle={{ fill: 'white', stroke: '#d4d4d4', strokeWidth: 1 }}
          />
        }
      />
    </VictoryChart>
  );
};


export default VictoryChartsPage;