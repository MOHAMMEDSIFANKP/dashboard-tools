//src\app\nivo-charts\NivoChartsPage.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
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
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from "@/lib/testCase2Transformer";
import { ChartContextMenu } from "@/components/charts/ChartContextMenu";
import { ChartContainerView } from "@/components/charts/ChartContainerView";

import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { formatCurrency, NivoCaptureChartScreenshot } from "@/utils/utils";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { ComparisonDrawer } from "@/components/drawer/ChartComparisonDrawer";
import { useChartComparisonDrawer } from "@/hooks/useChartComparisonDrawer";


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
  fiscalYear?: string;
  [key: string]: any;
}

interface LineChartPoint {
  x: string;
  y: number;
}

interface LineChartSeries {
  id: string;
  data: LineChartPoint[];
}

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  data?: any[];
  isDrilled?: boolean;
  isCrossChartFiltered?: string;
  onBack?: () => void;
  onExport?: () => void;
  onResetFilter?: () => void;
  isLoading?: boolean;
  handleShareChart: (title: string, chartRef: React.RefObject<HTMLDivElement>) => void;
  chartRef: React.RefObject<any>;
  onComparisonOpen: (chartType: string) => void;
  chartType?: string;
}

// Chart Container Component
const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  data,
  isDrilled,
  isCrossChartFiltered,
  onBack,
  onExport,
  onResetFilter,
  isLoading = false,
  handleShareChart,
  chartRef,
  onComparisonOpen,
  chartType
}) => {
  const hasData = data && data.length > 0;

  const exportToCSV = () => {
    if (!data || !data.length) {
      alert('No data available to export');
      return;
    }

    try {
      const allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
      const headers = allKeys.join(',');
      const csvRows = data.map(row => {
        return allKeys.map(key => {
          const value = row[key];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      });

      const csv = `${headers}\n${csvRows.join('\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting data to CSV');
    }
  };

  return (
    <ChartContainerView
      title={title}
      isDrilled={isDrilled}
      resetDrillDown={onBack}
      isLoading={isLoading}
      isCrossChartFiltered={isCrossChartFiltered}
      resetCrossChartFilter={onResetFilter}
      exportToCSV={exportToCSV}
      hasData={hasData}
      chartRef={chartRef}
      children={children}
      onShareChart={() => handleShareChart(title, chartRef)}
      onComparisonOpen={() => onComparisonOpen(chartType || '')}
    />
  );
};

export default function NivoChartsPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [crossChartFilter, setCrossChartFilter] = useState<string>('');

  const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();
  // Comparison drawer state
  const { comparisonDrawer, handleComparisonOpenDrawer, handleComparisonCloseDrawer } = useChartComparisonDrawer()
  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

  // Chart data states
  const [lineChartData, setLineChartData] = useState<LineChartSeries[]>([]);
  const [barChartData, setBarChartData] = useState<ChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<ChartDataPoint[]>([]);
  const [donutChartData, setDonutChartData] = useState<ChartDataPoint[]>([]);

  // Raw data for export and drill-down
  const [rawData, setRawData] = useState<{
    line: ChartDataPoint[];
    bar: ChartDataPoint[];
    pie: ChartDataPoint[];
    donut: ChartDataPoint[];
    drillDown: any[];
  }>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: [],
  });

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

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    category: string;
    value: any;
    chartType: string;
    dataType: string;
  } | null>(null);

  // API mutations
  const [fetchAllChartData] = useFetchChartDataMutation();
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();
  const [FetchTestCase2AllChartData] = useFetchTestCase2ChartDataMutation();
  const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();

  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const donutChartRef = useRef<HTMLDivElement>(null);


  const fetchChartDataByTestCase = async () => {
    try {
      if (testCase === "test-case-1") {
        const res = await fetchAllChartData({
          body: buildRequestBody(dimensions, 'all'),
          crossChartFilter: crossChartFilter
        }).unwrap();
        if (!res?.success) throw new Error(res.message || "Error");
        return res;
      } else {
        const raw = await FetchTestCase2AllChartData({
          body: buildRequestBody(dimensions, 'all'),
          productId: testCase2ProductId,
          excludeNullRevenue: false,
          crossChartFilter: crossChartFilter
        }).unwrap();
        const transformed = transformTestCase2ToCommonFormat(raw);
        if (!transformed?.success) throw new Error(transformed.message || "Error");
        return transformed;
      }
    } catch (error) {
      console.log(error, 'Error fetching chart data');
      throw error;
    }
  };

  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result: any = await fetchChartDataByTestCase();
      const Xkey = crossChartFilter ? 'period' : 'fiscalYear';

      // Process line chart data
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      if (lineData.length > 0) {
        const lineChartSeries: LineChartSeries[] = [
          {
            id: "Revenue",
            data: lineData.map((d: any) => ({
              x: d[Xkey] || '',
              y: Number(d.revenue) || 0,
            })),
          },
          {
            id: "grossMargin",
            data: lineData.map((d: any) => ({
              x: d[Xkey] || '',
              y: Number(d.grossMargin) || 0,
            })),
          },
          {
            id: "netProfit",
            data: lineData.map((d: any) => ({
              x: d[Xkey] || '',
              y: Number(d.netProfit) || 0,
            })),
          },
        ];
        setLineChartData(lineChartSeries);
      }

      // Process bar chart data
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      if (barData.length > 0) {
        const ChartSeries = barData.map((item: any) => ({
          [Xkey]: item[Xkey] || 'Unknown',
          revenue: Math.round(Number(item.revenue || 0)),
          expenses: Math.round(Number(item.expenses || 0)),
        }));
        setBarChartData(ChartSeries);
      }

      // Process pie chart data
      const pieData = result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [];
      if (pieData.length > 0) {
        const formattedPieData = pieData.map((item: any, index: number) => ({
          id: item.catfinancialview || item.label || `Category ${index + 1}`,
          label: item.catfinancialview || item.label || `Category ${index + 1}`,
          value: Math.round(Number(item.revenue || item.value || 0))
        }));
        setPieChartData(formattedPieData);
      }

      // Process donut chart data
      const donutData = result?.charts?.donut?.success ? result?.charts?.donut?.data || [] : [];
      if (donutData.length > 0) {
        const formattedDonutData = donutData.map((item: any) => ({
          id: item.cataccountingview || item.catAccountingView || item.label || 'Unknown',
          label: item.cataccountingview || item.catAccountingView || item.label || 'Unknown',
          value: Math.round(Number(item.revenue || item.value || 0))
        }));
        setDonutChartData(formattedDonutData);
      }

      // Store raw data
      setRawData({
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
  };

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
        setRawData(prev => ({
          ...prev,
          drillDown: result.data,
        }));

        setDrillDownState({
          isDrilled: true,
          chartType: chartType,
          title: result.title || `${dataType} Breakdown for ${category}`,
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

  const renderDrillDown = () => {
    if (!drillDownState.isDrilled || rawData.drillDown.length === 0) {
      return <p className="text-center text-gray-500">No drill-down data available</p>;
    }

    const firstDataPoint = rawData.drillDown[0];
    const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];

    if (drillDownState.chartType === 'bar') {
      const labelKey = dataKeys.find(k => k !== 'value' && k !== 'revenue') || dataKeys[0];
      const valueKey = dataKeys.includes('value') ? 'value' :
        dataKeys.includes('revenue') ? 'revenue' :
          dataKeys[1];

      return (
        <div style={{ height: "400px" }}>
          <ResponsiveBar
            data={rawData.drillDown.map((item) => ({
              category: item[labelKey] || 'Unknown',
              value: Math.round(Number(item[valueKey] || 0))
            }))}
            keys={['value']}
            indexBy="category"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            colors={{ scheme: "paired" }}
            axisBottom={{
              legend: labelKey,
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              legend: valueKey,
              legendOffset: -40,
              legendPosition: "middle",
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          />
        </div>
      );
    }
    // Handle line chart drill-down
    else if (drillDownState.chartType === 'line' || dataKeys.includes('period') || dataKeys.includes('fiscalYear')) {
      const xKey = dataKeys.includes('period') ? 'period' :
        dataKeys.includes('fiscalYear') ? 'fiscalYear' :
          dataKeys[0];
      const yKey = dataKeys.includes('value') ? 'value' :
        dataKeys.includes('revenue') ? 'revenue' :
          dataKeys[1];

      return (
        <div style={{ height: "400px" }}>
          <ResponsiveLine
            data={[{
              id: drillDownState.title || "Drill Down Data",
              data: rawData.drillDown.map((d) => ({
                x: d[xKey] || 'Unknown',
                y: Number(d[yKey] || 0),
              }))
            }]}
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
              reverse: false,
            }}
            axisBottom={{
              legend: xKey,
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              legend: yKey,
              legendOffset: -40,
              legendPosition: "middle",
            }}
            pointSize={10}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            useMesh={true}
          />
        </div>
      );
    } else {
      // Default to pie/donut chart
      const labelKey = dataKeys.find(k => k !== 'value' && k !== 'revenue') || dataKeys[0];
      const valueKey = dataKeys.includes('value') ? 'value' :
        dataKeys.includes('revenue') ? 'revenue' :
          dataKeys[1];

      return (
        <div style={{ height: "400px" }}>
          <ResponsivePie
            data={rawData.drillDown.map((item) => ({
              id: item[labelKey] || 'Unknown',
              label: item[labelKey] || 'Unknown',
              value: Math.round(Number(item[valueKey] || 0))
            }))}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={drillDownState.chartType === 'donut' ? 0.5 : 0}
            padAngle={0.7}
            cornerRadius={3}
            colors={{ scheme: "category10" }}
            activeOuterRadiusOffset={8}
            borderWidth={1}
            borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: "color" }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          />
        </div>
      );
    }
  };

  // Event handlers
  const handleResetDrillDown = useCallback(() => {
    setDrillDownState({
      isDrilled: false,
      chartType: null,
      title: ''
    });
  }, []);

  const handleResetCrossChartFilter = useCallback(() => {
    setCrossChartFilter('');
    handleResetDrillDown();
  }, []);

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

  // Fetch data when dimensions or filter changes
  useEffect(() => {
    fetchAllChartDataHanlde();
  }, [dimensions, testCase, crossChartFilter]);

  const handleShareChart = async (
    title: string,
    chartContainerRef: React.RefObject<HTMLDivElement>
  ) => {
    try {
      const imageData = await NivoCaptureChartScreenshot(chartContainerRef);
      handleOpenDrawer(title, imageData);
    } catch (error) {
      console.error('Failed to capture chart:', error);
      setError('Failed to capture chart for sharing');
    }
  };


  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Nivo Charts</h1>

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
        <ChartContainer
          title={drillDownState.chartType === 'line' ? drillDownState.title : "Revenue Trends"}
          chartType="line"
          onComparisonOpen={handleComparisonOpenDrawer}
          isLoading={isLoading}
          data={drillDownState.chartType === 'line' ? rawData.drillDown : rawData.line}
          isDrilled={drillDownState.chartType === 'line'}
          isCrossChartFiltered={crossChartFilter}
          onBack={handleResetDrillDown}
          onResetFilter={handleResetCrossChartFilter}
          handleShareChart={handleShareChart}
          chartRef={lineChartRef}
        >
          {drillDownState.chartType === 'line' ? renderDrillDown() : (
            <div style={{ height: "400px" }}>
              <ResponsiveLine
                data={lineChartData}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: "point" }}
                yScale={{
                  type: "linear",
                  min: "auto",
                  max: "auto",
                  stacked: false,
                  reverse: false,
                }}
                axisBottom={{
                  legend: crossChartFilter ? "Period" : "Fiscal Year",
                  legendOffset: 36,
                  legendPosition: "middle",
                }}
                axisLeft={{
                  legend: "Amount",
                  legendOffset: -40,
                  legendPosition: "middle",
                  format: value => formatCurrency(value),
                }}
                colors={{ scheme: "nivo" }}
                pointSize={10}
                pointColor={{ theme: "background" }}
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                useMesh={true}
                onClick={(point, event) => {
                  if (point.data) {
                    const category: string =
                      typeof point.data.x === 'string' && point.data.x.length > 4
                        ? point.data.x.slice(0, 4)
                        : point.data.x.toString();
                    setContextMenu({
                      isOpen: true,
                      position: { x: event.clientX, y: event.clientY },
                      category: category,
                      value: point.data.y,
                      chartType: 'line',
                      dataType: point.serieId as string
                    });
                  }
                }}
                legends={[
                  {
                    anchor: "bottom-right",
                    direction: "column",
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: "left-to-right",
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: "circle",
                    toggleSerie: true,
                  }
                ]}
              />
            </div>
          )}
        </ChartContainer>

        <ChartContainer
          title={drillDownState.chartType === 'bar' ? drillDownState.title : "Revenue vs Expenses"}
          chartType="bar"
          onComparisonOpen={handleComparisonOpenDrawer}
          isLoading={isLoading}
          data={drillDownState.chartType === 'bar' ? rawData.drillDown : rawData.bar}
          isDrilled={drillDownState.chartType === 'bar'}
          isCrossChartFiltered={crossChartFilter}
          onBack={handleResetDrillDown}
          handleShareChart={handleShareChart}
          chartRef={barChartRef}
        >
          {drillDownState.chartType === 'bar' ? renderDrillDown() : (
            <div style={{ height: "400px" }}>
              <ResponsiveBar
                data={barChartData}
                keys={["revenue", "expenses"]}
                indexBy={crossChartFilter ? "period" : "fiscalYear"}
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                groupMode="grouped"
                colors={{ scheme: "paired" }}
                borderRadius={2}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                enableLabel={true}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}

                axisBottom={{
                  legend: crossChartFilter ? "Period" : "Fiscal Year",
                  legendOffset: 36,
                  legendPosition: "middle",
                }}
                axisLeft={{
                  legend: "Amount",
                  legendOffset: -40,
                  format: value => formatCurrency(value),
                }}
                onClick={(data) => {
                  handleDrillDown(
                    'bar',
                    (crossChartFilter ? data.data['period'] : data.data['fiscalYear'])?.slice(0, 4) as string,
                    data.data[data.id],
                    data.id as string
                  );
                }}
                legends={[
                  {
                    dataFrom: "keys",
                    anchor: "bottom-right",
                    direction: "column",
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: "left-to-right",
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    toggleSerie: true,
                  }
                ]}
                tooltip={({ id, value, color, indexValue }) => (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    <strong>{id}</strong>: ${value?.toLocaleString()}
                    <br />
                    <span style={{ opacity: 0.8 }}>Year: {indexValue}</span>
                  </div>
                )}

              />
            </div>
          )}
        </ChartContainer>

        <ChartContainer
          title={drillDownState.chartType === 'pie' ? drillDownState.title : "Financial Distribution"}
          chartType="pie"
          onComparisonOpen={handleComparisonOpenDrawer}
          isLoading={isLoading}
          data={drillDownState.chartType === 'pie' ? rawData.drillDown : rawData.pie}
          isDrilled={drillDownState.chartType === 'pie'}
          isCrossChartFiltered={crossChartFilter}
          onBack={handleResetDrillDown}
          handleShareChart={handleShareChart}
          chartRef={pieChartRef}
        >
          {drillDownState.chartType === 'pie' ? renderDrillDown() : (
            <div style={{ height: "400px" }}>
              <ResponsivePie
                data={pieChartData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0}
                padAngle={0.7}
                cornerRadius={3}
                colors={{ scheme: "category10" }}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: "color" }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                onClick={(data) => {
                  handleDrillDown('pie', data.id as string, data.value, 'revenue');
                }}
                legends={[
                  {
                    anchor: "bottom",
                    direction: "row",
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 0,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: "#999",
                    itemDirection: "left-to-right",
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: "circle",
                    toggleSerie: true,
                  }
                ]}
              />
            </div>
          )}
        </ChartContainer>

        <ChartContainer
          title={drillDownState.chartType === 'donut' ? drillDownState.title : "Revenue by Category"}
          chartType="donut"
          onComparisonOpen={handleComparisonOpenDrawer}
          isLoading={isLoading}
          data={drillDownState.chartType === 'donut' ? rawData.drillDown : rawData.donut}
          isDrilled={drillDownState.chartType === 'donut'}
          isCrossChartFiltered={crossChartFilter}
          onBack={handleResetDrillDown}
          handleShareChart={handleShareChart}
          chartRef={donutChartRef}
        >
          {drillDownState.chartType === 'donut' ? renderDrillDown() : (
            <div style={{ height: "400px" }}>
              <ResponsivePie
                data={donutChartData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                colors={{ scheme: "nivo" }}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: "color" }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                onClick={(data) => {
                  handleDrillDown('donut', data.label as string, data.value, 'revenue');
                }}
                legends={[
                  {
                    anchor: "bottom",
                    direction: "row",
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 0,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: "#999",
                    itemDirection: "left-to-right",
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: "circle",
                    toggleSerie: true,
                  }
                ]}
              />
            </div>
          )}
        </ChartContainer>

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
        chartLibrary="nivo"
      />
    </section>
  );
}