"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";
import { GroupModal } from "../../components/GroupManagement";
import {
  useFetchDrillDownDataMutation,
  databaseName,
  useFetchChartDataMutation
} from "@/lib/services/usersApi";

import { buildRequestBody, handleCrossChartFilteringFunc } from "@/lib/services/buildWhereClause";
import { ActionButton } from "@/components/ui/action-button";
import { ErrorAlert, LoadingAlert } from "@/components/ui/status-alerts";

// Types
import { BarChartData, Dimensions, DonutChartData, LineChartData, PieChartData } from '@/types/Schemas';
import { ChartSkelten } from "@/components/ui/ChartSkelten";
import ChartDrawer, { useChartDrawer } from "@/components/ChartDrawer";
import ReusableChartDrawer from "@/components/ChartDrawer";
import DashboardInfoCard from "@/components/DashboardInfoCard";

// Common props for components
interface CommonProps {
  title: string;
  data?: any[];
  onDrillDown?: (type: string, category: string, value: any, dataType: string) => void;
}

// Main AG Charts Page Component
const AgChartsPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  // API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation();
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();


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
    line: AgChartOptions | null,
    bar: AgChartOptions | null,
    pie: AgChartOptions | null,
    donut: AgChartOptions | null,
    drillDown: AgChartOptions | null
  }>({
    line: null,
    bar: null,
    pie: null,
    donut: null,
    drillDown: null
  });

  const { drillDownState, openDrawer, closeDrawer, isOpen } = useChartDrawer();



  const handleCrossChartFiltering = (data: string) => {
    // @ts-ignore   
    setDimensions(handleCrossChartFilteringFunc(data))
  }

  // Fetch all chart data
  const fetchAllChartDataHanlde = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all chart data
      const result = await fetchAllChartData({
        body: buildRequestBody(dimensions, 'all')
      }).unwrap();
      if (!result || !result.success) {
        throw new Error(result?.message || "Failed to fetch chart data");
      }
      // Process line chart data
      const lineData = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
      const lineOpts = lineData.length ? {
        title: { text: "Revenue Trends Over Time" },
        subtitle: { text: "Showing financial metrics by period" },
        data: lineData,
        series: [
          {
            type: "line",
            xKey: "period",
            yKey: "revenue",
            yName: "Revenue",
            tooltip: { enabled: true },
          },
          {
            type: "line",
            xKey: "period",
            yKey: "grossMargin",
            yName: "Gross Margin",
            tooltip: { enabled: true },
          },
          {
            type: "line",
            xKey: "period",
            yKey: "netProfit",
            yName: "Net Profit",
            tooltip: { enabled: true },
          },
        ],
        axes: [
          { type: "category", position: "bottom", title: { text: "Period" } },
          { type: "number", position: "left", title: { text: "Amount ($)" } },
        ],
        listeners: {
          // @ts-ignore
          seriesNodeClick: (event) => {
            const { datum, yKey } = event;

            if (datum && datum.period) {
              const nativeEvent = event.event;
              if (nativeEvent?.ctrlKey || nativeEvent?.metaKey) {
                // Ctrl/Cmd + Click = Drill Down
                handleDrillDown("line", datum.period, datum[yKey], yKey);
              } else {
                // Regular Click = Cross Chart Filter
                handleCrossChartFiltering(datum.period);
              }
            }
          },

        }
      } : null;

      // Process bar chart data
      const barData = result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [];
      const barOpts = barData.length ? {
        title: { text: "Revenue vs Expenses" },
        data: barData,
        series: [
          {
            type: "bar",
            xKey: "period",
            yKey: "revenue",
            yName: "Revenue",
            tooltip: { enabled: true }
          },
          {
            type: "bar",
            xKey: "period",
            yKey: "expenses",
            yName: "Expenses",
            tooltip: { enabled: true }
          },
        ],
        axes: [
          { type: 'category', position: 'bottom', title: { text: 'Period' } },
          { type: 'number', position: 'left', title: { text: 'Amount ($)' } }
        ],
        listeners: {
          // @ts-ignore
          seriesNodeClick: ({ datum, yKey }) => {
            if (datum && datum.period) {
              handleDrillDown('bar', datum.period, datum[yKey], yKey);
            }
          }
        }
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
          tooltip: { enabled: true },
          calloutLabel: { enabled: true },
          sectorLabelKey: 'catfinancialview',
          listeners: {
            // @ts-ignore
            nodeClick: (event) => {
              const { datum } = event;
              if (datum) {
                handleDrillDown('pie', datum.catfinancialview, datum.revenue, 'revenue');
              }
            }
          }
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
          tooltip: { enabled: true },
          calloutLabel: { enabled: true },
          sectorLabelKey: 'cataccountingview',
          listeners: {
            // @ts-ignore
            nodeClick: (event) => {
              const { datum } = event;
              if (datum) {
                handleDrillDown('donut', datum.cataccountingview, datum.revenue, 'revenue');
              }
            }
          }
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
        drillDown: null
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

        // Create chart options based on API response
        let options: AgChartOptions;
        const columns = result.columns || Object.keys(drillData[0]);

        // Determine chart type based on data structure
        if (columns.includes('catfinancialview') || columns.includes('cataccountingview')) {
          options = {
            title: { text: title },
            data: drillData,
            series: [{
              type: 'bar',
              // @ts-ignore
              xKey: columns.find(col => col.includes('cat')) || columns[0],
              yKey: 'value',
              yName: 'Value',
              tooltip: { enabled: true }
            }],
            axes: [
              { type: 'category', position: 'bottom' },
              { type: 'number', position: 'left', title: { text: 'Value ($)' } }
            ],
          };
        } else if (columns.includes('period')) {
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
              { type: 'number', position: 'left', title: { text: 'Value ($)' } }
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
          drillDown: options
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

  const dashboardInfoDatas = {
    apiEndpoints: [
      { method: "GET", apiName: "api/dashboard/all-charts?table_name=sample_1m", api: "https://testcase.mohammedsifankp.online/api/dashboard/all-charts?table_name=sample_1m", description: "Fetch all chart data for the dashboard" },
      { method: "POST", apiName: "api/dashboard/tables/sample_1m/dimensions", api: "https://testcase.mohammedsifankp.online/api/dashboard/tables/sample_1m/dimensions", description: "Fetch dimensions for the dashboard" },
      { method: "POST", apiName: "api/dashboard/drill-down?table_name=sample_1m&chart_type=bar&category=201907&data_type=revenue&value=4299212962.550013", api: "https://testcase.mohammedsifankp.online/api/dashboard/drill-down?table_name=sample_1m&chart_type=bar&category=201907&data_type=revenue&value=4299212962.550013", description: "Fetch Drill Down datas" },
    ],
  availableFeatures : [
  { feature: "Drill Down", supported: true },
  { feature: "Cross-Chart Filtering (But only Enterprise version)", supported: true },
  { feature: "Interactive Charts", supported: true },
  { feature: "Legend Toggle", supported: true },
  { feature: "Export Options (PNG, CSV)", supported: true },
  { feature: "Real-time Data Support", supported: true },
  { feature: "Custom Options", supported: true },
  { feature: "TypeScript Support", supported: true },
  { feature: "Open Source", supported: true },
  { feature: "Drag and Drop (Need Custom Code not default)", supported: false },
],
    dataRecords: "1 Million Records"
  }


  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Ag Charts</h1>

       <DashboardInfoCard
        apiEndpoints={dashboardInfoDatas?.apiEndpoints}
        availableFeatures={dashboardInfoDatas?.availableFeatures}
        dataRecords={dashboardInfoDatas?.dataRecords}
      />
      
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

      {isLoading && <LoadingAlert />}
      <ReusableChartDrawer
        isOpen={isOpen}
        drillDownState={drillDownState}
        onBack={closeDrawer}
        isLoading={isLoading}
        showBackButton={true}
        showCloseButton={true}
      >
        {chartOptions.drillDown && (
          <AgCharts options={chartOptions.drillDown} />
        )}
      </ReusableChartDrawer>
     
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartContainer title="Revenue Trends with Cross Chart Filter" isLoading={isLoading} data={chartData.line}>
          <AgCharts options={chartOptions.line || {}} />
        </ChartContainer>
        <ChartContainer title="Revenue vs Expenses" isLoading={isLoading} data={chartData.bar}>
          <AgCharts options={chartOptions.bar || {}} />
        </ChartContainer>
        <ChartContainer title="Financial Distribution" isLoading={isLoading} data={chartData.pie}>
          <AgCharts options={chartOptions.pie || {}} />
        </ChartContainer>
        <ChartContainer title="Revenue by Category" isLoading={isLoading} data={chartData.donut}>
          <AgCharts options={chartOptions.donut || {}} />
        </ChartContainer>
        <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
          <i>Click on any chart element to drill down into more detailed data</i>
        </p>
      </div>
    </section>
  );
};

// Chart container component
const ChartContainer: React.FC<CommonProps & {
  children: React.ReactNode;
  isDrilled?: boolean;
  onBack?: () => void;
  isLoading: boolean;
}> = ({ title, children, data, isDrilled, onBack, isLoading }) => {
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
              >
                PNG
              </button>
              <button
                onClick={exportToCSV}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                CSV
              </button>
            </div>
          </div>
          <div ref={chartRef}>
            {children}
          </div>
        </>
      ) : (
        <ChartSkelten />
      )}
    </div>
  );
};

export default AgChartsPage;