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
import { buildRequestBody, handleCrossChartFilteringFunc } from "@/lib/services/buildWhereClause";
import { ActionButton } from "@/components/ui/action-button";
import { ErrorAlert } from "@/components/ui/status-alerts";
import { ChartSkelten } from "@/components/ui/ChartSkelten";

import ReusableChartDrawer from "@/components/ChartDrawer";
import { useChartDrawer } from "@/components/ChartDrawer";

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
const ChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  isDrilled?: boolean;
  data?: any[];
  isLoading?: boolean;
}> = ({ title, children, onBack, isDrilled, data, isLoading }) => {
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
                onClick={exportToPNG}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                disabled={!data || data.length === 0}
              >
                PNG
              </button>
              <button
                onClick={exportToCSV}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                disabled={!data || data.length === 0}
              >
                CSV
              </button>
            </div>
          </div>
          <div className="w-full" ref={chartRef}>
            {children}
          </div>
        </>
      ) : (
        <ChartSkelten />
      )}
    </div>
  );
};

// Main Component
const VictoryChartsPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  // API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation()
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();

  // Chart data state
  const [chartData, setChartData] = useState<ChartData>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: []
  });

  // Drill down state
  const { drillDownState, openDrawer, closeDrawer, isOpen } = useChartDrawer();

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  };

  // Fetch all chart data using API
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch line chart data
      const result = await fetchAllChartData({
        body: buildRequestBody(dimensions, 'all')
      }).unwrap();
      if (!result || !result.success) {
        throw new Error(result?.message || "Failed to fetch chart data");
      }

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

        setChartData(prev => ({
          ...prev,
          drillDown: drillData
        }));

        openDrawer({
        chartType,
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

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartDataHanlde();
  }, [dimensions]);
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

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard - Victory Charts</h1>

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
      onBack={closeDrawer}
      isLoading={isLoading}
      showBackButton={true}
      showCloseButton={true}
    >
      <div style={{ height: '500px' }}>
        <DrillDownChart data={chartData.drillDown} />
      </div>
    </ReusableChartDrawer>
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ChartContainer isLoading={isLoading} title="Revenue Trends with Cross Chart Filter" data={chartData.line}>
              <LineChart data={chartData.line} setDimensions={setDimensions} onDrillDown={handleDrillDown} />
            </ChartContainer>

            <ChartContainer isLoading={isLoading} title="Revenue vs Expenses" data={chartData.bar}>
              <BarChart data={chartData.bar} onDrillDown={handleDrillDown} />
            </ChartContainer>

            <ChartContainer isLoading={isLoading} title="Financial Distribution" data={chartData.pie}>
              <PieChart data={chartData.pie} onDrillDown={handleDrillDown} />
            </ChartContainer>

            <ChartContainer isLoading={isLoading} title="Revenue by Category" data={chartData.donut}>
              <DonutChart data={chartData.donut} onDrillDown={handleDrillDown} />
            </ChartContainer>
          </div>
          <p className="mt-4 text-sm text-gray-500 text-center">
            <i>Click on any chart element to drill down into more detailed data</i>
          </p>
        </>
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
  setDimensions: React.Dispatch<React.SetStateAction<any>>;
}

const LineChart: React.FC<LineChartProps> = ({ data, setDimensions, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  const [visibleSeries, setVisibleSeries] = useState<VisibleLineSeries>({
    revenue: true,
    grossMargin: true,
    netProfit: true
  });

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
      onClick: (event: any, { data: chartData, index }: EventHandlerProps) => {
        const clickedPoint = chartData[index];
        if (!clickedPoint?.period) return;

        const value = clickedPoint[type];
        const period = clickedPoint.period;

        if (event.ctrlKey || event.metaKey) {
          onDrillDown('line', period, value, type);
        } else {
          // @ts-ignore
          setDimensions(handleCrossChartFilteringFunc(period));
        }

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
          x="period"
          y={s.key}
          style={{ data: { stroke: s.color, strokeWidth: 2 } }}
        />
      ))}

      {/* Scatter points for interaction */}
      {series.map(s => visibleSeries[s.key] && (
        <VictoryScatter
          key={`scatter-${s.key}`}
          data={data}
          x="period"
          y={s.key}
          size={4}
          style={{ data: { fill: s.color } }}
          labels={({ datum }: { datum: ChartDataPoint }) => {
            const value = datum[s.key];
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
}

const BarChart: React.FC<BarChartProps> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
    revenue: true,
    expenses: true
  });

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
      onClick: (_e: any, { datum }: EventHandlerProps) =>
        onDrillDown('bar', datum.period, datum[type], type)
    }
  }], [onDrillDown]);

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
            x="period"
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
        style={{ labels: { fontSize: 10, fill: "#333" } }}
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
        style={{ labels: { fontSize: 10, fill: "#333" } }}
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

// Drill-down Chart Component
const DrillDownChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  const firstItem = data[0];
  const keys = Object.keys(firstItem);

  // Determine chart type based on data structure
  if (keys.includes('catfinancialview') || keys.includes('cataccountingview')) {
    const categoryKey = keys.find(key => key.includes('cat')) || keys[0];
    return (
      <VictoryChart theme={VictoryTheme.clean} domainPadding={20} height={350}>
        <VictoryAxis tickFormat={x => x} style={{ tickLabels: { fontSize: 10, angle: -45 } }} />
        <VictoryAxis dependentAxis tickFormat={y => `$${Math.round(y / 1000)}k`} />
        <VictoryBar
          data={data}
          x={categoryKey}
          y="value"
          style={{ data: { fill: "#4bc0c0" } }}
        />
      </VictoryChart>
    );
  } else if (keys.includes('period')) {
    return (
      <VictoryChart theme={VictoryTheme.clean} domainPadding={20} height={350} width={1000}>
        <VictoryAxis tickFormat={x => x} style={{ tickLabels: { fontSize: 10, angle: -45 } }} />
        <VictoryAxis dependentAxis tickFormat={y => `$${Math.round(y / 1000)}k`} />
        <VictoryLine
          data={data} x="period" y="value"
          style={{ data: { stroke: "#4bc0c0", strokeWidth: 2 } }}
        />
      </VictoryChart>
    );
  } else {
    // Pie chart for other data
    const labelKey = keys.find(key => key !== 'value') || keys[0];
    return (
      <VictoryPie
        data={data}
        x={labelKey}
        y="value"
        colorScale={["#4bc0c0", "#ff6384", "#36a2eb", "#ffce56", "#9966ff", "#ff9f40"]}
        style={{ labels: { fontSize: 10, fill: "#333" } }}
        height={350}
      />
    );
  }
};

export default VictoryChartsPage;