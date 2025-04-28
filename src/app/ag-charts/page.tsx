"use client";
import React, { useState, useEffect, useRef } from "react";
import { AgCharts } from "ag-charts-react";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { AgChartOptions } from "ag-charts-community";

// Core data types
interface ChartDataPoint {
  period?: string;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
  catAccountingView?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

// Common props for components
interface CommonProps {
  title: string;
  data?: any[];
  onDrillDown?: (type: string, category: string, value: any, dataType: string) => void;
}

// Drill-down state interface
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
}

// Chart container component
const ChartContainer: React.FC<CommonProps & {
  children: React.ReactNode;
  isDrilled?: boolean;
  onBack?: () => void;
}> = ({ title, children, data, isDrilled, onBack }) => {
  const chartRef = useRef<HTMLDivElement>(null);

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
    link.setAttribute('download', `chart_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PNG export function
  const exportToPNG = () => {
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
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
    </div>
  );
};

// Filter bar component
const FilterBar: React.FC<{
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  onResetDrillDown?: () => void;
  isDrilled: boolean;
}> = ({ years, selectedYear, onYearChange, onResetDrillDown, isDrilled }) => (
  <div className="mb-6 flex items-center">
    <label className="mr-2 font-medium">Year:</label>
    <select
      value={selectedYear}
      onChange={(e) => onYearChange(e.target.value)}
      className="border border-gray-300 rounded px-3 py-2"
    >
      <option value="all">All Years</option>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
    
    {isDrilled && (
      <button
        onClick={onResetDrillDown}
        className="ml-4 px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
      >
        Reset Drill Down
      </button>
    )}
  </div>
);

// Separated Drill Down Component
const DrillDownChart: React.FC<{
  drillDownState: DrillDownState;
  drillDownData: any[];
  drillDownOptions: AgChartOptions | null;
  onBack: () => void;
}> = ({ drillDownState, drillDownData, drillDownOptions, onBack }) => {
  return (
    <div className="mb-4">
      <ChartContainer 
        title={drillDownState.title} 
        data={drillDownData}
        onBack={onBack}
        isDrilled={true}
      >
        {drillDownOptions && <AgCharts options={drillDownOptions} />}
      </ChartContainer>
      <p className="mt-2 text-sm text-gray-500">
        <i>Click any data point for further drill-down, or use the back button to return</i>
      </p>
    </div>
  );
};

// Main AG Charts Page Component
const AgChartsPage: React.FC = () => {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [years, setYears] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Drill down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });

  // Chart data states
  const [chartData, setChartData] = useState<{
    line: ChartDataPoint[],
    bar: ChartDataPoint[],
    pie: ChartDataPoint[],
    donut: ChartDataPoint[],
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

  // Reset drill down
  const resetDrillDown = () => {
    setDrillDown({
      active: false,
      chartType: "",
      category: "",
      title: ""
    });
  };

  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchYears = async () => {
      try {
        const result = await executeQuery("SELECT DISTINCT fiscalYear FROM financial_data ORDER BY fiscalYear");
        if (result.success && result.data) {
          setYears(result.data.map((row: { fiscalYear: string }) => row.fiscalYear));
        }
      } catch (err) {
        console.error("Failed to fetch years:", err);
        setError("Failed to load year data");
      }
    };

    fetchYears();
  }, [isDataLoaded, executeQuery]);

  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      const whereClause = selectedYear !== "all" ? `WHERE fiscalYear = '${selectedYear}'` : "";

      try {
        const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
          executeQuery(`SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as operatingExpenses, SUM(netProfit) as netProfit, SUM(revenue) as revenue FROM financial_data ${whereClause}`),
          executeQuery(`SELECT catAccountingView, SUM(revenue) as revenue FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC`)
        ]);

        // Process line chart data
        const lineData = lineResult.success ? lineResult.data || [] : [];
        const lineOpts = lineData.length ? {
          title: { text: "Profit & Loss Accounts" },
          subtitle: { text: "Showing numbers in $" },
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
            seriesNodeClick: ({ datum, yKey }) => {
              if (datum && datum.period) {
                handleDrillDown("line", datum.period, datum[yKey], yKey);
              }
            },
          }
        } : null;

        // Process bar chart data
        const barData = barResult.success ? barResult.data || [] : [];
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
        let pieData: ChartDataPoint[] = [];
        if (pieResult.success && pieResult.data?.length) {
          pieData = Object.entries(pieResult.data[0])
            .map(([key, value]) => ({ label: key, value: value as number }));
        }
        const pieOpts = pieData.length ? {
          title: { text: "Financial Distribution" },
          data: pieData,
          series: [{ 
            type: "pie", 
            angleKey: "value", 
            labelKey: "label",
            tooltip: { enabled: true },
            calloutLabel: { enabled: true },
            listeners: {
                // @ts-ignore
              nodeClick: (event) => {
                const { datum } = event;
                if (datum) {
                  handleDrillDown('pie', datum.label, datum.value, 'financialDistribution');
                }
              }
            }
          }],
        } : null;

        // Process donut chart data
        const donutData = donutResult.success ? donutResult.data || [] : [];
        const donutOpts = donutData.length ? {
          title: { text: "Revenue by Category" },
          data: donutData,
          series: [{ 
            type: "donut", 
            angleKey: "revenue", 
            labelKey: "catAccountingView",
            tooltip: { enabled: true },
            calloutLabel: { enabled: true },
            listeners: {
              // @ts-ignore
              nodeClick: (event) => {
                const { datum } = event;
                if (datum) {
                  handleDrillDown('donut', datum.catAccountingView, datum.revenue, 'categoryRevenue');
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

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        console.error("Error fetching chart data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedYear, isDataLoaded, executeQuery]);

  // Handle drill down - moved to a separate function
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
    if (!isDataLoaded) return;
    
    setIsLoading(true);
    setError(null);
    const whereClause = selectedYear !== "all" ? `AND fiscalYear = '${selectedYear}'` : "";
    
    try {
      let query = "";
      let title = "";
      
      switch (chartType) {
        case 'bar':
          if (dataType === 'revenue') {
            query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${whereClause}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Revenue Breakdown for Period: ${category}`;
          } else if (dataType === 'expenses') {
            query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${whereClause}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Expenses Breakdown for Period: ${category}`;
          }
          break;
          
        case 'line':
          query = `SELECT fiscalYear, catFinancialView, SUM(${dataType}) as value 
                   FROM financial_data 
                   WHERE period = '${category}' ${whereClause}
                   GROUP BY fiscalYear, catFinancialView
                   ORDER BY value DESC`;
          title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
          break;
          
        case 'donut':
          query = `SELECT fiscalYear, period, SUM(revenue) as value 
                   FROM financial_data 
                   WHERE catAccountingView = '${category}' ${whereClause}
                   GROUP BY fiscalYear, period
                   ORDER BY fiscalYear, period`;
          title = `Revenue Breakdown for Category: ${category}`;
          break;
          
        case 'pie':
          if (dataType === 'financialDistribution') {
            query = `SELECT catFinancialView, SUM(${category}) as value 
                     FROM financial_data 
                     WHERE 1=1 ${whereClause}
                     GROUP BY catFinancialView
                     ORDER BY value DESC`;
            title = `${category} Breakdown by Financial Category`;
          }
          break;
      }
      
      if (query) {
        const result = await executeQuery(query);
        if (result.success && result.data && result.data.length > 0) {
          const drillData = result.data;
          
          // Create appropriate chart options based on data structure
          const firstDataPoint = drillData[0];
          const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];
          let options: AgChartOptions;
          
          if (dataKeys.includes('catFinancialView')) {
            options = {
              title: { text: title },
              data: drillData,
              series: [{ 
                type: 'bar', 
                xKey: 'catFinancialView', 
                yKey: 'value',
                yName: 'Value',
                tooltip: { enabled: true }
              }],
              axes: [
                { type: 'category', position: 'bottom' },
                { type: 'number', position: 'left', title: { text: 'Value ($)' } }
              ],
            };
          } else if (dataKeys.includes('period')) {
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
            const labelKey = dataKeys.find(key => key !== 'value') || dataKeys[0];
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
          
          // Update drill-down data and options
          setChartData(prev => ({
            ...prev,
            drillDown: drillData
          }));
          
          setChartOptions(prev => ({
            ...prev,
            drillDown: options
          }));
          
          setDrillDown({
            active: true,
            chartType,
            category,
            title
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
  };

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Ag Charts</h1>
      <FilterBar 
        years={years} 
        selectedYear={selectedYear} 
        onYearChange={setSelectedYear} 
        onResetDrillDown={resetDrillDown}
        isDrilled={drillDown.active}
      />
      
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {isLoading && <p className="text-gray-500 mb-2">Loading...</p>}
      
      {drillDown.active ? (
        // Use the separated drill-down component
        <DrillDownChart
          drillDownState={drillDown}
          drillDownData={chartData.drillDown}
          drillDownOptions={chartOptions.drillDown}
          onBack={resetDrillDown}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartOptions.line && (
            <ChartContainer title="Line Series" data={chartData.line}>
              <AgCharts options={chartOptions.line} />
            </ChartContainer>
          )}
          {chartOptions.bar && (
            <ChartContainer title="Bar Series" data={chartData.bar}>
              <AgCharts options={chartOptions.bar} />
            </ChartContainer>
          )}
          {chartOptions.pie && (
            <ChartContainer title="Pie Series" data={chartData.pie}>
              <AgCharts options={chartOptions.pie} />
            </ChartContainer>
          )}
          {chartOptions.donut && (
            <ChartContainer title="Donut Series" data={chartData.donut}>
              <AgCharts options={chartOptions.donut} />
            </ChartContainer>
          )}
          <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
            <i>Click on any chart element to drill down into more detailed data</i>
          </p>
        </div>
      )}
    </section>
  );
};

export default AgChartsPage;