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
import { buildRequestBody, handleCrossChartFilteringFunc } from "@/lib/services/buildWhereClause";
import { ActionButton } from "@/components/ui/action-button";
import { ErrorAlert } from "@/components/ui/status-alerts";
import { ChartSkelten } from "@/components/ui/ChartSkelten";

import ReusableChartDrawer, { useChartDrawer } from "@/components/ChartDrawer";
import DashboardInfoCard from "@/components/DashboardInfoCard";
import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from "@/lib/services/testCase2Api";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from "@/lib/testCase2Transformer";

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
  onBack?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

// Chart Container Component
const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  data,
  isDrilled,
  onBack,
  onExport,
  isLoading = false,
}) => {
  const hasData = data && data.length > 0;
  // Export to CSV function
  const exportToCSV = () => {
    if (!data || !data.length) {
      alert('No data available to export');
      return;
    }

    try {
      // Get all unique keys from all objects
      const allKeys = Array.from(
        new Set(data.flatMap(item => Object.keys(item)))
      );

      // Create headers
      const headers = allKeys.join(',');

      // Create CSV rows
      const csvRows = data.map(row => {
        return allKeys.map(key => {
          const value = row[key];
          // Handle special characters and quotes in CSV
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      });

      const csv = `${headers}\n${csvRows.join('\n')}`;

      // Create and download file
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
              {/* <button
                        onClick={handleDownloadImage}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        PNG
                      </button> */}
              <button
                onClick={onExport || exportToCSV}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                CSV
              </button>
            </div>
          </div>
          <div>
            {children}
          </div>
        </>
      ) : (
        <ChartSkelten />
      )}

    </div>
  );
};

// Main Nivo Charts Page Component
export default function NivoChartsPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);


  // Test Case 1 API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation()
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();

  // Test Case 2 API Mutations
  const [FetchTestCase2AllChartData] = useFetchTestCase2ChartDataMutation();
  const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();

  // Chart data states
  const [lineChartData, setLineChartData] = useState<LineChartSeries[]>([]);
  const [barChartData, setBarChartData] = useState<ChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<ChartDataPoint[]>([]);
  const [donutChartData, setDonutChartData] = useState<ChartDataPoint[]>([]);

  // Raw data for export
  const [rawData, setRawData] = useState<{
    line: ChartDataPoint[],
    bar: ChartDataPoint[],
    pie: ChartDataPoint[],
    donut: ChartDataPoint[],
    drillDown: any[],
    chartType?: string
  }>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: [],
    chartType: ''
  });

  // Drill down states
  const { drillDownState, openDrawer, closeDrawer, isOpen } = useChartDrawer();

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  };

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

  // Fetch all chart data using API
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all chart data
      const result: any = await fetchChartDataByTestCase();

      // Process line chart data
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      if (lineData.length > 0) {
        const lineChartSeries: LineChartSeries[] = [
          {
            id: "Revenue",
            data: lineData.map((d: any) => ({
              x: d.period || d.x || '',
              y: Number(d.revenue) || 0,
            })),
          },
          {
            id: "grossMargin",
            data: lineData.map((d: any) => ({
              x: d.period || d.x || '',
              y: Number(d.grossMargin) || 0,
            })),
          },
          {
            id: "netProfit",
            data: lineData.map((d: any) => ({
              x: d.period || d.x || '',
              y: Number(d.netProfit) || 0,
            })),
          },
        ];
        setLineChartData(lineChartSeries);
      }

      // Process bar chart data
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      setBarChartData(barData);

      // Process pie chart data
      const pieData = result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [];
      if (pieData.length > 0) {
        // If the API returns aggregated data, use it directly
        // Otherwise, create the pie chart structure
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

      // Store raw data for export
      setRawData({
        line: lineData,
        bar: barData,
        pie: pieData,
        donut: donutData,
        drillDown: []
      });

      setError(null);
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

        // Update raw data for export
        setRawData(prev => ({
          ...prev,
          drillDown: drillData,
          chartType: chartType,
        }));

        // Open drawer instead of setting drill down state
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

  // Render drill down visualization based on data structure
  const renderDrillDown = () => {
    if (!rawData.drillDown.length) return null;

    const firstDataPoint = rawData.drillDown[0];

    const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];

    if (rawData?.chartType === 'line' || rawData?.chartType === 'bar') {
      return (
        <div style={{ height: "400px" }}>
          <ResponsiveBar
            data={rawData.drillDown.map((item) => ({
              category: item.catfinancialview || item.catFinancialView || 'Unknown',
              value: Math.round(Number(item.value || item.revenue || 0))
            }))}
            keys={['value']}
            indexBy="category"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            colors={{ scheme: "paired" }}
            axisBottom={{
              legend: "Category",
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              legend: "Value",
              legendOffset: -40,
              legendPosition: "middle",
            }}
          />
        </div>
      );
    } else if (dataKeys.includes('period')) {
      return (
        <div style={{ height: "400px" }}>
          <ResponsiveLine
            data={[{
              id: "Value",
              data: rawData.drillDown.map((d) => ({
                x: d.period,
                y: Number(d.value || d.revenue || 0),
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
              legend: "Period",
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              legend: "Value",
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
      // Default to pie chart for other data structures
      const labelKey = dataKeys.find(key => key !== 'value' && key !== 'revenue') || dataKeys[0];
      return (
        <div style={{ height: "400px" }}>
          <ResponsivePie
            data={rawData.drillDown.map((item) => ({
              id: item[labelKey] || 'Unknown',
              label: item[labelKey] || 'Unknown',
              value: Math.round(Number(item.value || item.revenue || 0))
            }))}
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
          />
        </div>
      );
    }
  };

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartDataHanlde();
  }, [dimensions, testCase]);

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
      { feature: "Drill Down (With custom handlers)", supported: true },
      { feature: "Cross-Chart Filtering (Need Manual setup)", supported: false },
      { feature: "Interactive Charts", supported: true },
      { feature: "Legend Toggle", supported: true },
      { feature: "Export Options (PNG, CSV) - (No built-in export, Need Manual setup)", supported: false },
      { feature: "Real-time Data Support (Need Manual setup)", supported: false },
      { feature: "Custom Options", supported: true },
      { feature: "TypeScript Support", supported: true },
      { feature: "Open Source", supported: true },
      { feature: "Drag and Drop (Need Custom Code not default)", supported: false },
    ],
     dataRecords: {
      "test-case-1": "1,000,000 Records",
      "test-case-2": "Records"
    },
  }

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard with Nivo Charts</h1>

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
        {renderDrillDown()}
      </ReusableChartDrawer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer
          isLoading={isLoading}
          title="Revenue Trends Over Time ( Click: Cross Chart Filter | Ctrl+Click: Drill Down )"
          data={rawData.line}
        >
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
                legend: "Period",
                legendOffset: 36,
                legendPosition: "middle",
              }}
              axisLeft={{
                legend: "Amount",
                legendOffset: -40,
                legendPosition: "middle",
              }}
              colors={{ scheme: "nivo" }}
              pointSize={10}
              pointColor={{ theme: "background" }}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              useMesh={true}
              onClick={(point, event) => {
                if (point.data) {
                  if (event.ctrlKey || event.metaKey) {
                    handleDrillDown('line', point.data.x as string, point.data.y, point.serieId as string);
                  } else {
                    // @ts-ignore
                    setDimensions(handleCrossChartFilteringFunc(String(point.data.x)));
                  }
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
                  // onClick: (datum) => alert(datum.label),

                }
              ]}
            />
          </div>
        </ChartContainer>

        <ChartContainer
          isLoading={isLoading}
          title="Revenue vs Expenses"
          data={rawData.bar}
        >
          <div style={{ height: "400px" }}>
            <ResponsiveBar
              data={barChartData.map((item) => ({
                period: item.period || 'Unknown',
                revenue: Math.round(Number(item.revenue || 0)),
                expenses: Math.round(Number(item.expenses || 0)),
              }))}
              keys={["revenue", "expenses"]}
              indexBy="period"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              groupMode="grouped"
              colors={{ scheme: "paired" }}
              axisBottom={{
                legend: "Period",
                legendOffset: 36,
                // legendPosition: "middle",
              }}
              axisLeft={{
                legend: "Amount",
                legendOffset: -40,
                // legendPosition: "middle",
              }}
              onClick={(data) => {
                // @ts-ignore
                handleDrillDown('bar', data.data.period, data.data[data.id], data.id);
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
            />
          </div>
        </ChartContainer>

        <ChartContainer
          isLoading={isLoading}
          title="Financial Distribution"
          data={rawData.pie}
        >
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
        </ChartContainer>

        <ChartContainer
          isLoading={isLoading}
          title="Revenue by Category"
          data={rawData.donut}
        >
          <div style={{ height: "400px" }}>
            <ResponsivePie
              data={donutChartData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}  // This creates the donut effect
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
        </ChartContainer>
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">
        <i>Click on any chart element to drill down into more detailed data</i>
      </p>
    </section>
  );
}