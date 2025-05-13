"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Plot from "react-plotly.js";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { GroupModal } from "@/components/GroupManagement";
import { buildWhereClause } from "@/lib/services/buildWhereClause";

// Constants
const DEFAULT_CONFIGURATION = {
  responsive: true,
  displayModeBar: false,
  modeBarButtonsToRemove: ['editInChartStudio', 'zoom2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d']
};

const CHART_COLORS = [
  'rgb(75, 192, 192)',
  'rgb(255, 99, 132)',
  'rgb(53, 162, 235)',
  'rgb(255, 206, 86)',
  'rgb(153, 102, 255)',
  'rgb(255, 159, 64)'
];

// Interfaces
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  onDownloadCSV?: () => void;
  onDownloadImage?: () => void;
  isDrilled?: boolean;
  onBack?: () => void;
}

interface DrillDownState {
  active: boolean;
  chartType: 'line' | 'bar' | 'pie' | 'donut';
  category: string;
  title: string;
  dataType?: string;
}

type DimensionSelection = {
  dimension: string;
  members: string[];
};

type Dimensions = {
  groupName: string;
  filteredSelections: DimensionSelection[];
};

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

interface PieChartData {
  grossMargin: number;
  operatingExpenses: number;
  netProfit: number;
  revenue: number;
}

interface DonutChartData {
  catAccountingView: string;
  revenue: number;
}


// Memoized Chart Container Component
const ChartContainer = React.memo(({
  title,
  children,
  onDownloadCSV,
  onDownloadImage,
  isDrilled,
  onBack
}: ChartContainerProps) => (
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
      {(onDownloadCSV || onDownloadImage) && (
        <div className="flex gap-2 mb-4">
          {onDownloadImage && (
            <button onClick={onDownloadImage} className="px-4 py-2 bg-blue-500 text-white rounded">
              Download Image
            </button>
          )}
          {onDownloadCSV && (
            <button onClick={onDownloadCSV} className="px-4 py-2 bg-green-500 text-white rounded">
              Download CSV
            </button>
          )}
        </div>
      )}
    </div>
    <div className="">{children}</div>
  </div>
));

// Drill Down Chart Component
const DrillDownChart = React.memo(({
  drillDownState,
  drillDownData,
  onBack
}: {
  drillDownState: DrillDownState;
  drillDownData: any;
  onBack: () => void;
}) => {
  const plotRef = useRef<any>(null);

  const handleDownloadImage = useCallback(() => {
    if (plotRef.current?.el) {
      // @ts-ignore
      Plotly.downloadImage(plotRef.current.el, {
        format: 'png',
        filename: `${drillDownState.title.replace(/\s+/g, "_").toLowerCase()}`
      });
    }
  }, [drillDownState.title]);

  const handleDownloadCSV = useCallback(() => {
    if (!drillDownData) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    if (drillDownState.chartType === 'bar' || drillDownState.chartType === 'line') {
      const xValues = drillDownData[0].x;
      csvContent += ["Category", ...xValues].join(",") + "\n";
      drillDownData.forEach((trace: any) => {
        csvContent += [trace.name, ...trace.y].join(",") + "\n";
      });
    } else if (drillDownState.chartType === 'pie') {
      csvContent += "Label,Value\n";
      drillDownData[0].labels.forEach((label: string, i: number) => {
        csvContent += `${label},${drillDownData[0].values[i]}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${drillDownState.title.replace(/\s+/g, "_").toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [drillDownData, drillDownState.title, drillDownState.chartType]);

  const renderDrillDownChart = useCallback(() => {
    const commonProps = {
      ref: plotRef,
      data: drillDownData,
      style: { width: "100%", height: "100%" },
      config: DEFAULT_CONFIGURATION
    };

    switch (drillDownState.chartType) {
      case 'line':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true }} />;
      case 'bar':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, barmode: 'group', autosize: true }} />;
      case 'pie':
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true }} />;
      default:
        return <Plot {...commonProps} layout={{ title: drillDownState.title, autosize: true }} />;
    }
  }, [drillDownData, drillDownState.chartType, drillDownState.title]);

  return (
    <ChartContainer
      title={drillDownState.title}
      onDownloadCSV={handleDownloadCSV}
      onDownloadImage={handleDownloadImage}
      isDrilled={true}
      onBack={onBack}
    >
      {renderDrillDownChart()}
    </ChartContainer>
  );
});

export default function FinancialDashboard() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);

  // Chart data states
  const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData | null >(null);
  const [donutChartData, setDonutChartData] = useState<DonutChartData[]>([]);

  // Drill-down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "bar",
    category: "",
    title: ""
  });
  const [drillDownData, setDrillDownData] = useState<any>(null);

  // Refs for chart components
  const linePlotRef = useRef<any>(null);
  const barPlotRef = useRef<any>(null);
  const piePlotRef = useRef<any>(null);
  const donutPlotRef = useRef<any>(null);

  // Reset drill down state
  const resetDrillDown = useCallback(() => {
    setDrillDown({
      active: false,
      chartType: "bar",
      category: "",
      title: ""
    });
    setDrillDownData(null);
  }, []);

  const handleCreateGroup = useCallback((datas: any) => {
    setDimensions(datas);
  }, []);

  // Fetch all chart data
  const fetchChartData = useCallback(async () => {
    if (!isDataLoaded) return;

    setIsLoading(true);
    const whereClause = buildWhereClause(dimensions);

    try {
      const [lineRes, barRes, pieRes, donutRes] = await Promise.all([
        executeQuery(`SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
        executeQuery(`SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
        executeQuery(`SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as operatingExpenses, SUM(netProfit) as netProfit, SUM(revenue) as revenue FROM financial_data ${whereClause}`),
        executeQuery(`SELECT catAccountingView, SUM(revenue) as revenue FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC`)
      ]);


       if (lineRes.success) setLineChartData(lineRes.data as LineChartDataPoint[]);
        if (barRes.success) setBarChartData(barRes.data as BarChartDataPoint[]);
        if (pieRes.success && pieRes.data) setPieChartData(pieRes.data[0] as PieChartData);
        if (donutRes.success) setDonutChartData(donutRes.data as DonutChartData[]);

      setError(null);
    } catch (err) {
      setError("Failed to load chart data.");
      console.error("Error fetching chart data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dimensions, isDataLoaded, executeQuery]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Event handlers for chart clicks
  const handleChartClick = useCallback(async (chartType: string, point: any) => {
    if (!point || !isDataLoaded) return;

    let category = point.x || point.label;
    let dataType = point.data?.name?.toLowerCase() || point.label;

    await handleDrillDown(chartType, category, dataType);
  }, [isDataLoaded]);

  const handleLineChartClick = useCallback((data: any) => {
    if (data?.points?.[0]) {
      handleChartClick('line', data.points[0]);
    }
  }, [handleChartClick]);

  const handleBarChartClick = useCallback((data: any) => {
    if (data?.points?.[0]) {
      handleChartClick('bar', data.points[0]);
    }
  }, [handleChartClick]);

  const handlePieChartClick = useCallback((data: any) => {
    if (data?.points?.[0]) {
      handleChartClick('pie', data.points[0]);
    }
  }, [handleChartClick]);

  const handleDonutChartClick = useCallback((data: any) => {
    if (data?.points?.[0]) {
      handleChartClick('donut', data.points[0]);
    }
  }, [handleChartClick]);

  // Attach event handlers after data loads
  useEffect(() => {
    if (isLoading || drillDown.active) return;

    const attachHandlers = () => {
      if (linePlotRef.current?.el) linePlotRef.current.el.on('plotly_click', handleLineChartClick);
      if (barPlotRef.current?.el) barPlotRef.current.el.on('plotly_click', handleBarChartClick);
      if (piePlotRef.current?.el) piePlotRef.current.el.on('plotly_click', handlePieChartClick);
      if (donutPlotRef.current?.el) donutPlotRef.current.el.on('plotly_click', handleDonutChartClick);
    };

    const timeoutId = setTimeout(attachHandlers, 100);
    return () => clearTimeout(timeoutId);
  }, [isLoading, drillDown.active, handleLineChartClick, handleBarChartClick, handlePieChartClick, handleDonutChartClick]);

  // Generic drill down function
  const handleDrillDown = useCallback(async (chartType: string, category: string, dataType: string) => {
    if (!isDataLoaded) return;

    setIsLoading(true);
    try {
      const dimensionsWhereClause = buildWhereClause(dimensions);
      let baseWhereClause = dimensionsWhereClause 
        ? `WHERE ${dimensionsWhereClause.replace('WHERE ', '')}`
        : '';

      let query = '';
      let title = '';
      let drillChartType: 'line' | 'bar' | 'pie' = 'bar';

      switch (chartType) {
        case 'bar':
          if (dataType === 'revenue') {
            query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${baseWhereClause ? 'AND ' + baseWhereClause.replace('WHERE ', '') : ''}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Revenue Breakdown for Period: ${category}`;
          } else if (dataType === 'expenses') {
            query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${baseWhereClause ? 'AND ' + baseWhereClause.replace('WHERE ', '') : ''}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Expenses Breakdown for Period: ${category}`;
          }
          break;

        case 'line':
          query = `SELECT fiscalYear, catFinancialView, SUM(${dataType}) as value 
                   FROM financial_data 
                   WHERE period = '${category}' ${baseWhereClause ? 'AND ' + baseWhereClause.replace('WHERE ', '') : ''}
                   GROUP BY fiscalYear, catFinancialView
                   ORDER BY value DESC`;
          title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
          break;

        case 'donut':
          query = `SELECT fiscalYear, period, SUM(revenue) as value 
                   FROM financial_data 
                   WHERE catAccountingView = '${category}' ${baseWhereClause ? 'AND ' + baseWhereClause.replace('WHERE ', '') : ''}
                   GROUP BY fiscalYear, period
                   ORDER BY fiscalYear, period`;
          title = `Revenue Breakdown for Category: ${category}`;
          drillChartType = 'line';
          break;

        case 'pie':
          const metricColumn = dataType.toLowerCase().replace(/\s+/g, '');
          query = `SELECT catFinancialView, SUM(${dataType}) as value 
                   FROM financial_data 
                   ${baseWhereClause}
                   GROUP BY catFinancialView
                   ORDER BY value DESC`;
          title = `${dataType} Breakdown by Financial Category`;
          drillChartType = 'pie';
          break;
      }

      if (query) {
        const result = await executeQuery(query);
        if (result.success && result.data?.length) {
          const formattedData = formatDrillDownData(result.data, drillChartType);
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error in drill-down:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dimensions, isDataLoaded, executeQuery]);

  // Format drill down data for Plotly
  const formatDrillDownData = useCallback((data: any[], chartType: 'line' | 'bar' | 'pie') => {
    if (chartType === 'bar') {
      if (data[0]?.fiscalYear) {
        const categories = Array.from(new Set(data.map(d => d.catFinancialView)));
        const fiscalYears = Array.from(new Set(data.map(d => d.fiscalYear)));

        return fiscalYears.map((year, idx) => ({
          x: categories,
          y: categories.map(cat => {
            const match = data.find(d => d.fiscalYear === year && d.catFinancialView === cat);
            return match ? match.value : 0;
          }),
          type: 'bar',
          name: `Year ${year}`,
          marker: { color: CHART_COLORS[idx % CHART_COLORS.length] }
        }));
      }
      return [{
        x: data.map(d => d.catFinancialView || d.period),
        y: data.map(d => d.value),
        type: 'bar',
        name: 'Value',
        marker: { color: CHART_COLORS[0] }
      }];
    } else if (chartType === 'line') {
      if (data[0]?.period) {
        const fiscalYears = Array.from(new Set(data.map(d => d.fiscalYear)));
        const periods = Array.from(new Set(data.map(d => d.period))).sort();

        return fiscalYears.map((year, idx) => ({
          x: periods,
          y: periods.map(period => {
            const match = data.find(d => d.fiscalYear === year && d.period === period);
            return match ? match.value : 0;
          }),
          type: 'scatter',
          mode: 'lines+markers',
          name: `Year ${year}`,
          line: { color: CHART_COLORS[idx % CHART_COLORS.length] }
        }));
      }
      return [{
        x: data.map(d => d.period || d.fiscalYear),
        y: data.map(d => d.value),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Value',
        line: { color: CHART_COLORS[0] }
      }];
    } else if (chartType === 'pie') {
      return [{
        values: data.map(d => d.value),
        labels: data.map(d => d.catFinancialView),
        type: 'pie',
        marker: { colors: CHART_COLORS }
      }];
    }
    return [];
  }, []);

  // Handle downloads
  const handleDownloadImage = useCallback((plotRef: React.RefObject<any>, title: string) => {
    if (plotRef.current?.el) {
      // @ts-ignore
      Plotly.downloadImage(plotRef.current.el, {
        format: 'png',
        filename: title.replace(/\s+/g, "_").toLowerCase()
      });
    }
  }, []);

  const handleDownloadCSV = useCallback((chartData: any, title: string, chartType: string) => {
    if (!chartData) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    if (chartType === 'line') {
      csvContent += ["Period", "Revenue", "Gross Margin", "Net Profit"].join(",") + "\n";
      chartData.forEach((data: any) => {
        csvContent += [data.period, data.revenue, data.grossMargin, data.netProfit].join(",") + "\n";
      });
    } else if (chartType === 'bar') {
      csvContent += ["Period", "Revenue", "Expenses"].join(",") + "\n";
      chartData.forEach((data: any) => {
        csvContent += [data.period, data.revenue, data.expenses].join(",") + "\n";
      });
    } else if (chartType === 'pie' && pieChartData) {
      csvContent += "Category,Value\n";
      csvContent += `Revenue,${pieChartData.revenue}\n`;
      csvContent += `Gross Margin,${pieChartData.grossMargin}\n`;
      csvContent += `Net Profit,${pieChartData.netProfit}\n`;
      csvContent += `Operating Expenses,${pieChartData.operatingExpenses}\n`;
    } else if (chartType === 'donut') {
      csvContent += "Category,Revenue\n";
      chartData.forEach((data: any) => {
        csvContent += `${data.catAccountingView},${data.revenue}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, "_").toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pieChartData]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading financial data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard</h1>

      <div className="flex flex-row justify-between items-center mb-6">
        <div>
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
            <div>
              <button 
                onClick={() => setDimensions(null)} 
                className="shadow-xl border bg-red-400 p-2 rounded text-white mr-2"
              >
                Reset Group
              </button>
              <button 
                onClick={() => setIsGroupModalOpen(true)} 
                className="shadow-xl border bg-blue-400 p-2 rounded text-white"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      </div>

      {drillDown.active && drillDownData ? (
        <DrillDownChart
          drillDownState={drillDown}
          drillDownData={drillDownData}
          onBack={resetDrillDown}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartContainer
            title="Monthly Performance (Line)"
            onDownloadCSV={() => handleDownloadCSV(lineChartData, "Monthly_Performance", "line")}
            onDownloadImage={() => handleDownloadImage(linePlotRef, "Monthly_Performance")}
          >
            <Plot
              key={`line-chart-${dimensions?.groupName || 'default'}`}
              ref={linePlotRef}
              data={[
                {
                  x: lineChartData.map(d => d.period),
                  y: lineChartData.map(d => d.revenue),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Revenue",
                  line: { color: "blue" },
                },
                {
                  x: lineChartData.map(d => d.period),
                  y: lineChartData.map(d => d.grossMargin),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "GrossMargin",
                  line: { color: "purple" },
                },
                {
                  x: lineChartData.map(d => d.period),
                  y: lineChartData.map(d => d.netProfit),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "NetProfit",
                  line: { color: "green" },
                },
              ]}
              layout={{
                title: "Monthly Performance",
                autosize: true,
                xaxis: { tickformat: 'digits' }
              }}
              style={{ width: "100%", height: "100%" }}
              config={DEFAULT_CONFIGURATION}
            />
          </ChartContainer>

          <ChartContainer
            title="Revenue vs Expenses (Bar)"
            onDownloadCSV={() => handleDownloadCSV(barChartData, "Revenue_vs_Expenses", "bar")}
            onDownloadImage={() => handleDownloadImage(barPlotRef, "Revenue_vs_Expenses")}
          >
            <Plot
              key={`bar-chart-${dimensions?.groupName || 'default'}`}
              ref={barPlotRef}
              data={[
                {
                  x: barChartData.map(d => d.period),
                  y: barChartData.map(d => d.revenue),
                  type: "bar",
                  name: "Revenue",
                  marker: { color: "teal" },
                },
                {
                  x: barChartData.map(d => d.period),
                  y: barChartData.map(d => d.expenses),
                  type: "bar",
                  name: "Expenses",
                  marker: { color: "orange" },
                },
              ]}
              layout={{
                title: "Revenue vs Operating Expenses",
                barmode: "group",
                autosize: true,
                xaxis: { tickformat: 'digits' }
              }}
              config={DEFAULT_CONFIGURATION}
            />
          </ChartContainer>

          <ChartContainer
            title="Financial Breakdown (Pie)"
            onDownloadCSV={() => handleDownloadCSV(pieChartData, "Revenue", "line")}
            onDownloadImage={() => handleDownloadImage(piePlotRef, "Revenue")}
          >
            <Plot
              key={`pie-chart-${dimensions?.groupName || 'default'}`}
              ref={piePlotRef}
              data={[{
                values: [
                  pieChartData?.revenue || 0,
                  pieChartData?.grossMargin || 0,
                  pieChartData?.netProfit || 0,
                  pieChartData?.operatingExpenses || 0,
                ],
                labels: ["Revenue", "GrossMargin", "NetProfit", "OperatingExpenses"],
                type: "pie",
              }]}
              layout={{ title: "Financial Distribution" }}
              config={DEFAULT_CONFIGURATION}
            />
          </ChartContainer>

          <ChartContainer
            title="Category-wise Revenue (Donut)"
            onDownloadCSV={() => handleDownloadCSV(donutChartData, "Revenue_by_Category", "line")}
            onDownloadImage={() => handleDownloadImage(donutPlotRef, "Revenue_by_Category")}
          >
            <Plot
              key={`donut-chart-${dimensions?.groupName || 'default'}`}
              ref={donutPlotRef}
              data={[{
                values: donutChartData.map(d => d.revenue),
                labels: donutChartData.map(d => d.catAccountingView),
                type: "pie",
                hole: 0.5,
              }]}
              layout={{ title: "Revenue by Category" }}
              config={DEFAULT_CONFIGURATION}
            />
          </ChartContainer>
        </div>
      )}
    </section>
  );
};