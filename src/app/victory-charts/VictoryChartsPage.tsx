"use client";
import React, { useEffect, useState, useRef } from "react";
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
  VictoryScatter
} from "victory";
import { GroupModal } from "../../components/GroupManagement";
import { 
  useFetchLineChartDataMutation,
  useFetchBarChartDataMutation,
  useFetchPieChartDataMutation,
  useFetchDonutChartDataMutation,
  useFetchDrillDownDataMutation,
  databaseName
} from "@/lib/services/usersApi";
import { Dimensions } from "@/types/Schemas";
import { buildRequestBody } from "@/lib/services/buildWhereClause";

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

// Drill-down state interface
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
}

// Chart Container with Export functionality
const ChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  isDrilled?: boolean;
  data?: any[];
}> = ({ title, children, onBack, isDrilled, data }) => {
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
        
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const DOMURL = window.URL || window.webkitURL || window;
        const url = DOMURL.createObjectURL(svgBlob);
        
        img.onload = function() {
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          {isDrilled && onBack && (
            <button
              onClick={onBack}
              className="ml-3 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              ← Back
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
      <div className="w-full h-[400px]" ref={chartRef}>{children}</div>
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
  const [fetchLineChartData] = useFetchLineChartDataMutation();
  const [fetchBarChartData] = useFetchBarChartDataMutation();
  const [fetchPieChartData] = useFetchPieChartDataMutation();
  const [fetchDonutChartData] = useFetchDonutChartDataMutation();
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
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });

  // Reset drill down
  const resetDrillDown = () => {
    setDrillDown({
      active: false,
      chartType: "",
      category: "",
      title: ""
    });
    setChartData(prev => ({ ...prev, drillDown: [] }));
  };

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  };

  // Fetch all chart data using API
  const fetchAllChartData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch line chart data
      const lineResult = await fetchLineChartData({
        body: buildRequestBody(dimensions, 'line', 'country')
      }).unwrap();

      // Fetch bar chart data
      const barResult = await fetchBarChartData({
        body: buildRequestBody(dimensions, 'bar', 'country')
      }).unwrap();

      // Fetch pie chart data
      const pieResult = await fetchPieChartData({
        body: buildRequestBody(dimensions, 'pie', 'catfinancialview')
      }).unwrap();

      // Fetch donut chart data
      const donutResult = await fetchDonutChartData({
        body: buildRequestBody(dimensions, 'donut', 'cataccountingview')
      }).unwrap();

      // Process and set chart data
      setChartData({
        line: lineResult.success ? lineResult.data || [] : [],
        bar: barResult.success ? barResult.data || [] : [],
        pie: pieResult.success ? pieResult.data || [] : [],
        donut: donutResult.success ? donutResult.data || [] : [],
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

        setDrillDown({
          active: true,
          chartType,
          category,
          title
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
    fetchAllChartData();
  }, [dimensions]);

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard - Victory Charts</h1>
      
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
        <div className="flex gap-2">
          <button 
            onClick={() => setDimensions(null)} 
            className="shadow-xl border bg-red-400 p-2 rounded text-white hover:bg-red-500"
          >
            Reset Group
          </button>
          <button 
            onClick={() => setIsGroupModalOpen(true)} 
            className="shadow-xl border bg-blue-400 p-2 rounded text-white hover:bg-blue-500"
          >
            Create Group
          </button>
          <button 
            onClick={fetchAllChartData} 
            className="shadow-xl border bg-green-400 p-2 rounded text-white hover:bg-green-500"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="flex justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <p onClick={() => setError('')} className="cursor-pointer">x</p>
        </div>
      )}
      
      {isLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p>Loading chart data...</p>
        </div>
      )}

      {drillDown.active ? (
        <div className="mb-8">
          <ChartContainer 
            title={drillDown.title} 
            onBack={resetDrillDown} 
            isDrilled
            data={chartData.drillDown}
          >
            <DrillDownChart data={chartData.drillDown} />
          </ChartContainer>
          <p className="mt-2 text-sm text-gray-500 text-center">
            <i>Click the back button to return to main charts</i>
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ChartContainer title="Revenue Trends" data={chartData.line}>
              <LineChart data={chartData.line} onDrillDown={handleDrillDown} />
            </ChartContainer>

            <ChartContainer title="Revenue vs Expenses" data={chartData.bar}>
              <BarChart data={chartData.bar} onDrillDown={handleDrillDown} />
            </ChartContainer>

            <ChartContainer title="Financial Distribution" data={chartData.pie}>
              <PieChart data={chartData.pie} onDrillDown={handleDrillDown} />
            </ChartContainer>

            <ChartContainer title="Revenue by Category" data={chartData.donut}>
              <DonutChart data={chartData.donut} onDrillDown={handleDrillDown} />
            </ChartContainer>
          </div>
          <p className="mt-4 text-sm text-gray-500 text-center">
            <i>Click on any chart element to drill down into more detailed data</i>
          </p>
        </>
      )}
    </section>
  );
};

// Individual Chart Components
const LineChart: React.FC<{
  data: ChartDataPoint[];
  onDrillDown: (chartType: string, category: string, value: any, dataType: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  return (
    <VictoryChart theme={VictoryTheme.clean} domainPadding={20} height={350} width={800}>
      <VictoryAxis tickFormat={x => x} style={{ tickLabels: { fontSize: 10, angle: -45 } }} />
      <VictoryAxis dependentAxis tickFormat={y => `$${Math.round(y / 1000)}k`} />
      <VictoryLegend
        x={50} y={10} orientation="horizontal" gutter={20}
        style={{ labels: { fontSize: 10 } }}
        data={[
          { name: "Revenue", symbol: { fill: "#4bc0c0" } },
          { name: "Gross Margin", symbol: { fill: "#36a2eb" } },
          { name: "Net Profit", symbol: { fill: "#ff6384" } },
        ]}
      />
      
      {/* Lines for visual representation */}
      <VictoryLine
        data={data} x="period" y="revenue"
        style={{ data: { stroke: "#4bc0c0", strokeWidth: 2 } }}
      />
      <VictoryLine
        data={data} x="period" y="grossMargin"
        style={{ data: { stroke: "#36a2eb", strokeWidth: 2 } }}
      />
      <VictoryLine
        data={data} x="period" y="netProfit"
        style={{ data: { stroke: "#ff6384", strokeWidth: 2 } }}
      />
      
      {/* Invisible scatter points for click detection */}
      <VictoryScatter
        data={data} x="period" y="revenue"
        size={10}
        style={{ data: { fill: "transparent" } }}
        events={[{
          target: "data",
          eventHandlers: {
            onClick: (event, datum) => {
              const clickedPoint = datum.data[datum.index];
              if (clickedPoint && clickedPoint.period) {
                onDrillDown('line', clickedPoint.period, clickedPoint.revenue, 'revenue');
              }
            }
          }
        }]}
      />
      <VictoryScatter
        data={data} x="period" y="grossMargin"
        size={10}
        style={{ data: { fill: "transparent" } }}
        events={[{
          target: "data",
          eventHandlers: {
            onClick: (event, datum) => {
              const clickedPoint = datum.data[datum.index];
              if (clickedPoint && clickedPoint.period) {
                onDrillDown('line', clickedPoint.period, clickedPoint.grossMargin, 'grossMargin');
              }
            }
          }
        }]}
      />
      <VictoryScatter
        data={data} x="period" y="netProfit"
        size={10}
        style={{ data: { fill: "transparent" } }}
        events={[{
          target: "data",
          eventHandlers: {
            onClick: (event, datum) => {
              const clickedPoint = datum.data[datum.index];
              if (clickedPoint && clickedPoint.period) {
                onDrillDown('line', clickedPoint.period, clickedPoint.netProfit, 'netProfit');
              }
            }
          }
        }]}
      />
    </VictoryChart>
  );
};

const BarChart: React.FC<{
  data: ChartDataPoint[];
  onDrillDown: (chartType: string, category: string, value: any, dataType: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  return (
    <VictoryChart theme={VictoryTheme.clean} domainPadding={10} height={350} width={800}>
      <VictoryAxis tickFormat={x => x} style={{ tickLabels: { fontSize: 10, angle: -45 } }} />
      <VictoryAxis dependentAxis tickFormat={y => `$${Math.round(y / 1000)}k`} />
      <VictoryLegend
        x={50} y={10} orientation="horizontal" gutter={20}
        style={{ labels: { fontSize: 10 } }}
        data={[
          { name: "Revenue", symbol: { fill: "#4bc0c0" } },
          { name: "Expenses", symbol: { fill: "#ff6384" } }
        ]}
      />
      <VictoryGroup offset={20} colorScale={["#4bc0c0", "#ff6384"]}>
        <VictoryBar
        labelComponent={<VictoryTooltip />}
          data={data} x="period" y="revenue"
          events={[{
            target: "data",
            eventHandlers: {
              onClick: (event, datum) => {
                onDrillDown('bar', datum.datum.period, datum.datum.revenue, 'revenue');
              }
            }
          }]}
        />
        <VictoryBar
          labelComponent={<VictoryTooltip />}
          data={data} x="period" y="expenses"
          events={[{
            target: "data",
            eventHandlers: {
              onClick: (event, datum) => {
                onDrillDown('bar', datum.datum.period, datum.datum.expenses, 'expenses');
              }
            }
          }]}
        />
      </VictoryGroup>
    </VictoryChart>
  );
};

const PieChart: React.FC<{
  data: ChartDataPoint[];
  onDrillDown: (chartType: string, category: string, value: any, dataType: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  return (
    <VictoryPie
      data={data}
      x="catfinancialview"
      y="revenue"
      colorScale={["#4bc0c0", "#ff6384", "#36a2eb", "#ffce56", "#9966ff", "#ff9f40"]}
      labelRadius={80}
      style={{ labels: { fontSize: 10, fill: "#333" } }}
      labels={({ datum }) => `${datum.catfinancialview}: $${Math.round(datum.revenue / 1000)}k`}
      height={350}
      events={[{
        target: "data",
        eventHandlers: {
          onClick: (event, datum) => {
            onDrillDown('pie', datum.datum.catfinancialview, datum.datum.revenue, 'revenue');
          }
        }
      }]}
    />
  );
};

const DonutChart: React.FC<{
  data: ChartDataPoint[];
  onDrillDown: (chartType: string, category: string, value: any, dataType: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;
  
  // Take top 6 categories for better visibility
  const topCategories = data.slice(0, 6);
  
  return (
    <VictoryPie
      data={topCategories}
      x="cataccountingview" 
      y="revenue"
      colorScale={["#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#36a2eb", "#ff6384"]}
      innerRadius={70} 
      labelRadius={90}
      style={{ labels: { fontSize: 10, fill: "#333" } }}
      labels={({ datum }) => `${datum.cataccountingview}: $${Math.round(datum.revenue / 1000)}k`}
      height={350}
      events={[{
        target: "data",
        eventHandlers: {
          onClick: (event, datum) => {
            onDrillDown('donut', datum.datum.cataccountingview, datum.datum.revenue, 'revenue');
          }
        }
      }]}
    />
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